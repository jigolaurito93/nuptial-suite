-- Couple-only vendor contacts and payment schedules.
-- Public guests never select these tables.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  company_name text not null,
  contact_name text not null,
  phone text,
  email text,
  notes text,
  status text not null default 'inquiry'
    check (status in ('inquiry', 'booked', 'completed')),
  contract_amount numeric(12, 2)
    check (contract_amount is null or contract_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vendors is
  'Wedding vendor contacts for the couple. Package total is optional; payments live on vendor_payments.';

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
  before update on public.vendors
  for each row
  execute procedure public.set_updated_at();

alter table public.vendors enable row level security;

revoke all on public.vendors from public;
revoke all on public.vendors from anon;
grant select, insert, update, delete on public.vendors to authenticated;

drop policy if exists "Authenticated users can manage vendors" on public.vendors;
create policy "Authenticated users can manage vendors"
  on public.vendors
  for all
  to authenticated
  using (true)
  with check (true);

create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  label text not null,
  amount numeric(12, 2) not null
    check (amount >= 0),
  due_on date,
  paid_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.vendor_payments is
  'Payment schedule for a vendor. Remaining balance is derived from unpaid rows or contract_amount.';

create index if not exists vendor_payments_vendor_id_idx
  on public.vendor_payments (vendor_id);

alter table public.vendor_payments enable row level security;

revoke all on public.vendor_payments from public;
revoke all on public.vendor_payments from anon;
grant select, insert, update, delete on public.vendor_payments to authenticated;

drop policy if exists "Authenticated users can manage vendor payments"
  on public.vendor_payments;
create policy "Authenticated users can manage vendor payments"
  on public.vendor_payments
  for all
  to authenticated
  using (true)
  with check (true);
