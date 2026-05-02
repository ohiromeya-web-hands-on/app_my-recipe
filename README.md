# MyKitchen

Recipe management web app scaffold for Vercel deployment.

## Current Scope

This is the first deployable slice:

- Next.js App Router + TypeScript
- Auth.js Google OAuth route
- JWT session strategy
- `next-themes` light / dark / system theme toggle
- Japanese locale source at `locales/ja.json`
- Vercel build config
- GitHub Actions CI for typecheck + build
- Smoke page at `/`
- Health check at `/api/health`

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

Copy `.env.example` to `.env.local` and fill the values for local auth testing.

```bash
AUTH_SECRET=
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OWNER_GOOGLE_EMAILS=owner@example.com,backup-owner@example.com
DATABASE_URL=file:./dev.db
CRON_SECRET=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=
```

## Verification

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Vercel Deployment

1. Import this repository into Vercel as a Next.js app.
2. Set the environment variables listed above in Vercel Project Settings.
3. Add the Google OAuth callback URL:
   `https://<your-domain>/api/auth/callback/google`
4. Push to `main`; Vercel will build with `npm run build`.

GitHub Actions also runs `npm ci`, `npm run typecheck`, `npm audit --audit-level=moderate`, and `npm run build` on pull requests and `main`.

## Google OAuth Owner Setup

Create an OAuth client in Google Cloud Console and register these redirect URIs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<your-domain>/api/auth/callback/google`

Set the allowed owner Google accounts as a comma-separated list:

```bash
OWNER_GOOGLE_EMAILS=owner@example.com,backup-owner@example.com
```

Only Google OAuth profiles whose email matches one of those normalized addresses can sign in. Use ordinary Google account email addresses here; no `sub` bootstrap step is required.
