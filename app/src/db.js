import pg from 'pg';

export function createPool(dbConfig) {
  return new pg.Pool({
    ...dbConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export function createRepository(pool) {
  return {
    async migrate() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    },

    async ping() {
      await pool.query('SELECT 1');
    },

    async findUserByEmail(email) {
      const { rows } = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email],
      );
      return rows[0] ?? null;
    },

    async upsertUser(email, passwordHash) {
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id, email`,
        [email, passwordHash],
      );
      return rows[0];
    },

    async listItems(ownerId) {
      const { rows } = await pool.query(
        'SELECT id, name, description, created_at FROM items WHERE owner_id = $1 ORDER BY id',
        [ownerId],
      );
      return rows;
    },

    async getItem(ownerId, id) {
      const { rows } = await pool.query(
        'SELECT id, name, description, created_at FROM items WHERE owner_id = $1 AND id = $2',
        [ownerId, id],
      );
      return rows[0] ?? null;
    },

    async createItem(ownerId, { name, description }) {
      const { rows } = await pool.query(
        `INSERT INTO items (owner_id, name, description) VALUES ($1, $2, $3)
         RETURNING id, name, description, created_at`,
        [ownerId, name, description],
      );
      return rows[0];
    },

    async searchItems(ownerId, term) {
      const { rows } = await pool.query(
        'SELECT id, name, description, created_at FROM items WHERE owner_id = $1 AND name ILIKE $2 ORDER BY id',
        [ownerId, `%${term}%`],
      );
      return rows;
    },

    async close() {
      await pool.end();
    },
  };
}
