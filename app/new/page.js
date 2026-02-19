import { redirect } from 'next/navigation'
import { auth } from '../../auth'
import { createPost } from './actions'
import { HoneypotFields } from '../../lib/honeypot'
import { LIMITS } from '../../lib/validate'

import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'

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
    <div className="max-w-2xl space-y-4">
      <h1 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        New post
      </h1>

      {error === 'missing' ? (
        <Alert variant="destructive">
          <AlertDescription>Title and body are required.</AlertDescription>
        </Alert>
      ) : null}
      {error === 'validation' ? (
        <Alert variant="destructive">
          <AlertDescription>Input exceeds maximum length.</AlertDescription>
        </Alert>
      ) : null}
      {error === 'rate_limit' ? (
        <Alert variant="destructive">
          <AlertDescription>Too many requests. Please wait a moment.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium tracking-tight">Create</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPost} className="grid gap-4">
            <HoneypotFields />

            <label className="grid gap-2">
              <span className="text-sm">Title</span>
              <Input
                name="title"
                required
                maxLength={LIMITS.POST_TITLE}
                placeholder="Hello world"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">
                Max {LIMITS.POST_TITLE} characters
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm">Body</span>
              <Textarea
                name="body"
                rows={8}
                required
                maxLength={LIMITS.POST_BODY}
                placeholder="Write something..."
              />
              <span className="text-xs text-muted-foreground">
                Max {LIMITS.POST_BODY.toLocaleString()} characters
              </span>
            </label>

            <div>
              <Button type="submit" className="rounded-none">
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
