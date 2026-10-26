import { readFileSync } from 'node:fs';

const REQUIRED = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

export function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  let ssl = false;
  if (env.DB_SSL === 'true') {
    ssl = { rejectUnauthorized: true };
    if (env.DB_SSL_CA_PATH) {
      ssl.ca = readFileSync(env.DB_SSL_CA_PATH, 'utf8');
    }
  }

  return {
    port: Number(env.PORT ?? 3000),
    db: {
      host: env.DB_HOST,
      port: Number(env.DB_PORT ?? 5432),
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresInMs: Number(env.JWT_EXPIRES_IN_MS ?? 15 * 60 * 1000),
      issuer: env.JWT_ISSUER ?? 'items-api',
    },
  };
}
