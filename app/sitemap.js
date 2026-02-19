import { query } from '../lib/db'

export default async function sitemap() {
  const result = await query(
    'SELECT id, created_at FROM posts ORDER BY created_at DESC LIMIT 1000'
  )

  const postUrls = result.rows.map((post) => ({
    url: `https://keithwilliams.org/posts/${post.id}`,
    lastModified: new Date(post.created_at),
  }))

  return [
    {
      url: 'https://keithwilliams.org',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postUrls,
  ]
}
