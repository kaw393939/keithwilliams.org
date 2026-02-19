import './globals.css'

import { auth, signOut } from '../auth'

import { Button } from '../components/ui/button'

export const metadata = {
  title: 'keithwilliams.org — Blog',
  description: 'A minimal Next.js + Postgres blog by Keith Williams.',
}

export default async function RootLayout({ children }) {
  const session = await auth()
  const user = session?.user
  const isAdmin = user?.role === 'admin'

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>K</text></svg>" />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <div className="container py-10">
          <header
            role="banner"
            className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
          >
            <div>
              <a href="/" className="text-sm font-semibold uppercase tracking-[0.22em]">
                keithwilliams.org
              </a>
              <div className="mt-2 text-xs text-muted-foreground">
                Next.js + Postgres blog
              </div>
            </div>
            <nav
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-1"
            >
              <Button asChild variant="ghost" size="sm">
                <a href="/">Posts</a>
              </Button>
              {isAdmin && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <a href="/new">New</a>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <a href="/admin">Admin</a>
                  </Button>
                </>
              )}
              {user ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    {user.name || user.email}
                  </span>
                  <form
                    action={async () => {
                      'use server'
                      await signOut({ redirectTo: '/' })
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <a href="/login">Sign in</a>
                </Button>
              )}
            </nav>
          </header>
          <main id="main" role="main" className="mt-10 min-h-[50vh]">
            {children}
          </main>
          <footer role="contentinfo" className="mt-12 border-t pt-6 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} keithwilliams.org &mdash; Hosted on the single-server Traefik platform.
          </footer>
        </div>
      </body>
    </html>
  )
}
