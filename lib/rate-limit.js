/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-process Next.js standalone deployments.
 * For multi-instance deployments, replace with Redis-backed limiter.
 */

const windows = new Map()

/**
 * Check if a request is within rate limits.
 * @param {string} key - Unique identifier (e.g. IP + route)
 * @param {object} opts
 * @param {number} opts.limit - Max requests per window (default 30)
 * @param {number} opts.windowMs - Window size in ms (default 60_000 = 1 min)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function rateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now()
  let record = windows.get(key)

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs }
  }

  record.count++
  windows.set(key, record)

  // Periodic cleanup to prevent memory leaks
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (now > v.resetAt) windows.delete(k)
    }
  }

  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  }
}

/**
 * Build a rate-limit key from request headers.
 * Uses x-forwarded-for (set by Traefik) or falls back to x-real-ip.
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}
