-- V2: one invitation card = one household, RSVP per named guest.
-- Public access stays on security-definer RPCs. Couples use authenticated RLS.
-- Leaves public.invites and public.rsvps in place but unused by the app.

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  rsvp_closes_at timestamptz not null
);

comment on table public.site_settings is
  'Singleton site configuration. rsvp_closes_at is the public RSVP deadline.';

insert into public.site_settings (id, rsvp_closes_at)
values (1, timestamptz '2028-01-08 23:59:59+08')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

revoke all on public.site_settings from public;
revoke all on public.site_settings from anon;
grant select on public.site_settings to authenticated;

drop policy if exists "Authenticated users can read site settings" on public.site_settings;
create policy "Authenticated users can read site settings"
  on public.site_settings
  for select
  to authenticated
  using (true);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  label text not null,
  plus_ones_allowed integer not null default 0
    check (plus_ones_allowed >= 0),
  contact_number text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_invite_code_format
    check (invite_code ~ '^[a-z0-9]{8,24}$')
);

comment on table public.households is
  'One invitation card. Several named guests share one forever invite link.';

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
  before update on public.households
  for each row
  execute procedure public.set_updated_at();

alter table public.households enable row level security;

revoke all on public.households from public;
revoke all on public.households from anon;
grant select, insert, update, delete on public.households to authenticated;

drop policy if exists "Authenticated users can manage households" on public.households;
create policy "Authenticated users can manage households"
  on public.households
  for all
  to authenticated
  using (true)
  with check (true);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  full_name text not null,
  is_plus_one boolean not null default false,
  rsvp_status text not null default 'pending'
    check (rsvp_status in ('pending', 'attending', 'declining')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guests is
  'One person on an invitation. Named guests are created by the couple; plus-ones on RSVP.';

create index if not exists guests_household_id_idx on public.guests (household_id);

drop trigger if exists guests_set_updated_at on public.guests;
create trigger guests_set_updated_at
  before update on public.guests
  for each row
  execute procedure public.set_updated_at();

alter table public.guests enable row level security;

revoke all on public.guests from public;
revoke all on public.guests from anon;
grant select, insert, update, delete on public.guests to authenticated;

drop policy if exists "Authenticated users can manage guests" on public.guests;
create policy "Authenticated users can manage guests"
  on public.guests
  for all
  to authenticated
  using (true)
  with check (true);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  message text not null,
  contact_number text,
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Well-wishes from visitors without an invite link. Not an RSVP.';

alter table public.messages enable row level security;

revoke all on public.messages from public;
revoke all on public.messages from anon;
grant select, delete on public.messages to authenticated;

drop policy if exists "Authenticated users can read messages" on public.messages;
create policy "Authenticated users can read messages"
  on public.messages
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete messages" on public.messages;
create policy "Authenticated users can delete messages"
  on public.messages
  for delete
  to authenticated
  using (true);

insert into public.households (
  invite_code,
  label,
  plus_ones_allowed,
  contact_number,
  message,
  created_at,
  updated_at
)
select
  i.invite_code,
  i.display_name,
  i.plus_ones_allowed,
  i.contact_number,
  i.message,
  i.created_at,
  i.updated_at
from public.invites i
where not exists (
  select 1 from public.households h where h.invite_code = i.invite_code
);

insert into public.guests (
  household_id,
  full_name,
  is_plus_one,
  rsvp_status,
  created_at,
  updated_at
)
select
  h.id,
  i.display_name,
  false,
  i.rsvp_status,
  i.created_at,
  i.updated_at
from public.invites i
join public.households h on h.invite_code = i.invite_code
where not exists (
  select 1
  from public.guests g
  where g.household_id = h.id
    and g.is_plus_one = false
    and g.full_name = i.display_name
);

insert into public.guests (
  household_id,
  full_name,
  is_plus_one,
  rsvp_status,
  created_at,
  updated_at
)
select
  h.id,
  trim(n),
  true,
  case when i.rsvp_status = 'attending' then 'attending' else 'pending' end,
  i.created_at,
  i.updated_at
from public.invites i
join public.households h on h.invite_code = i.invite_code
cross join lateral unnest(coalesce(i.plus_one_names, '{}'::text[])) as n
where length(trim(n)) > 0
  and not exists (
    select 1
    from public.guests g
    where g.household_id = h.id
      and g.is_plus_one = true
      and g.full_name = trim(n)
  );

create or replace function public.household_invite_payload(p_household_id uuid)
returns table (
  label text,
  plus_ones_allowed integer,
  contact_number text,
  message text,
  rsvp_open boolean,
  guests jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select
      h.label,
      h.plus_ones_allowed,
      h.contact_number,
      h.message,
      exists (
        select 1
        from public.site_settings s
        where s.id = 1
          and now() < s.rsvp_closes_at
      ) as rsvp_open,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'full_name', g.full_name,
              'is_plus_one', g.is_plus_one,
              'rsvp_status', g.rsvp_status
            )
            order by g.is_plus_one, g.created_at
          )
          from public.guests g
          where g.household_id = h.id
        ),
        '[]'::jsonb
      ) as guests
    from public.households h
    where h.id = p_household_id;
end;
$$;

revoke all on function public.household_invite_payload(uuid) from public;
revoke all on function public.household_invite_payload(uuid) from anon;

drop function if exists public.lookup_invite(text);

create or replace function public.lookup_invite(p_code text)
returns table (
  label text,
  plus_ones_allowed integer,
  contact_number text,
  message text,
  rsvp_open boolean,
  guests jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := lower(trim(coalesce(p_code, '')));
  v_household_id uuid;
begin
  if v_code !~ '^[a-z0-9]{8,24}$' then
    return;
  end if;

  select h.id into v_household_id
  from public.households h
  where h.invite_code = v_code;

  if v_household_id is null then
    return;
  end if;

  return query
    select *
    from public.household_invite_payload(v_household_id);
end;
$$;

drop function if exists public.submit_invite_rsvp(text, text, text, text, text[]);

create or replace function public.submit_invite_rsvp(
  p_code text,
  p_contact_number text,
  p_message text,
  p_guest_replies jsonb,
  p_plus_one_names text[]
)
returns table (
  label text,
  plus_ones_allowed integer,
  contact_number text,
  message text,
  rsvp_open boolean,
  guests jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(trim(coalesce(p_code, '')));
  v_contact text := trim(coalesce(p_contact_number, ''));
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_household_id uuid;
  v_allowed integer;
  v_closes_at timestamptz;
  v_reply jsonb;
  v_guest_id uuid;
  v_status text;
  v_reply_ids uuid[] := '{}';
  v_named record;
  v_names text[];
  v_any_attending boolean;
  v_plus_ids uuid[];
  v_index integer;
begin
  if v_code !~ '^[a-z0-9]{8,24}$' then
    raise exception 'Invite not found';
  end if;

  if v_contact = '' then
    raise exception 'Contact number is required';
  end if;

  select s.rsvp_closes_at into v_closes_at
  from public.site_settings s
  where s.id = 1;

  if v_closes_at is null or now() >= v_closes_at then
    raise exception 'RSVP is closed';
  end if;

  select h.id, h.plus_ones_allowed
  into v_household_id, v_allowed
  from public.households h
  where h.invite_code = v_code
  for update;

  if v_household_id is null then
    raise exception 'Invite not found';
  end if;

  if jsonb_typeof(coalesce(p_guest_replies, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid RSVP status';
  end if;

  for v_reply in select value from jsonb_array_elements(coalesce(p_guest_replies, '[]'::jsonb))
  loop
    begin
      v_guest_id := (v_reply->>'id')::uuid;
    exception
      when others then
        raise exception 'Unknown guest';
    end;

    v_status := v_reply->>'status';
    if v_status not in ('attending', 'declining') then
      raise exception 'Invalid RSVP status';
    end if;

    if not exists (
      select 1
      from public.guests g
      where g.id = v_guest_id
        and g.household_id = v_household_id
        and g.is_plus_one = false
    ) then
      raise exception 'Unknown guest';
    end if;

    v_reply_ids := array_append(v_reply_ids, v_guest_id);
  end loop;

  if (
    select count(distinct reply_id)
    from unnest(v_reply_ids) as reply_id
  ) <> coalesce(cardinality(v_reply_ids), 0) then
    raise exception 'Invalid RSVP status';
  end if;

  for v_named in
    select g.id
    from public.guests g
    where g.household_id = v_household_id
      and g.is_plus_one = false
  loop
    if not (v_named.id = any (v_reply_ids)) then
      raise exception 'Each named guest must have an RSVP';
    end if;
  end loop;

  for v_reply in select value from jsonb_array_elements(coalesce(p_guest_replies, '[]'::jsonb))
  loop
    update public.guests
    set rsvp_status = v_reply->>'status'
    where id = (v_reply->>'id')::uuid
      and household_id = v_household_id;
  end loop;

  select exists (
    select 1
    from public.guests g
    where g.household_id = v_household_id
      and g.is_plus_one = false
      and g.rsvp_status = 'attending'
  ) into v_any_attending;

  v_names := array(
    select trim(n)
    from unnest(coalesce(p_plus_one_names, '{}'::text[])) as n
    where length(trim(n)) > 0
  );

  if not v_any_attending then
    v_names := '{}';
  elsif coalesce(cardinality(v_names), 0) > v_allowed then
    raise exception 'Too many plus-ones';
  end if;

  select coalesce(array_agg(g.id order by g.created_at), '{}'::uuid[])
  into v_plus_ids
  from public.guests g
  where g.household_id = v_household_id
    and g.is_plus_one = true;

  for v_index in 1 .. coalesce(cardinality(v_names), 0)
  loop
    if v_index <= coalesce(cardinality(v_plus_ids), 0) then
      update public.guests
      set
        full_name = v_names[v_index],
        rsvp_status = 'attending'
      where id = v_plus_ids[v_index];
    else
      insert into public.guests (
        household_id,
        full_name,
        is_plus_one,
        rsvp_status
      )
      values (
        v_household_id,
        v_names[v_index],
        true,
        'attending'
      );
    end if;
  end loop;

  if coalesce(cardinality(v_plus_ids), 0) > coalesce(cardinality(v_names), 0) then
    delete from public.guests
    where id = any (
      v_plus_ids[coalesce(cardinality(v_names), 0) + 1 : cardinality(v_plus_ids)]
    );
  end if;

  update public.households
  set
    contact_number = v_contact,
    message = v_message
  where id = v_household_id;

  return query
    select *
    from public.household_invite_payload(v_household_id);
end;
$$;

create or replace function public.submit_message(
  p_full_name text,
  p_message text,
  p_contact_number text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
  v_message text := trim(coalesce(p_message, ''));
  v_phone text := nullif(trim(coalesce(p_contact_number, '')), '');
  v_id uuid;
begin
  if v_name = '' then
    raise exception 'Name is required';
  end if;

  if v_message = '' then
    raise exception 'Message is required';
  end if;

  insert into public.messages (full_name, message, contact_number)
  values (v_name, v_message, v_phone)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.lookup_invite(text) from public;
revoke all on function public.submit_invite_rsvp(text, text, text, jsonb, text[]) from public;
revoke all on function public.submit_message(text, text, text) from public;

grant execute on function public.lookup_invite(text) to anon, authenticated;
grant execute on function public.submit_invite_rsvp(text, text, text, jsonb, text[]) to anon, authenticated;
grant execute on function public.submit_message(text, text, text) to anon, authenticated;
