'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { query } from '../../lib/db'

/**
 * Require current session to have admin role.
 * Redirects to home if not admin.
 */
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/')
  }
  return session
}

/**
 * Change a user's role (admin or user). Only admins can do this.
 * Cannot change your own role (prevents accidental lockout).
 */
export async function changeUserRole(formData) {
  const session = await requireAdmin()

  const userId = Number(formData.get('userId'))
  const role = String(formData.get('role'))

  // Validate role value
  if (!['admin', 'user'].includes(role)) {
    redirect('/admin')
  }

  // Prevent self-demotion
  if (userId === session.user.id) {
    redirect('/admin')
  }

  await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId])
  redirect('/admin')
}

/**
 * Delete a post and all its comments (CASCADE). Admin only.
 */
export async function deletePost(formData) {
  await requireAdmin()

  const postId = Number(formData.get('postId'))
  if (!postId) redirect('/admin')

  await query('DELETE FROM posts WHERE id = $1', [postId])
  redirect('/admin')
}

/**
 * Delete a comment. Admin only.
 */
export async function deleteCommentAdmin(formData) {
  await requireAdmin()

  const commentId = Number(formData.get('commentId'))
  if (!commentId) redirect('/admin')

  await query('DELETE FROM comments WHERE id = $1', [commentId])
  redirect('/admin')
}
