import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

export function authRouter({ repo, tokens, loginRateLimit = 10 }) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: loginRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'too_many_requests' },
  });

  router.post('/login', limiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    const { email, password } = parsed.data;
    const user = await repo.findUserByEmail(email.toLowerCase());
    const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !valid) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    return res.json({ token: tokens.issue(user), tokenType: 'Bearer' });
  });

  return router;
}
