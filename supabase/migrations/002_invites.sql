-- One invitation card per row: plus-one allowance and RSVP live here.
-- Public guests never select this table directly; they use lookup/submit RPCs.

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  display_name text not null,
  plus_ones_allowed integer not null default 0
    check (plus_ones_allowed >= 0),
  rsvp_status text not null default 'pending'
    check (rsvp_status in ('pending', 'attending', 'declining')),
  contact_number text,
  message text,
  plus_one_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invites_invite_code_format
    check (invite_code ~ '^[a-z0-9]{8,24}$')
);

comment on table public.invites is
  'One row per invitation card, including plus-one allowance and RSVP.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invites_set_updated_at on public.invites;
create trigger invites_set_updated_at
  before update on public.invites
  for each row
  execute procedure public.set_updated_at();

alter table public.invites enable row level security;

drop policy if exists "Authenticated users can manage invites" on public.invites;
create policy "Authenticated users can manage invites"
  on public.invites
  for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.invites from public;
revoke all on public.invites from anon;
grant select, insert, update, delete on public.invites to authenticated;

create or replace function public.lookup_invite(p_code text)
returns table (
  display_name text,
  plus_ones_allowed integer,
  rsvp_status text,
  plus_one_names text[],
  contact_number text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := lower(trim(coalesce(p_code, '')));
begin
  if v_code !~ '^[a-z0-9]{8,24}$' then
    return;
  end if;

  return query
    select
      i.display_name,
      i.plus_ones_allowed,
      i.rsvp_status,
      i.plus_one_names,
      i.contact_number
    from public.invites i
    where i.invite_code = v_code
    limit 1;
end;
$$;

create or replace function public.submit_invite_rsvp(
  p_code text,
  p_status text,
  p_contact_number text,
  p_message text,
  p_plus_one_names text[]
)
returns table (
  display_name text,
  plus_ones_allowed integer,
  rsvp_status text,
  plus_one_names text[],
  contact_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(trim(coalesce(p_code, '')));
  v_allowed integer;
  v_names text[];
  v_contact text := trim(coalesce(p_contact_number, ''));
  v_message text := nullif(trim(coalesce(p_message, '')), '');
begin
  if v_code !~ '^[a-z0-9]{8,24}$' then
    raise exception 'Invite not found';
  end if;

  if p_status not in ('attending', 'declining') then
    raise exception 'Invalid RSVP status';
  end if;

  if v_contact = '' then
    raise exception 'Contact number is required';
  end if;

  select i.plus_ones_allowed into v_allowed
  from public.invites i
  where i.invite_code = v_code
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  v_names := array(
    select trim(n)
    from unnest(coalesce(p_plus_one_names, '{}'::text[])) as n
    where length(trim(n)) > 0
  );

  if p_status = 'declining' then
    v_names := '{}';
  elsif coalesce(cardinality(v_names), 0) > v_allowed then
    raise exception 'Too many plus-ones';
  end if;

  update public.invites
  set
    rsvp_status = p_status,
    contact_number = v_contact,
    message = v_message,
    plus_one_names = v_names
  where invite_code = v_code;

  return query
    select
      i.display_name,
      i.plus_ones_allowed,
      i.rsvp_status,
      i.plus_one_names,
      i.contact_number
    from public.invites i
    where i.invite_code = v_code;
end;
$$;

revoke all on function public.lookup_invite(text) from public;
revoke all on function public.submit_invite_rsvp(text, text, text, text, text[]) from public;
grant execute on function public.lookup_invite(text) to anon, authenticated;
grant execute on function public.submit_invite_rsvp(text, text, text, text, text[]) to anon, authenticated;
