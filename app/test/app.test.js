import { test, beforeEach } from 'node:test';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { createTokenService } from '../src/auth.js';

const PASSWORD = 'correct-horse-battery-staple';
const silentLogger = { log() {}, error() {} };

function createFakeRepo() {
  const users = [
    { id: 1, email: 'alice@example.com', password_hash: bcrypt.hashSync(PASSWORD, 4) },
    { id: 2, email: 'bob@example.com', password_hash: bcrypt.hashSync(PASSWORD, 4) },
  ];
  const items = [];
  return {
    async ping() {},
    async findUserByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async listItems(ownerId) {
      return items.filter((i) => i.owner_id === ownerId).map(({ owner_id: _o, ...i }) => i);
    },
    async getItem(ownerId, id) {
      const item = items.find((i) => i.owner_id === ownerId && i.id === id);
      if (!item) return null;
      const { owner_id: _o, ...rest } = item;
      return rest;
    },
    async createItem(ownerId, { name, description }) {
      const item = { id: items.length + 1, owner_id: ownerId, name, description };
      items.push(item);
      const { owner_id: _o, ...rest } = item;
      return rest;
    },
    async searchItems(ownerId, term) {
      return (await this.listItems(ownerId)).filter((i) => i.name.includes(term));
    },
  };
}

let app;

beforeEach(() => {
  const tokens = createTokenService({
    secret: randomBytes(32).toString('hex'),
    expiresInMs: 60000,
    issuer: 'items-api-test',
  });
  app = createApp({ repo: createFakeRepo(), tokens, logger: silentLogger, loginRateLimit: 100 });
});

async function login(email) {
  const res = await request(app).post('/auth/login').send({ email, password: PASSWORD });
  return res.body.token;
}

test('health returns ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('security headers are set and x-powered-by is hidden', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.ok(res.headers['content-security-policy']);
  assert.ok(res.headers['strict-transport-security']);
  assert.equal(res.headers['x-powered-by'], undefined);
});

test('login rejects wrong password', async () => {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'alice@example.com', password: 'wrong-password' });
  assert.equal(res.status, 401);
  assert.equal(res.body.token, undefined);
});

test('login rejects unknown user with the same response', async () => {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'nobody@example.com', password: PASSWORD });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: 'invalid_credentials' });
});

test('login rejects malformed body', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'not-an-email' });
  assert.equal(res.status, 400);
});

test('invalid JSON returns 400 without stack trace', async () => {
  const res = await request(app)
    .post('/auth/login')
    .set('content-type', 'application/json')
    .send('{"email":');
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'invalid_request' });
});

test('items require a bearer token', async () => {
  const res = await request(app).get('/items');
  assert.equal(res.status, 401);
});

test('items reject a tampered token', async () => {
  const token = await login('alice@example.com');
  const res = await request(app)
    .get('/items')
    .set('authorization', `Bearer ${token.slice(0, -2)}xx`);
  assert.equal(res.status, 401);
});

test('create and list items for the logged in user', async () => {
  const token = await login('alice@example.com');
  const created = await request(app)
    .post('/items')
    .set('authorization', `Bearer ${token}`)
    .send({ name: 'Laptop', description: 'Work laptop' });
  assert.equal(created.status, 201);
  assert.equal(created.body.name, 'Laptop');

  const list = await request(app).get('/items').set('authorization', `Bearer ${token}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
});

test('create item validates input', async () => {
  const token = await login('alice@example.com');
  const res = await request(app)
    .post('/items')
    .set('authorization', `Bearer ${token}`)
    .send({ name: '' });
  assert.equal(res.status, 400);
});

test('users cannot read items owned by someone else', async () => {
  const alice = await login('alice@example.com');
  const bob = await login('bob@example.com');
  const created = await request(app)
    .post('/items')
    .set('authorization', `Bearer ${alice}`)
    .send({ name: 'Private' });

  const res = await request(app)
    .get(`/items/${created.body.id}`)
    .set('authorization', `Bearer ${bob}`);
  assert.equal(res.status, 404);
});

test('unknown routes return 404', async () => {
  const res = await request(app).get('/does-not-exist');
  assert.equal(res.status, 404);
});
