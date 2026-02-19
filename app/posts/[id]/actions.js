'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import { query } from '../../../lib/db'
import { validateHoneypot } from '../../../lib/honeypot'
import { sanitize, validateComment } from '../../../lib/validate'
import { rateLimit, getClientIp } from '../../../lib/rate-limit'
import { headers } from 'next/headers'

/**
 * Create a comment on a post.
 * Requires authentication (any role). Protected by honeypot + rate limiter.
 */
export async function createComment(formData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const postId = formData.get('postId')
  if (!postId) redirect('/')

  // Honeypot check
  const hp = validateHoneypot(formData)
  if (!hp.ok) {
    // Silently redirect — don't reveal detection to bots
    redirect(`/posts/${postId}`)
  }

  // Rate limit: 10 comments per minute per user
  const rl = rateLimit(`comment:${session.user.id}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    redirect(`/posts/${postId}?error=rate_limit`)
  }

  const body = sanitize(formData.get('body'))
  const errors = validateComment(body)
  if (errors.length > 0) {
    redirect(`/posts/${postId}?error=validation`)
  }

  await query(
    'INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3)',
    [postId, session.user.id, body]
  )

  redirect(`/posts/${postId}`)
}

/**
 * Delete a comment. Requires admin role.
 */
export async function deleteComment(formData) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/')
  }

  const commentId = formData.get('commentId')
  const postId = formData.get('postId')
  if (!commentId) redirect('/')

  await query('DELETE FROM comments WHERE id = $1', [commentId])

  redirect(postId ? `/posts/${postId}` : '/')
}
