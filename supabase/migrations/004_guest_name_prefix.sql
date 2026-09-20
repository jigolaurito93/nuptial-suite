-- Optional honorific for addressing a guest (Mr., Ms., Dr., custom, etc.).

alter table public.guests
  add column if not exists name_prefix text;

comment on column public.guests.name_prefix is
  'Optional honorific such as Mr., Ms., Dr. Shown when addressing the guest.';

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
              'name_prefix', g.name_prefix,
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
