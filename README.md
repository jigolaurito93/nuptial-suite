# Nuptial Suite

Single-couple wedding website: a public invitation and a private planner for the bride and groom.

This repo is a structure template. Invitation pages, planner pages, and API routes are placeholders. Supabase, Resend, and Google Maps clients are stubbed and unused until later phases.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [pnpm](https://pnpm.io)
- [Supabase](https://supabase.com) (auth and data, not wired yet)
- [Resend](https://resend.com) (email, not wired yet)
- [Google Maps](https://developers.google.com/maps) (venue map, not wired yet)

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs without API keys. Planner auth redirects only after Supabase env vars are set.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values when you are ready to connect services:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `RESEND_API_KEY` | Transactional email |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Venue map |

## Routes

**Public invitation**

- `/` — invitation home
- `/story`
- `/schedule`
- `/venue`
- `/rsvp`
- `/registry`

**Couple planner** (protected when Supabase env is set)

- `/planner`
- `/planner/guests`
- `/planner/budget`
- `/planner/vendors`
- `/planner/tasks`
- `/planner/invitation`

**Auth and API stubs**

- `/login`
- `/auth/callback`
- `POST /api/rsvp`
- `POST /api/emails`

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
