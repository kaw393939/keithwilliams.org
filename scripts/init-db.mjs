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
  // Auth.js tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      "emailVerified" TIMESTAMPTZ,
      image TEXT,
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

  // App tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  const count = await client.query('SELECT COUNT(*)::int AS n FROM posts')
  if (count.rows?.[0]?.n === 0) {
    await client.query('INSERT INTO posts (title, body) VALUES ($1, $2)', [
      'Welcome',
      'This is a minimal blog backed by Postgres. Create a new post at /new.',
    ])
  }
} finally {
  await client.end()
}
