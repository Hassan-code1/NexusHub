# NexusHub — Local Startup Guide

## Prerequisites

Make sure the following are installed before starting:

- **Node.js** v20+
- **pnpm** v11+ (`npm install -g pnpm`)
- **Docker Desktop** (for PostgreSQL, Redis, RabbitMQ)

---

## Step 1 — Clone & Install Dependencies

```bash
# From the project root (NexusHub/)
pnpm install
```

---

## Step 2 — Start Infrastructure (Docker)

```bash
# From the project root (NexusHub/)
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **RabbitMQ** on ports `5672` and `15672` (management UI)

---

## Step 3 — Configure Environment Variables

```bash
# Copy the example .env and fill in your values
# File: apps/api/.env
```

Open `apps/api/.env` and set:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/nexushub?schema=public"
JWT_SECRET="<at-least-32-characters-long-secret>"
REFRESH_SECRET="<at-least-32-characters-long-secret>"
GOOGLE_CLIENT_ID="<your-google-oauth-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-oauth-client-secret>"
FRONTEND_URL="http://localhost:3000"
```

> **Google OAuth Setup**: Go to [https://console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Set the Authorized redirect URI to: `http://localhost:5000/api/auth/google/callback`

---

## Step 4 — Run Prisma Migrations

```bash
# From apps/api/
cd apps/api
pnpm prisma migrate deploy
```

Or if running for the first time (dev mode with migration creation):

```bash
cd apps/api
pnpm prisma migrate dev --name init
```

---

## Step 5 — Generate Prisma Client

```bash
# From apps/api/
cd apps/api
pnpm prisma generate
```

---

## Step 6 — Start All Apps (Turborepo)

```bash
# From the project root (NexusHub/)
pnpm dev
```

This uses Turborepo to start all apps in parallel:
- **API** → `http://localhost:5000`
- **Web** → `http://localhost:3000`

---

## Alternative: Start Apps Individually

### Start API only

```bash
cd apps/api
pnpm dev
```

### Start Web only

```bash
cd apps/web
pnpm dev
```

---

## Verify Everything is Running

| Service        | URL                                      |
|----------------|------------------------------------------|
| Web App        | http://localhost:3000                    |
| API            | http://localhost:5000                    |
| API Health     | http://localhost:5000/api/health         |
| RabbitMQ UI    | http://localhost:15672 (guest / guest)   |

---

## Auth Flow Summary

### Email/Password
1. Register at `http://localhost:3000/register`
2. Login at `http://localhost:3000/login`

### Google OAuth
1. Click "Continue with Google" on the login page
2. You are redirected to `http://localhost:5000/api/auth/google`
3. After Google approval, backend redirects to `http://localhost:3000/dashboard?token=<jwt>`
4. Dashboard page stores the token and loads the user session

---

## Useful Commands

```bash
# View Prisma Studio (DB GUI)
cd apps/api && pnpm prisma studio

# Stop Docker services
docker compose down

# Stop Docker and remove all data volumes
docker compose down -v
```
