import { notFound } from 'next/navigation'
import { auth } from '../../../auth'
import { query } from '../../../lib/db'
import { HoneypotFields } from '../../../lib/honeypot'
import { LIMITS } from '../../../lib/validate'
import { createComment, deleteComment } from './actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { id } = await params
  const result = await query('SELECT title FROM posts WHERE id = $1', [id])
  const post = result.rows[0]
  if (!post) return { title: 'Post not found' }
  return {
    title: `${post.title} — keithwilliams.org`,
    description: post.title,
  }
}

export default async function PostPage({ params }) {
  const { id } = await params
  const session = await auth()
  const user = session?.user

  const postResult = await query(
    `SELECT p.id, p.title, p.body, p.created_at, p.author_id,
            u.name AS author_name, u.image AS author_image
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.id = $1`,
    [id]
  )
  const post = postResult.rows[0]
  if (!post) notFound()

  const commentsResult = await query(
    `SELECT c.id, c.body, c.created_at, c.author_id,
            u.name AS author_name, u.image AS author_image
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [id]
  )
  const comments = commentsResult.rows

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      <a href="/" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none' }}>
        &larr; All posts
      </a>

      <article style={{ marginTop: 14 }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: 22, lineHeight: 1.3 }}>{post.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
          {post.author_name && <span>by {post.author_name}</span>}
          <time>{new Date(post.created_at).toLocaleString()}</time>
        </div>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, opacity: 0.92 }}>{post.body}</div>
      </article>

      {/* Comments Section */}
      <section style={{ marginTop: 30, borderTop: '1px solid rgba(229,231,235,0.15)', paddingTop: 20 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 14px 0' }}>
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 13 }}>No comments yet. Be the first to comment.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '10px 14px',
                  border: '1px solid rgba(229,231,235,0.1)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.author_image && (
                      <img
                        src={c.author_image}
                        alt=""
                        width={20}
                        height={20}
                        style={{ borderRadius: '50%' }}
                        loading="lazy"
                      />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author_name || 'Anonymous'}</span>
                    <time style={{ fontSize: 11, opacity: 0.6 }}>
                      {new Date(c.created_at).toLocaleString()}
                    </time>
                  </div>
                  {isAdmin && (
                    <form action={deleteComment}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <input type="hidden" name="postId" value={id} />
                      <button
                        type="submit"
                        title="Delete comment"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: '2px 6px',
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', opacity: 0.9 }}>{c.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form — only for authenticated users */}
        {user ? (
          <form
            action={createComment}
            style={{
              marginTop: 16,
              display: 'grid',
              gap: 8,
              position: 'relative',
            }}
          >
            <input type="hidden" name="postId" value={id} />
            <HoneypotFields />
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Add a comment</span>
              <textarea
                name="body"
                rows={3}
                required
                maxLength={LIMITS.COMMENT_BODY}
                placeholder="Write a comment..."
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid rgba(229,231,235,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#e5e7eb',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid rgba(229,231,235,0.2)',
                background: 'rgba(229,231,235,0.10)',
                color: '#e5e7eb',
                cursor: 'pointer',
                justifySelf: 'start',
                fontSize: 13,
              }}
            >
              Post comment
            </button>
          </form>
        ) : (
          <p style={{ marginTop: 14, fontSize: 13, opacity: 0.7 }}>
            <a href="/login" style={{ color: '#60a5fa' }}>Sign in</a> to leave a comment.
          </p>
        )}
      </section>
    </div>
  )
}
