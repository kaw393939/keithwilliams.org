import { Client } from 'pg'

function usage(exitCode = 1) {
  const msg = `
Usage:
  node scripts/admin.mjs list-users [--limit 50]
  node scripts/admin.mjs set-role --email <email> --role <admin|user>
  node scripts/admin.mjs promote --email <email>
  node scripts/admin.mjs demote --email <email>

Notes:
  - Requires DB env vars (PGHOST/PGPORT/PGDATABASE/PGUSER/POSTGRES_PASSWORD).
  - Intended as a break-glass admin tool (run on server via docker exec).
`.trim()

  // eslint-disable-next-line no-console
  console.error(msg)
  process.exit(exitCode)
}

function getFlagValue(argv, flag) {
  const idx = argv.indexOf(flag)
  if (idx === -1) return undefined
  const value = argv[idx + 1]
  if (!value || value.startsWith('--')) return undefined
  return value
}

function requireFlag(argv, flag) {
  const value = getFlagValue(argv, flag)
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`Missing required flag: ${flag}`)
    usage(2)
  }
  return value
}

async function connect() {
  const password = process.env.POSTGRES_PASSWORD
  if (!password) {
    // eslint-disable-next-line no-console
    console.error('Missing env var: POSTGRES_PASSWORD')
    process.exit(2)
  }

  const client = new Client({
    host: process.env.PGHOST ?? 'postgres',
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? 'app',
    user: process.env.PGUSER ?? 'app',
    password,
  })

  await client.connect()
  return client
}

async function main() {
  const argv = process.argv.slice(2)
  const command = argv[0]

  if (!command || command === '-h' || command === '--help') usage(0)

  const client = await connect()

  try {
    if (command === 'list-users') {
      const limitRaw = getFlagValue(argv, '--limit') ?? '50'
      const limit = Math.max(1, Math.min(500, Number(limitRaw)))

      const result = await client.query(
        'SELECT id, email, role, name FROM users ORDER BY id ASC LIMIT $1',
        [limit]
      )

      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ users: result.rows }, null, 2))
      return
    }

    if (command === 'set-role' || command === 'promote' || command === 'demote') {
      const email = requireFlag(argv, '--email').toLowerCase()
      const role =
        command === 'promote'
          ? 'admin'
          : command === 'demote'
            ? 'user'
            : requireFlag(argv, '--role')

      if (role !== 'admin' && role !== 'user') {
        // eslint-disable-next-line no-console
        console.error('Invalid role. Allowed: admin|user')
        process.exit(2)
      }

      const result = await client.query(
        'UPDATE users SET role = $1 WHERE lower(email) = $2 RETURNING id, email, role',
        [role, email]
      )

      if (result.rowCount === 0) {
        // eslint-disable-next-line no-console
        console.error(`No user found with email: ${email}`)
        process.exit(3)
      }

      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ updated: result.rows[0] }, null, 2))
      return
    }

    // eslint-disable-next-line no-console
    console.error(`Unknown command: ${command}`)
    usage(2)
  } finally {
    await client.end()
  }
}

await main()
