-- Couple-only wedding planning checklist.
-- Public guests never select this table.

create table if not exists public.planning_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  category text not null,
  owner text not null default 'shared'
    check (owner in ('shared', 'partner_one', 'partner_two')),
  due_on date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.planning_tasks is
  'Wedding planning checklist for the couple. completed_at is null while a task is open.';

drop trigger if exists planning_tasks_set_updated_at on public.planning_tasks;
create trigger planning_tasks_set_updated_at
  before update on public.planning_tasks
  for each row
  execute procedure public.set_updated_at();

create index if not exists planning_tasks_due_on_idx
  on public.planning_tasks (due_on);

create index if not exists planning_tasks_completed_at_idx
  on public.planning_tasks (completed_at);

alter table public.planning_tasks enable row level security;

revoke all on public.planning_tasks from public;
revoke all on public.planning_tasks from anon;
grant select, insert, update, delete on public.planning_tasks to authenticated;

drop policy if exists "Authenticated users can manage planning tasks"
  on public.planning_tasks;
create policy "Authenticated users can manage planning tasks"
  on public.planning_tasks
  for all
  to authenticated
  using (true)
  with check (true);
