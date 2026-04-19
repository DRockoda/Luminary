# Luminary ✦

> **Your private space to reflect, remember, and grow.**

Luminary is a full-stack personal journaling app that lets you capture your days through **audio**, **video**, or **text**. Track your mood, build streaks, and own your memories — with optional sync of media into **your own** Google Drive (App Data folder).

<br/>

[![Live App](https://img.shields.io/badge/Live%20App-luminaryjournal.netlify.app-7C6FF7?style=for-the-badge&logo=netlify&logoColor=white)](https://luminaryjournal.netlify.app)
[![API Status](https://img.shields.io/badge/API-Render-00B4D8?style=for-the-badge&logo=render&logoColor=white)](https://luminary-api-vsvk.onrender.com/health)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

<br/>

---

## ✨ Features

### 📓 Journaling

- **Audio, video & text entries** — capture moments in whatever format feels natural
- **Calendar view** — see every day at a glance; open any past date to add or view entries
- **Future dates locked** — you can only journal about days that have already happened
- **Search** — find entries across your history
- **Rich entry cards** — title, mood, duration, and preview in a clean layout

### 😊 Mood tracking

- **10-point mood scale** — from 😭 Terrible to 🤩 Amazing, with distinct emojis and colors
- **Mood slider** — interactive, color-coded control on every entry
- **Day mood** — daily mood is derived from the entries you logged that day
- **Calendar mood dots** — colored dots on the calendar so patterns stand out

### 📊 Stats & insights

- **Current & best streaks** — consistency at a glance
- **Completion rate** — share of days you’ve journaled
- **Total recorded time** — hours of audio & video captured
- **Words written** — word count across text entries
- **Mood trend** — compare this period vs last
- **Week at a glance** — busiest day, best mood day, lowest mood day
- **Activity heatmap** — GitHub-style yearly grid of journaling activity
- **Entry breakdown** — audio vs video vs text split

### 🔒 Privacy & security

- **Encrypted text at rest** — text entry bodies use **AES-256-GCM** with a server key before database storage
- **Google Drive App Data folder** — when connected, media can live in a folder **hidden from normal Drive browsing**, scoped to this app
- **JWT authentication** — access + refresh flow with **httpOnly** cookies
- **No ads, no third-party analytics** — design goal: your journal isn’t a product surface for trackers

### 🎨 Customization

- **7 color themes** — Purple, Cyan, Emerald, Rose, Amber, Slate, Indigo (Settings → Appearance)
- **Profile avatars** — upload your own or choose from **24** illustrated library avatars
- **PWA** — add to Home Screen on iOS / Android for an app-like shell

### 🗑️ Trash

- **Soft delete** — entries go to Trash before permanent deletion
- **15-day retention** — restore anything within **15 days**; after that, items are purged automatically
- **Entry preview** — review trashed entries before restore or permanent delete

### 📦 Data export

- **ZIP export** — download your entries in a structured archive
- **Organized by date** — year / month folders with readable filenames
- **Metadata** — export can include mood, timestamps, and index data where applicable
- **Size hints** — see approximate export size before downloading

### 🔧 Admin panel

- **Hidden at `/admin`** — not linked from the consumer app shell
- **User management** — roster, counts, storage signals (**no** journal content access)
- **Announcements** — site-wide dismissible banners (color, copy, optional link)
- **Maintenance mode** — graceful “be right back” experience for everyone
- **Per-user banners** — info / warning / danger messages targeted to specific accounts
- **Feedback inbox** — review submissions from the in-app feedback form

---

## 🛠️ Tech stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18 · TypeScript · Vite |
| **Styling** | Tailwind CSS · CSS variables / design tokens |
| **Motion** | Framer Motion |
| **Backend** | Node.js · Express · TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Auth** | JWT + bcrypt · httpOnly cookies |
| **Media (optional)** | Google Drive API · App Data folder |
| **Email** | Brevo (transactional) |
| **Deploy** | Netlify (web) · Render (API) — *see also* `docs/deploy-free-tier.md` for a Vercel API path |
| **Client state** | Zustand |
| **Server cache / queries** | TanStack Query (web) |
| **UI primitives** | Radix UI |

---

## 🏗️ Project structure

```
Luminary/
├── apps/
│   ├── web/                     # @luminary/web — React (Vite)
│   │   ├── src/
│   │   │   ├── components/    # UI + feature components
│   │   │   ├── pages/         # Route-level pages
│   │   │   ├── hooks/         # React hooks (e.g. useDrive)
│   │   │   ├── store/         # Zustand stores
│   │   │   └── lib/           # API client, helpers
│   │   └── vite.config.ts
│   │
│   └── api/                     # @luminary/api — Express
│       ├── src/
│       │   ├── routes/        # HTTP routes
│       │   ├── middleware/    # Auth, errors, limits
│       │   ├── services/      # Drive, email, domain logic
│       │   ├── lib/           # Prisma, JWT, crypto
│       │   └── scripts/       # create-admin, etc.
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   └── shared/                  # @luminary/shared — shared types & Zod schemas
│
├── docs/
│   └── deploy-free-tier.md      # Alternate deploy notes (e.g. Vercel API)
├── netlify.toml
└── package.json                 # npm workspaces orchestration
```

---

## 🚀 Getting started

### Prerequisites

- **Node.js** 18+ (Netlify build uses 20 — matching locally is ideal)
- **PostgreSQL** (a Supabase project is the easiest path)
- **Optional:** Google Cloud project with **Drive API** + OAuth client (for Drive backup)

### 1. Clone

```bash
git clone https://github.com/DRockoda/Luminary.git
cd Luminary
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit **`apps/api/.env`** (see the example file for every key). Minimum highlights:

```env
# Database (Supabase pooler + direct)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth & crypto
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_JWT_SECRET=...
ENCRYPTION_SERVER_KEY=...   # exactly 64 hex chars → 32-byte AES key (see apps/api/.env.example)

# App URLs
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Email (Brevo)
BREVO_API_KEY=...
EMAIL_FROM=Luminary <your-verified-sender@example.com>

# Google Drive (optional for local OAuth testing)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/drive/callback
```

**`apps/web/.env`** — for local dev you can often leave `VITE_API_URL` empty and use the Vite proxy to the API; for production builds, set `VITE_API_URL` to your public API origin.

Generate random secrets when you need them:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # 64 hex chars — use for ENCRYPTION_SERVER_KEY
```

### 4. Database

From the repo root:

```bash
npm run db:migrate:deploy
```

### 5. First admin

```bash
cd apps/api && npx tsx src/scripts/create-admin.ts
```

### 6. Dev servers

```bash
# repo root
npm run dev
```

| Surface | URL |
| --- | --- |
| Web | [http://localhost:5173](http://localhost:5173) |
| API | [http://localhost:3000](http://localhost:3000) |
| Health | [http://localhost:3000/health](http://localhost:3000/health) |

---

## 🌐 Deployment (overview)

Typical production split today:

| Service | Role | Public URL |
| --- | --- | --- |
| **Netlify** | Static SPA + PWA | [luminaryjournal.netlify.app](https://luminaryjournal.netlify.app) |
| **Render** | Express API | [luminary-api-vsvk.onrender.com](https://luminary-api-vsvk.onrender.com) |
| **Supabase** | Postgres | *(project host in dashboard)* |

### Roll your own

1. **Supabase** — create a project, copy `DATABASE_URL` / `DIRECT_URL` for Prisma, run migrations.
2. **API (Render)** — connect the repo, set root to `apps/api`, install from monorepo root, build `@luminary/api`, set **all** env vars from `apps/api/.env.example`, start `node dist/server.js`.
3. **Web (Netlify)** — build is driven by `netlify.toml`; set **`VITE_API_URL`** to your API’s `https://` origin.
4. **Google OAuth** — authorized JavaScript origins + redirect URI must match your **real** web API callback (e.g. `https://<api-host>/api/drive/callback`). Set `GOOGLE_REDIRECT_URI` and **`APP_URL`** to your **SPA** origin so post-login redirects land on Netlify.

For an alternate **Vercel-hosted API** walkthrough, open [`docs/deploy-free-tier.md`](docs/deploy-free-tier.md).

---

## 🔐 Admin access

Navigate to **`/admin`** on your deployed web host (it’s intentionally not linked in the main nav).

Create or rotate admins via `apps/api/src/scripts/create-admin.ts` (and related scripts in `src/scripts/`).

**Admins can:** list users and aggregate usage, manage announcements / maintenance / targeted banners, read feedback metadata, and perform account-level actions — **not** read private entry bodies or media bytes from the journal.

---

## 📱 PWA

**iOS:** Safari → Share → **Add to Home Screen**  
**Android:** Chrome → **Install app** / Add to Home Screen

Service worker precaches the shell; **full offline editing** depends on future work — treat offline as a progressive enhancement.

---

## 🎨 Design system (at a glance)

- **Typography** — **Nunito** for UI, **DM Mono** for timestamps and metadata (`apps/web/index.html`).
- **Theming** — CSS custom properties; one accent system across all **7** palettes.
- **Mood scale** — 10-point scale from deep red (rough days) through neutral gray to deep green (great days).

---

## 🔒 Privacy by design

- **You own the narrative** — connect Drive if you want media copies in **your** Google account.
- **App Data folder** — when Drive is enabled, uploads use the hidden app-scoped area (not your normal “My Drive” tree).
- **Text encryption** — AES-256-GCM at the application layer before rows hit Postgres.
- **Minimal telemetry** — no third-party marketing pixels in the stock app.
- **Export** — ZIP export is always available from the product surface (when authenticated).

---

## 🤝 Contributing

Personal project — contributions are welcome.

1. Fork → feature branch `feat/...`
2. `npm run build` at the root should pass
3. Conventional commits encouraged (`feat:`, `fix:`, `chore:`)
4. Open a PR with a short rationale + test notes

---

## 📬 Feedback

Use the **Feedback** form inside the app — it lands in the admin inbox.

---

## 📄 License

Private — All rights reserved © 2026 Luminary

---

<p align="center">
  <strong>Luminary ✦</strong><br/>
  Built with care.<br/>
  <em>Your private space to reflect.</em>
</p>
