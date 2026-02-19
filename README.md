# keithwilliams.org

Personal blog built with Next.js + Postgres, deployed via Docker Hub.

## Architecture

- **Next.js 15** with standalone output
- **PostgreSQL** for data storage
- **Docker Hub** image: `kaw393939/keithwilliams.org`
- **GitHub Actions** builds and pushes on every push to `main`
- **Watchtower** on the server auto-pulls new images

## Local Development

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t keithwilliams.org .
docker run -p 3000:3000 \
  -e PGHOST=host.docker.internal \
  -e POSTGRES_PASSWORD=secret \
  keithwilliams.org
```

## CI/CD Flow

1. Push to `main` branch
2. GitHub Actions builds Docker image
3. Image pushed to `kaw393939/keithwilliams.org:latest`
4. Watchtower on the server detects the new image and restarts the container
