import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="max-w-xl space-y-4 py-10">
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Not found
        </div>
        <h1 className="text-4xl font-medium tracking-tight">404</h1>
        <p className="text-sm text-muted-foreground">Page not found.</p>
      </div>
      <Button asChild variant="link" className="h-auto px-0">
        <a href="/">← Back to posts</a>
      </Button>
    </div>
  )
}
