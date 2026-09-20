# Nuptial Suite

Single-couple wedding website: a public invitation SPA and a private admin page for the bride and groom.

The guest invitation is the primary experience on `/`. Admin remains a scaffold for later phases. Resend and Google Maps JS are stubbed and unused for now.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [pnpm](https://pnpm.io)
- [Supabase](https://supabase.com) (RSVPs, unique invite links, couple login)
- [Resend](https://resend.com) (email, not wired yet)
- [Google Maps](https://developers.google.com/maps) (venue map embed, not wired yet — venues use Maps search links)

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The invitation runs without API keys. Household RSVPs, well-wishes, and admin login need Supabase configured (see below).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values when you are ready to connect services:

| Variable                          | Used for                    |
| --------------------------------- | --------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase project URL        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anonymous key      |
| `RESEND_API_KEY`                  | Transactional email (later) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Venue map embed (later)     |

### Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/migrations/001_rsvps.sql`](supabase/migrations/001_rsvps.sql), then [`supabase/migrations/002_invites.sql`](supabase/migrations/002_invites.sql), then [`supabase/migrations/003_households_guests.sql`](supabase/migrations/003_households_guests.sql), then [`supabase/migrations/004_guest_name_prefix.sql`](supabase/migrations/004_guest_name_prefix.sql), then [`supabase/migrations/005_vendors.sql`](supabase/migrations/005_vendors.sql).
3. Copy the project URL and anon `public` key into `.env.local`. Do not use a service-role key.
4. Authentication → enable Email. Add one user for the couple (email + password).
5. Restart `pnpm dev`.

Guests RSVP only through a personal `/?invite=CODE` link. Visitors without a valid code can leave a well-wishes note instead. They cannot list households, guests, or messages. The couple signs in at `/login` to manage invitation cards and the guest list.

## Guest invitation (`/`)

Single-page experience with an envelope gate:

1. Sealed hero — “Save the date”, couple names, envelope; scroll is locked until opened.
2. Click the envelope — flap opens, scroll unlocks, optional background music starts.
3. Sections below:

| Section          | Anchor           |
| ---------------- | ---------------- |
| Save the date    | `#save-the-date` |
| Countdown        | `#countdown`     |
| Venue (+ hotels) | `#venue`         |
| Program flow     | `#program`       |
| Entourage        | `#entourage`     |
| Dress code       | `#dress-code`    |
| Gallery          | `#gallery`       |
| Gift guide       | `#gift-guide`    |
| RSVP (invite link only) | `#rsvp`   |
| Well-wishes (no invite) | `#wishes` |
| FAQs             | `#faqs`          |
| See you there    | `#see-you-there` |

Static copy lives in [`src/content/invitation.ts`](src/content/invitation.ts) (Kennett Ramos & Bea Alibutud).

Personal invite links use `/?invite=CODE`. A valid code shows a per-person RSVP for that household. Without a code (or with an invalid one), RSVP is hidden and a well-wishes form is shown instead. Public RSVP closes on 8 January 2028; the invitation itself stays available.

### Audio

Place a royalty-free piano minus-one at `public/audio/save-the-date.mp3`. Playback starts after the envelope opens. If the file is missing, the player fails silently. Use the fixed “Music on/off” control to mute.

### Images

Hero and gallery use Unsplash placeholders for now. Swap URLs in the content module (or add files under `public/images/`) when couple photos are ready.

## Couple admin

- `/admin` — wedding planner (protected when Supabase env is set). Households creates invitation cards and copies unique links. Guests is the flat headcount. Messages lists well-wishes.
- `/admin/vendors` — vendor contacts, roles, and optional payment schedules (downpayment, remaining balance, due and paid dates).
- `/login` — couple email/password sign-in
- `/auth/callback`

## API

- `GET /api/invite?code=` — public household, named guests, plus-ones, and whether RSVP is still open
- `POST /api/rsvp` — invite-only per-guest RSVP via `submit_invite_rsvp`
- `POST /api/messages` — well-wishes note (name + message; phone optional)
- `POST /api/emails` — stub (Resend later)

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```
