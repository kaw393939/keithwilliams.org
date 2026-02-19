import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="space-y-1">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground/30">
          404
        </h1>
        <p className="text-sm text-muted-foreground">Page not found.</p>
      </div>
      <Button asChild variant="link" className="h-auto px-0">
        <a href="/">← Back to posts</a>
      </Button>
    </div>
  )
}
