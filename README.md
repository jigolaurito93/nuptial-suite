# Nuptial Suite

Single-couple wedding website: a public invitation SPA and a private admin page for the bride and groom.

The guest invitation is the primary experience on `/`. Admin remains a scaffold for later phases. Resend and Google Maps JS are stubbed and unused for now.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [pnpm](https://pnpm.io)
- [Supabase](https://supabase.com) (RSVP storage; auth for admin later)
- [Resend](https://resend.com) (email, not wired yet)
- [Google Maps](https://developers.google.com/maps) (venue map embed, not wired yet — venues use Maps search links)

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The invitation runs without API keys. RSVP submissions need Supabase configured (see below). Admin auth redirects only after Supabase env vars are set.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values when you are ready to connect services:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `RESEND_API_KEY` | Transactional email (later) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Venue map embed (later) |

### Supabase RSVP setup

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/migrations/001_rsvps.sql`](supabase/migrations/001_rsvps.sql).
3. Copy the project URL and anon key into `.env.local`.
4. Restart `pnpm dev`.

RLS allows anonymous inserts (public RSVP form) and authenticated selects (for a future admin guest list).

## Guest invitation (`/`)

Single-page experience with an envelope gate:

1. Sealed hero — “Save the date”, couple names, envelope; scroll is locked until opened.
2. Click the envelope — flap opens, scroll unlocks, optional background music starts.
3. Sections below:

| Section | Anchor |
| --- | --- |
| Save the date | `#save-the-date` |
| Countdown | `#countdown` |
| Venue (+ hotels) | `#venue` |
| Program flow | `#program` |
| Entourage | `#entourage` |
| Dress code | `#dress-code` |
| Gallery | `#gallery` |
| Gift guide | `#gift-guide` |
| RSVP | `#rsvp` |
| FAQs | `#faqs` |
| See you there | `#see-you-there` |

Static copy lives in [`src/content/invitation.ts`](src/content/invitation.ts) (Jack & Jill sample data).

### Audio

Place a royalty-free piano minus-one at `public/audio/save-the-date.mp3`. Playback starts after the envelope opens. If the file is missing, the player fails silently. Use the fixed “Music on/off” control to mute.

### Images

Hero and gallery use Unsplash placeholders for now. Swap URLs in the content module (or add files under `public/images/`) when couple photos are ready.

## Couple admin

- `/admin` — wedding planner scaffold (protected when Supabase env is set)
- `/login` — couple sign-in
- `/auth/callback`

## API

- `POST /api/rsvp` — validates and inserts into `public.rsvps`
- `POST /api/emails` — stub (Resend later)

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
