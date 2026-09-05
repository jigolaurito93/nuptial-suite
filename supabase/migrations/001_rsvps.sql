-- RSVP submissions from the public invitation form.
create extension if not exists "pgcrypto";

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  contact_number text not null,
  status text not null check (status in ('attending', 'declining')),
  message text,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

create policy "Anyone can submit an RSVP"
  on public.rsvps
  for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated users can read RSVPs"
  on public.rsvps
  for select
  to authenticated
  using (true);
