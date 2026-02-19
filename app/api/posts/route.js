import { query } from '../../../lib/db'
import { rateLimit, getClientIp } from '../../../lib/rate-limit'

export async function GET(request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request)
  const rl = rateLimit(`api:posts:${ip}`, { limit: 60, windowMs: 60_000 })

  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const result = await query(
    `SELECT p.id, p.title, p.body, p.created_at, u.name AS author_name
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     ORDER BY p.created_at DESC LIMIT 50`
  )

  return Response.json(
    { posts: result.rows },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    }
  )
}

/**
 * Reject all non-GET methods explicitly.
 */
export async function POST() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 })
}

export async function PUT() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 })
}

export async function DELETE() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 })
}

export async function PATCH() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 })
}
