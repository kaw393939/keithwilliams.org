import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function connectWithRetry() {
  const password = process.env.POSTGRES_PASSWORD
  let lastError

  if (!password) {
    throw new Error('Missing env var POSTGRES_PASSWORD')
  }

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

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum_sha256 TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT filename, checksum_sha256 FROM schema_migrations ORDER BY filename ASC'
  )
  const map = new Map()
  for (const row of result.rows) {
    map.set(row.filename, row.checksum_sha256)
  }
  return map
}

async function readMigrationFiles(migrationsDir) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.match(/^[0-9]{4}_.+\.sql$/))
    .map((e) => e.name)
    .sort()

  return files
}

async function applyMigration(client, migrationsDir, filename) {
  const fullPath = path.join(migrationsDir, filename)
  const sql = await fs.readFile(fullPath, 'utf8')
  const checksum = sha256(sql)

  await client.query('BEGIN')
  try {
    await client.query(sql)
    await client.query(
      'INSERT INTO schema_migrations (filename, checksum_sha256) VALUES ($1, $2)',
      [filename, checksum]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }

  // eslint-disable-next-line no-console
  console.log(`[migrate] applied ${filename}`)
}

async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const migrationsDir = path.resolve(__dirname, '..', 'migrations')

  const client = await connectWithRetry()

  // Advisory lock to prevent concurrent migrations.
  // Single-instance today, but this keeps the process safe if it ever changes.
  const lockId = 914_275_001

  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockId])

    await ensureMigrationsTable(client)
    const applied = await getAppliedMigrations(client)
    const files = await readMigrationFiles(migrationsDir)

    for (const filename of files) {
      const fullPath = path.join(migrationsDir, filename)
      const sql = await fs.readFile(fullPath, 'utf8')
      const checksum = sha256(sql)

      const existing = applied.get(filename)
      if (existing) {
        if (existing !== checksum) {
          throw new Error(
            `Migration checksum mismatch for ${filename}. Applied=${existing} Current=${checksum}. Refusing to continue.`
          )
        }
        continue
      }

      await applyMigration(client, migrationsDir, filename)
    }

    // eslint-disable-next-line no-console
    console.log('[migrate] up-to-date')
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [lockId])
    } catch {
      // ignore
    }
    await client.end()
  }
}

await main()
