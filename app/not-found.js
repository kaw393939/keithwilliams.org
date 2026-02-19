export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <h1 style={{ fontSize: 48, margin: '0 0 8px 0', opacity: 0.3 }}>404</h1>
      <p style={{ opacity: 0.7, fontSize: 15, marginBottom: 16 }}>Page not found.</p>
      <a
        href="/"
        style={{
          color: '#60a5fa',
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        &larr; Back to posts
      </a>
    </div>
  )
}
