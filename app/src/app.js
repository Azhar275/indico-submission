import express from 'express';
import helmet from 'helmet';
import { requireAuth } from './auth.js';
import { authRouter } from './routes/auth.js';
import { itemsRouter } from './routes/items.js';

export function createApp({ repo, tokens, logger = console, loginRateLimit }) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '10kb', inflate: false }));

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      logger.log(
        JSON.stringify({
          method: req.method,
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          durationMs: Number(process.hrtime.bigint() - start) / 1e6,
        }),
      );
    });
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', async (req, res) => {
    try {
      await repo.ping();
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/auth', authRouter({ repo, tokens, loginRateLimit }));
  app.use('/items', requireAuth(tokens), itemsRouter({ repo }));

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err.expose && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: 'invalid_request' });
    }
    logger.error(JSON.stringify({ error: err.message, path: req.path }));
    return res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
