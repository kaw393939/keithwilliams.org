# keithwilliams.org

Personal blog with Google OAuth, role-based access control, and comments — built with Next.js (App Router) and PostgreSQL.

Live: https://keithwilliams.org

## Key capabilities

- Posts: admins can create posts; all visitors can read them
- Comments: signed-in users can comment on individual posts
- Roles: `admin` and `user` roles; first sign-in becomes admin
- Admin dashboard: manage users (promote/demote), posts (delete), comments (delete)
- Anti-abuse: honeypot + timing check (no CAPTCHA), app-level rate limiting, Traefik-level rate limiting
- Security: strict security headers (HSTS preload, CSP without `unsafe-eval`, frame deny, nosniff)

## Tech stack

- Next.js (standalone output, multi-stage Docker build)
- Auth.js v5 (`next-auth` beta) with Google OAuth and Postgres adapter
- PostgreSQL 16
- Docker Hub image: `kaw393939/keithwilliams.org`
- GitHub Actions builds/pushes; Watchtower auto-deploys on the server
- Traefik terminates TLS and applies security headers + edge rate limiting

## Environment variables

Required at runtime:

- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`
- `POSTGRES_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (production: `https://keithwilliams.org`)
- `AUTH_SECRET` (Auth.js v5; set equal to `NEXTAUTH_SECRET`)
- `AUTH_URL` (Auth.js v5; set equal to `NEXTAUTH_URL`)
- `AUTH_TRUST_HOST=true` (required behind reverse proxy)

## Local development

```bash
npm install

export PGHOST=localhost PGPORT=5432 PGDATABASE=app PGUSER=app
export POSTGRES_PASSWORD=secret
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export NEXTAUTH_URL=http://localhost:3000
export AUTH_SECRET="$NEXTAUTH_SECRET"
export AUTH_URL="$NEXTAUTH_URL"
export AUTH_TRUST_HOST=true

npm run db:migrate
npm run dev
```

## Docker

```bash
docker build -t keithwilliams.org .

docker run -p 3000:3000 \
  -e PGHOST=host.docker.internal \
  -e PGPORT=5432 \
  -e PGDATABASE=app \
  -e PGUSER=app \
  -e POSTGRES_PASSWORD=secret \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -e GOOGLE_CLIENT_SECRET=your-client-secret \
  -e NEXTAUTH_SECRET=your-secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e AUTH_TRUST_HOST=true \
  keithwilliams.org
```

The container starts by running `node scripts/migrate.mjs` (file-based SQL migrations), then runs the Next.js standalone server.

## Database migrations (clean + automated)

This repo uses **file-based SQL migrations** applied in order:

- Directory: `migrations/`
- Naming: `0001_description.sql`, `0002_description.sql`, ...
- Tracking table: `schema_migrations` (filename + sha256 checksum + applied_at)
- Runner: `node scripts/migrate.mjs`

Add a new migration:

1. Create a new file in `migrations/` with the next number
2. Make changes forward-only (do not edit previously-applied migrations)
3. Ship it — the container applies it automatically on startup

## CI/CD

1. Push to `main`
2. GitHub Actions builds and pushes `kaw393939/keithwilliams.org:latest` (and a SHA tag)
3. Watchtower pulls the new image and restarts the container

GitHub secrets required:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Admin recovery (break-glass)

Normally you manage roles via the `/admin` dashboard (admins only). If you cannot access `/admin` because no current admin is available, use the server-only CLI to promote your user by email.

On the server:

```bash
# List users (emails + roles)
sudo -u deploy docker exec -i keithwilliams_blog node scripts/admin.mjs list-users

# Promote a user to admin
sudo -u deploy docker exec -i keithwilliams_blog node scripts/admin.mjs promote --email keith@firehose360.com
```
