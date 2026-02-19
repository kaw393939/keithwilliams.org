import { auth, signOut } from '../auth'

export const metadata = {
  title: 'keithwilliams.org — Blog',
  description: 'A minimal Next.js + Postgres blog on the single-server platform.',
}

export default async function RootLayout({ children }) {
  const session = await auth()
  const user = session?.user

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0b1020', color: '#e5e7eb' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 18px' }}>
          <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>keithwilliams.org</div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Next.js + Postgres demo blog</div>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14 }}>
              <a href="/" style={{ color: '#e5e7eb' }}>Posts</a>
              {user ? (
                <>
                  <a href="/new" style={{ color: '#e5e7eb' }}>New</a>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{user.name || user.email}</span>
                  <form
                    action={async () => {
                      'use server'
                      await signOut({ redirectTo: '/' })
                    }}
                    style={{ display: 'inline' }}
                  >
                    <button
                      type="submit"
                      style={{
                        background: 'none',
                        border: '1px solid rgba(229,231,235,0.2)',
                        color: '#e5e7eb',
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <a
                  href="/login"
                  style={{
                    color: '#e5e7eb',
                    border: '1px solid rgba(229,231,235,0.2)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 12,
                  }}
                >
                  Sign in
                </a>
              )}
            </nav>
          </header>
          <main style={{ marginTop: 22 }}>{children}</main>
          <footer style={{ marginTop: 34, opacity: 0.75, fontSize: 12 }}>
            Hosted on the single-server Traefik platform.
          </footer>
        </div>
      </body>
    </html>
  )
}
