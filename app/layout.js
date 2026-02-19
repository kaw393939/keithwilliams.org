import { auth, signOut } from '../auth'

export const metadata = {
  title: 'keithwilliams.org — Blog',
  description: 'A minimal Next.js + Postgres blog by Keith Williams.',
}

export default async function RootLayout({ children }) {
  const session = await auth()
  const user = session?.user
  const isAdmin = user?.role === 'admin'

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>K</text></svg>" />
      </head>
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#0b1020',
        color: '#e5e7eb',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        <a
          href="#main"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          Skip to content
        </a>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 18px' }}>
          <header
            role="banner"
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
          >
            <div>
              <a href="/" style={{ color: '#e5e7eb', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
                keithwilliams.org
              </a>
              <div style={{ opacity: 0.6, fontSize: 12, marginTop: 2 }}>Next.js + Postgres blog</div>
            </div>
            <nav
              aria-label="Main navigation"
              style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}
            >
              <a href="/" style={{ color: '#e5e7eb', textDecoration: 'none' }}>Posts</a>
              {isAdmin && (
                <>
                  <a href="/new" style={{ color: '#e5e7eb', textDecoration: 'none' }}>New</a>
                  <a href="/admin" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 12 }}>Admin</a>
                </>
              )}
              {user ? (
                <>
                  <span style={{ opacity: 0.6, fontSize: 12 }}>{user.name || user.email}</span>
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
          <main id="main" role="main" style={{ marginTop: 22, minHeight: '50vh' }}>
            {children}
          </main>
          <footer role="contentinfo" style={{ marginTop: 34, opacity: 0.5, fontSize: 11 }}>
            &copy; {new Date().getFullYear()} keithwilliams.org &mdash; Hosted on the single-server Traefik platform.
          </footer>
        </div>
      </body>
    </html>
  )
}
