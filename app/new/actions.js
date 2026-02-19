'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { query } from '../../lib/db'
import { validateHoneypot } from '../../lib/honeypot'
import { sanitize, validatePost } from '../../lib/validate'
import { rateLimit } from '../../lib/rate-limit'

export async function createPost(formData) {
  // Auth + role check: only admins can create posts
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Honeypot: silently reject bots
  const hp = validateHoneypot(formData)
  if (!hp.ok) {
    redirect('/')
  }

  // Rate limit: 5 posts per minute per user
  const rl = rateLimit(`post:${session.user.id}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    redirect('/new?error=rate_limit')
  }

  const title = sanitize(formData.get('title'))
  const body = sanitize(formData.get('body'))

  // Validate inputs
  const errors = validatePost(title, body)
  if (errors.length > 0) {
    if (!title || !body) redirect('/new?error=missing')
    redirect('/new?error=validation')
  }

  await query('INSERT INTO posts (title, body, author_id) VALUES ($1, $2, $3)', [
    title,
    body,
    session.user.id,
  ])

  redirect('/')
}
