'use server'

import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { ensureSchema, query } from '../../lib/db'

export async function createPost(formData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!title || !body) {
    redirect('/new?error=missing')
  }

  await ensureSchema()
  await query('INSERT INTO posts (title, body, author_id) VALUES ($1, $2, $3)', [
    title,
    body,
    session.user.id,
  ])

  redirect('/')
}
