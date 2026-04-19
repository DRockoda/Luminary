# Deploy Luminary (Supabase + Vercel + Netlify)

The API stays one Express app; Vercel runs it via a single serverless entry (`apps/api/api/index.ts`) using `serverless-http` — no per-route rewrites of business logic.

**Database:** Supabase is plain PostgreSQL. Prisma connects with `DATABASE_URL` + `DIRECT_URL`; you do **not** need `@supabase/supabase-js` unless you add Supabase Auth or Storage APIs later.

## 1. Supabase (PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database** — copy:
   - **Transaction pooler** (port `6543`, `pgbouncer=true`) → `DATABASE_URL`
   - **Direct** or **Session** connection (port `5432`) → `DIRECT_URL`
3. Locally, put both in `apps/api/.env`, then from `apps/api` run:

   ```bash
   npx prisma migrate deploy
   ```

4. Confirm tables in **Table Editor**.

## 2. Vercel (API)

1. Import the GitHub repo at [vercel.com](https://vercel.com).
2. **Root Directory:** `apps/api`
3. **Install Command:** `cd ../.. && npm ci`  
   (So workspace `@luminary/shared` resolves from the monorepo root.)
4. **Build Command:** `npm run vercel-build`  
   (Runs `prisma generate` + `tsc`. Run `prisma migrate deploy` locally or add a separate release step if you prefer.)
5. **Output / framework:** default (serverless `api/` folder).
6. Add all variables from `apps/api/.env.production.example` (real secrets, not the example file).
7. Deploy, then set **GOOGLE_REDIRECT_URI** to `https://<your-deployment>.vercel.app/api/drive/callback` and redeploy if needed.

**Health checks**

- `https://<vercel-host>/health`
- `https://<vercel-host>/api/health`

## 3. Netlify (frontend)

1. Import the same repo at [netlify.com](https://netlify.com).
2. Use the root **`netlify.toml`** (repo root as base directory).
3. Set **Environment variables:** `VITE_API_URL` = your Vercel URL (see `apps/web/.env.production.example`).
4. Rename the site to `luminary` if you want `https://luminary.netlify.app`.

## 4. CORS and cookies

- Set **`CORS_ORIGIN`** on Vercel to your Netlify origin (comma-separate multiple origins if needed).
- For browser cookies on credentialed requests to a **different** host than the SPA, set **`COOKIE_SAMESITE=none`** on Vercel and leave **`COOKIE_DOMAIN`** empty unless you know you need a cookie domain.

## 5. Limits

Vercel free tier has a **short function duration**; very large ZIP exports may need streaming or async jobs — see existing export implementation.
