import { query } from '../lib/db'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  let postUrls = []

  try {
    const result = await query(
      'SELECT id, created_at FROM posts ORDER BY created_at DESC LIMIT 1000'
    )
    postUrls = result.rows.map((post) => ({
      url: `https://keithwilliams.org/posts/${post.id}`,
      lastModified: new Date(post.created_at),
    }))
  } catch {
    // DB not available (build-time) — return static entries only
  }

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
