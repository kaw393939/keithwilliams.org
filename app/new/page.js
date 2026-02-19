import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { createPost } from './actions'
import { HoneypotFields } from '../../lib/honeypot'
import { LIMITS } from '../../lib/validate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'New Post — keithwilliams.org',
  robots: 'noindex, nofollow',
}

export default async function NewPostPage({ searchParams }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  if (session.user.role !== 'admin') {
    redirect('/')
  }

  const sp = await searchParams
  const error = sp?.error

  return (
    <div>
      <h1 style={{ margin: '0 0 14px 0' }}>New post</h1>
      {error === 'missing' && (
        <div role="alert" style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13 }}>
          Title and body are required.
        </div>
      )}
      {error === 'validation' && (
        <div role="alert" style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13 }}>
          Input exceeds maximum length.
        </div>
      )}
      {error === 'rate_limit' && (
        <div role="alert" style={{ marginBottom: 12, color: '#fca5a5', fontSize: 13 }}>
          Too many requests. Please wait a moment.
        </div>
      )}

      <form action={createPost} style={{ display: 'grid', gap: 10, position: 'relative' }}>
        <HoneypotFields />
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>Title</span>
          <input
            name="title"
            required
            maxLength={LIMITS.POST_TITLE}
            placeholder="Hello world"
            autoComplete="off"
            style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(229,231,235,0.2)', background: 'rgba(255,255,255,0.03)', color: '#e5e7eb' }}
          />
          <span style={{ fontSize: 11, opacity: 0.5 }}>Max {LIMITS.POST_TITLE} characters</span>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>Body</span>
          <textarea
            name="body"
            rows={8}
            required
            maxLength={LIMITS.POST_BODY}
            placeholder="Write something..."
            style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(229,231,235,0.2)', background: 'rgba(255,255,255,0.03)', color: '#e5e7eb', resize: 'vertical' }}
          />
          <span style={{ fontSize: 11, opacity: 0.5 }}>Max {LIMITS.POST_BODY.toLocaleString()} characters</span>
        </label>
        <button
          type="submit"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(229,231,235,0.2)',
            background: 'rgba(229,231,235,0.10)',
            color: '#e5e7eb',
            cursor: 'pointer',
            justifySelf: 'start',
          }}
        >
          Create
        </button>
      </form>
    </div>
  )
}
