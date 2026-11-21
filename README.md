# Loy Krathong

An online Loy Krathong river. Visitors design a 3D krathong, write a wish, and
release it into a shared river that other visitors see in realtime.

## Stack

- **Next.js 16** (App Router) + React 19, Tailwind CSS 4
- **three.js / react-three-fiber** for the river and krathongs
- **Supabase** for Postgres, Realtime, and row-level security
- Deploy target: Vercel free tier

No separate backend. The only server code is two Next.js route handlers.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys, or leave empty for demo mode
npm run dev
```

Without Supabase env vars the site still runs in **demo mode**: 26 seeded
krathongs and local-only releases. The API returns `503` and the client keeps
the experience playable.

## Database setup

1. Create a project at [supabase.com](https://supabase.com) (free plan).
2. SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
3. Project → **Connect** dialog (or Settings → API Keys) → copy the URL,
   the publishable key, and the secret key into `.env.local`.

Current keys look like `sb_publishable_...` / `sb_secret_...`. Older projects
still show the legacy `anon` / `service_role` JWTs (`eyJ...`); the code accepts
either. Never expose the secret key to the browser.

The migration creates:

| Table | Purpose |
| --- | --- |
| `krathongs` | one row per released krathong: wish, 3D config, position |
| `wish_events` | hashed-IP rate limiting ledger |

RLS: `anon` may read live krathongs only. All writes go through the server
with the service role key.

## Why the free tier is enough

The 3D model is **not** stored anywhere. It is generated in the browser from
primitives, coloured per config. A krathong row is ~0.5–1 KB of JSON.

- 500 MB database ≈ hundreds of thousands of krathongs
- No model/texture files, so no Storage or egress cost for 3D assets
- Free tier limits that actually bite: **5 GB egress/month**, **200 realtime
  connections**, **2M realtime messages/month**

If traffic grows past that, the next step is Pro ($25/mo), not a redesign.

## Cost / limit guardrails

- River returns the newest 200 krathongs (`RIVER.pageSize`)
- Scene renders at most 120 of them
- Krathongs expire after 7 days and are hard-deleted 30 days later
- Rate limit: 5 releases per IP per 10 minutes
- Reports auto-hide a krathong after 3 reports

## Scripts

```bash
npm run dev        # local dev
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Before going public

- Replace the wordlist in `src/lib/krathong/moderation.ts` with a real
  moderation provider. Public user text needs it.
- Report endpoint trusts the caller; add rate limiting or a signed session if
  it gets abused.
- Add an OG image and analytics if you want sharing to work well.

## Layout

```
src/app/api/krathongs/route.ts        GET river, POST release
src/app/api/krathongs/[id]/report     report endpoint
src/lib/krathong/geometry.ts          parametric krathong mesh
src/lib/krathong/schema.ts            zod schema + shared types
src/lib/krathong/use-river.ts         fetch + realtime + release
src/components/scene/Scene.tsx        water shader, lights, krathongs
src/components/RiverApp.tsx           page shell and UI state
supabase/migrations/0001_init.sql     schema, RLS, report RPC, cron
docs/adr/                             design decisions
GLOSSARY.md                           domain vocabulary
```
