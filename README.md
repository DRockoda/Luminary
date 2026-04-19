# Luminary

A private, encrypted journaling app. Capture your days in audio, video, or text. Track your mood. Own your memories.

## Tech stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite + Prisma ORM (local dev); you can point `DATABASE_URL` at PostgreSQL if you change the Prisma provider
- **Auth:** JWT + bcrypt
- **Email:** Brevo (transactional email)
- **Storage:** Google Drive API (App Data folder)
- **Admin:** JWT-protected admin dashboard

## Getting started

### Prerequisites

- Node.js 18+
- npm (workspaces)

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
   # Edit apps/api/.env with your values (especially JWT_* and ENCRYPTION_SERVER_KEY)

   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env if your API is not on http://localhost:3000
   ```

4. Set up the database (SQLite file under `apps/api/prisma/`)

   ```bash
   npm run db:push
   ```

   Or from `apps/api`:

   ```bash
   npx prisma db push
   npx prisma generate
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

See `apps/api/.env.example` and `apps/web/.env.example` for all variables the apps read.

## License

Private — all rights reserved.
