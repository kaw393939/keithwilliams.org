import { query } from '../lib/db'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Posts — keithwilliams.org',
  description: 'Latest blog posts by Keith Williams.',
}

async function getPosts() {
  const result = await query(
    `SELECT p.id, p.title, p.body, p.created_at, u.name AS author_name
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     ORDER BY p.created_at DESC LIMIT 50`
  )
  return result.rows
}

export default async function Page() {
  const posts = await getPosts()

  return (
    <div>
      <h1 style={{ margin: '0 0 14px 0' }}>Posts</h1>
      {posts.length === 0 ? (
        <div style={{ opacity: 0.85 }}>No posts yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }} role="feed" aria-label="Blog posts">
          {posts.map((p) => (
            <article
              key={p.id}
              style={{
                border: '1px solid rgba(229,231,235,0.15)',
                borderRadius: 12,
                padding: 14,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <h2 style={{ fontSize: 16, margin: 0 }}>
                  <a
                    href={`/posts/${p.id}`}
                    style={{ color: '#e5e7eb', textDecoration: 'none' }}
                  >
                    {p.title}
                  </a>
                </h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexShrink: 0 }}>
                  {p.author_name && (
                    <span style={{ opacity: 0.65, fontSize: 11 }}>{p.author_name}</span>
                  )}
                  <time style={{ opacity: 0.6, fontSize: 11 }} dateTime={p.created_at}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <p style={{ margin: '10px 0 0 0', whiteSpace: 'pre-wrap', opacity: 0.88, fontSize: 14, lineHeight: 1.5 }}>
                {p.body.length > 300 ? p.body.slice(0, 300) + '...' : p.body}
              </p>
              {p.body.length > 300 && (
                <a
                  href={`/posts/${p.id}`}
                  style={{ color: '#60a5fa', fontSize: 12, textDecoration: 'none', marginTop: 6, display: 'inline-block' }}
                >
                  Read more &rarr;
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
