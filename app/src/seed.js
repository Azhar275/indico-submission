import bcrypt from 'bcryptjs';
import { loadConfig } from './config.js';
import { createPool, createRepository } from './db.js';

const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;
if (!email || !password) {
  console.error('SEED_USER_EMAIL and SEED_USER_PASSWORD are required');
  process.exit(1);
}

const config = loadConfig();
const repo = createRepository(createPool(config.db));
await repo.migrate();
const user = await repo.upsertUser(email.toLowerCase(), await bcrypt.hash(password, 12));
console.log(JSON.stringify({ msg: 'seeded user', id: user.id }));
await repo.close();
