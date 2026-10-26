import { loadConfig } from './config.js';
import { createPool, createRepository } from './db.js';
import { createTokenService } from './auth.js';
import { createApp } from './app.js';

const config = loadConfig();
const repo = createRepository(createPool(config.db));
await repo.migrate();

const app = createApp({ repo, tokens: createTokenService(config.jwt) });
const server = app.listen(config.port, () => {
  console.log(JSON.stringify({ msg: 'listening', port: config.port }));
});

const shutdown = (signal) => {
  console.log(JSON.stringify({ msg: 'shutting down', signal }));
  server.close(async () => {
    await repo.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
