import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { query } from '../../lib/db'
import { changeUserRole, deletePost, deleteCommentAdmin } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin — keithwilliams.org',
  robots: 'noindex, nofollow',
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/')
  }

  const usersResult = await query('SELECT id, name, email, role, image FROM users ORDER BY id')
  const postsResult = await query(
    `SELECT p.id, p.title, p.created_at, u.name AS author_name
     FROM posts p LEFT JOIN users u ON p.author_id = u.id
     ORDER BY p.created_at DESC LIMIT 100`
  )
  const commentsResult = await query(
    `SELECT c.id, c.body, c.post_id, c.flagged, c.created_at,
            u.name AS author_name
     FROM comments c
     JOIN users u ON c.author_id = u.id
     ORDER BY c.created_at DESC LIMIT 100`
  )

  const users = usersResult.rows
  const posts = postsResult.rows
  const comments = commentsResult.rows

  const sectionStyle = {
    marginBottom: 28,
    border: '1px solid rgba(229,231,235,0.12)',
    borderRadius: 10,
    padding: 16,
    background: 'rgba(255,255,255,0.02)',
  }
  const tableHeaderStyle = {
    textAlign: 'left',
    padding: '6px 10px',
    fontSize: 11,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(229,231,235,0.12)',
  }
  const cellStyle = {
    padding: '8px 10px',
    fontSize: 13,
    borderBottom: '1px solid rgba(229,231,235,0.06)',
    verticalAlign: 'middle',
  }
  const btnStyle = {
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid rgba(229,231,235,0.2)',
    background: 'none',
    color: '#e5e7eb',
    cursor: 'pointer',
    fontSize: 11,
  }
  const dangerBtn = { ...btnStyle, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }

  return (
    <div>
      <h1 style={{ margin: '0 0 18px 0', fontSize: 20 }}>Admin Dashboard</h1>

      {/* Users */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 15, margin: '0 0 10px 0' }}>Users ({users.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Role</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={cellStyle}>{u.id}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.image && (
                        <img src={u.image} alt="" width={18} height={18} style={{ borderRadius: '50%' }} loading="lazy" />
                      )}
                      {u.name || '—'}
                    </div>
                  </td>
                  <td style={cellStyle}>{u.email}</td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: u.role === 'admin' ? 'rgba(96,165,250,0.15)' : 'rgba(229,231,235,0.08)',
                      color: u.role === 'admin' ? '#60a5fa' : '#9ca3af',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    {u.id !== session.user.id && (
                      <form action={changeUserRole} style={{ display: 'inline' }}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value={u.role === 'admin' ? 'user' : 'admin'} />
                        <button type="submit" style={btnStyle}>
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Posts */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 15, margin: '0 0 10px 0' }}>Posts ({posts.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Title</th>
                <th style={tableHeaderStyle}>Author</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td style={cellStyle}>{p.id}</td>
                  <td style={cellStyle}>
                    <a href={`/posts/${p.id}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                      {p.title}
                    </a>
                  </td>
                  <td style={cellStyle}>{p.author_name || '—'}</td>
                  <td style={cellStyle} style={{ ...cellStyle, fontSize: 11, opacity: 0.7 }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td style={cellStyle}>
                    <form action={deletePost} style={{ display: 'inline' }}>
                      <input type="hidden" name="postId" value={p.id} />
                      <button type="submit" style={dangerBtn}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comments */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 15, margin: '0 0 10px 0' }}>Comments ({comments.length})</h2>
        {comments.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 13 }}>No comments yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>ID</th>
                  <th style={tableHeaderStyle}>Post</th>
                  <th style={tableHeaderStyle}>Author</th>
                  <th style={tableHeaderStyle}>Body</th>
                  <th style={tableHeaderStyle}>Flagged</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td style={cellStyle}>{c.id}</td>
                    <td style={cellStyle}>
                      <a href={`/posts/${c.post_id}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        #{c.post_id}
                      </a>
                    </td>
                    <td style={cellStyle}>{c.author_name || '—'}</td>
                    <td style={{ ...cellStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.body.slice(0, 80)}{c.body.length > 80 ? '...' : ''}
                    </td>
                    <td style={cellStyle}>{c.flagged ? '⚠️' : '—'}</td>
                    <td style={cellStyle}>
                      <form action={deleteCommentAdmin} style={{ display: 'inline' }}>
                        <input type="hidden" name="commentId" value={c.id} />
                        <button type="submit" style={dangerBtn}>Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
