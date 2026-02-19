import { Client } from 'pg'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function connectWithRetry() {
  const password = process.env.POSTGRES_PASSWORD
  let lastError

  for (let i = 0; i < 30; i++) {
    const client = new Client({
      host: process.env.PGHOST ?? 'postgres',
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE ?? 'app',
      user: process.env.PGUSER ?? 'app',
      password,
    })

    try {
      await client.connect()
      return client
    } catch (error) {
      lastError = error
      try {
        await client.end()
      } catch {
        // ignore
      }
      await sleep(1000)
    }
  }

  throw lastError
}

const client = await connectWithRetry()

try {
  // ── Auth.js tables ──────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      "emailVerified" TIMESTAMPTZ,
      image TEXT,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      PRIMARY KEY (id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      "providerAccountId" VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at BIGINT,
      id_token TEXT,
      scope TEXT,
      session_state TEXT,
      token_type VARCHAR(255),
      PRIMARY KEY (id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL,
      "sessionToken" VARCHAR(255) NOT NULL UNIQUE,
      PRIMARY KEY (id)
    );

    CREATE TABLE IF NOT EXISTS verification_token (
      identifier TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      PRIMARY KEY (identifier, token)
    );
  `)

  // ── Migration: add role column if missing (idempotent) ──────────────
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
      ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
      END IF;
    END $$;
  `)

  // ── App tables ──────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id BIGSERIAL PRIMARY KEY,
      post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body VARCHAR(5000) NOT NULL,
      flagged BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
  `)

  // ── Seed data ───────────────────────────────────────────────────────
  const count = await client.query('SELECT COUNT(*)::int AS n FROM posts')
  if (count.rows?.[0]?.n === 0) {
    await client.query('INSERT INTO posts (title, body) VALUES ($1, $2)', [
      'Welcome',
      'This is a minimal blog backed by Postgres. Create a new post at /new.',
    ])
  }

  console.log('[init-db] Schema migration complete.')
} finally {
  await client.end()
}
