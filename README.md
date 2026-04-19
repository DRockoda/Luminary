# Luminary

A private, encrypted journaling app. Capture your days in audio, video, or text. Track your mood. Own your memories.

## Tech stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS (Netlify-ready, see `netlify.toml`)
- **Backend:** Node.js + Express + TypeScript (Vercel serverless via `serverless-http`, see `apps/api/api/index.ts`)
- **Database:** PostgreSQL + Prisma ORM (Supabase or local Docker; `DATABASE_URL` + `DIRECT_URL` in `apps/api/prisma/schema.prisma`)
- **Auth:** JWT + bcrypt (httpOnly cookies; `COOKIE_SAMESITE` for cross-origin SPA/API)
- **Email:** Brevo (transactional email)
- **Storage:** Google Drive API (App Data folder)
- **Admin:** JWT-protected admin dashboard

## Getting started

### Prerequisites

- Node.js 18+
- npm (workspaces)
- PostgreSQL (e.g. `docker compose up -d` in this repo for local Postgres)

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/luminary.git
   cd luminary
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env — set DATABASE_URL, DIRECT_URL, JWT_*, ENCRYPTION_SERVER_KEY, etc.

   cp apps/web/.env.example apps/web/.env
   # For local dev, leave VITE_API_URL empty to use the Vite dev proxy to the API.
   ```

4. Apply the database schema

   ```bash
   npm run db:migrate:deploy
   ```

5. Create the first admin account

   ```bash
   cd apps/api
   npx tsx src/scripts/create-admin.ts
   ```

6. Start development servers

   ```bash
   # From repository root
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173)

## Environment variables

See `apps/api/.env.example` and `apps/web/.env.example` for local development.

For production placeholders, see `apps/api/.env.production.example` and `apps/web/.env.production.example`.

## Free-tier deploy (Supabase + Vercel + Netlify)

See [docs/deploy-free-tier.md](docs/deploy-free-tier.md).

## License

Private — all rights reserved.
