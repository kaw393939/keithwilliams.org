import { query } from '../lib/db'

import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Posts
        </h1>
      </div>

      {posts.length === 0 ? (
        <div className="text-sm text-muted-foreground">No posts yet.</div>
      ) : (
        <div className="grid gap-3" role="feed" aria-label="Blog posts">
          {posts.map((p) => (
            <article key={p.id}>
              <Card>
                <CardHeader className="space-y-3">
                  <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-4">
                    <CardTitle className="text-lg font-medium tracking-tight">
                      <a href={`/posts/${p.id}`} className="hover:underline">
                        {p.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="text-xs font-mono uppercase tracking-wide">
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        {p.author_name ? <span>{p.author_name}</span> : null}
                        <time dateTime={p.created_at}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </time>
                      </div>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                    {p.body.length > 300 ? p.body.slice(0, 300) + '...' : p.body}
                  </p>
                  {p.body.length > 300 ? (
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      <a href={`/posts/${p.id}`}>Read more →</a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
