import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { query } from '../../lib/db'
import { changeUserRole, deletePost, deleteCommentAdmin } from './actions'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-muted-foreground">{u.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] rounded-full"
                          loading="lazy"
                        />
                      ) : null}
                      <span className="truncate">{u.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id !== session.user.id ? (
                      <form action={changeUserRole} className="inline">
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={u.role === 'admin' ? 'user' : 'admin'}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">{p.id}</TableCell>
                  <TableCell>
                    <a
                      href={`/posts/${p.id}`}
                      className="underline underline-offset-4"
                    >
                      {p.title}
                    </a>
                  </TableCell>
                  <TableCell>{p.author_name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deletePost} className="inline">
                      <input type="hidden" name="postId" value={p.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{c.id}</TableCell>
                    <TableCell>
                      <a
                        href={`/posts/${c.post_id}`}
                        className="underline underline-offset-4"
                      >
                        #{c.post_id}
                      </a>
                    </TableCell>
                    <TableCell>{c.author_name || '—'}</TableCell>
                    <TableCell className="max-w-[18rem] truncate">
                      {c.body}
                    </TableCell>
                    <TableCell>{c.flagged ? '⚠️' : '—'}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteCommentAdmin} className="inline">
                        <input type="hidden" name="commentId" value={c.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
