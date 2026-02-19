import { notFound } from 'next/navigation'
import { auth } from '../../../auth'
import { query } from '../../../lib/db'
import { HoneypotFields } from '../../../lib/honeypot'
import { LIMITS } from '../../../lib/validate'
import { createComment, deleteComment } from './actions'

import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Textarea } from '../../../components/ui/textarea'

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
    <div className="space-y-8">
      <Button asChild variant="link" size="sm" className="h-auto px-0">
        <a href="/">← All posts</a>
      </Button>

      <article className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <div className="text-xs text-muted-foreground">
            <span className="inline-flex flex-wrap items-center gap-2">
              {post.author_name ? <span>by {post.author_name}</span> : null}
              <time>{new Date(post.created_at).toLocaleString()}</time>
            </span>
          </div>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {post.body}
        </div>
      </article>

      <section className="space-y-4 border-t pt-6">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            Comments ({comments.length})
          </h2>
        </div>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <div className="grid gap-3">
            {comments.map((c) => (
              <Card key={c.id}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {c.author_image ? (
                        <img
                          src={c.author_image}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full"
                          loading="lazy"
                        />
                      ) : null}
                      <CardTitle className="text-sm">
                        {c.author_name || 'Anonymous'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        <time>{new Date(c.created_at).toLocaleString()}</time>
                      </CardDescription>
                    </div>
                    {isAdmin ? (
                      <form action={deleteComment}>
                        <input type="hidden" name="commentId" value={c.id} />
                        <input type="hidden" name="postId" value={id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {c.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {user ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a comment</CardTitle>
              <CardDescription className="text-xs">
                Max {LIMITS.COMMENT_BODY.toLocaleString()} characters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createComment} className="grid gap-3">
                <input type="hidden" name="postId" value={id} />
                <HoneypotFields />
                <Textarea
                  name="body"
                  rows={3}
                  required
                  maxLength={LIMITS.COMMENT_BODY}
                  placeholder="Write a comment..."
                />
                <div>
                  <Button type="submit">Post comment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="underline underline-offset-4">
              Sign in
            </a>{' '}
            to leave a comment.
          </p>
        )}
      </section>
    </div>
  )
}
