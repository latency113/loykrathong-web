-- Sky lanterns (โคมลอย): a wish released above the river.
-- Run in Supabase SQL Editor or: supabase db push

create table if not exists public.lanterns (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 24),
  wish text not null default '' check (char_length(wish) <= 140),
  color text not null default 'amber'
    check (color in ('amber', 'rose', 'sky', 'violet')),
  position_x real not null check (position_x between -1 and 1),
  position_y real not null check (position_y between 0 and 1),
  blessings integer not null default 0,
  reports integer not null default 0,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index if not exists lanterns_live_idx
  on public.lanterns (created_at desc)
  where hidden_at is null;

alter table public.lanterns enable row level security;

drop policy if exists "live lanterns are readable" on public.lanterns;
create policy "live lanterns are readable"
  on public.lanterns
  for select
  to anon, authenticated
  using (hidden_at is null and expires_at > now());

-- Reporting: count, and auto-hide after N reports.
create or replace function public.report_lantern(
  p_id uuid,
  p_hide_after integer default 3
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.lanterns
     set reports = reports + 1,
         hidden_at = case
           when reports + 1 >= p_hide_after then now()
           else hidden_at
         end
   where id = p_id and hidden_at is null
  returning reports;
$$;

revoke all on function public.report_lantern(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.report_lantern(uuid, integer)
  to service_role;

-- Blessing (heart) counter with toggle (+1 / -1) support.
create or replace function public.bless_lantern(
  p_id uuid,
  p_delta integer default 1
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.lanterns
     set blessings = greatest(0, blessings + case when p_delta < 0 then -1 else 1 end)
   where id = p_id and hidden_at is null
  returning blessings;
$$;

revoke all on function public.bless_lantern(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.bless_lantern(uuid, integer)
  to service_role;

-- Housekeeping now covers both tables.
create or replace function public.prune_old_rows()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.krathongs
   where expires_at < now() - interval '30 days'
      or (hidden_at is not null and hidden_at < now() - interval '30 days');
  delete from public.lanterns
   where expires_at < now() - interval '30 days'
      or (hidden_at is not null and hidden_at < now() - interval '30 days');
  delete from public.wish_events
   where created_at < now() - interval '1 day';
$$;

revoke all on function public.prune_old_rows() from public, anon, authenticated;
grant execute on function public.prune_old_rows() to service_role;

-- Realtime inserts for the sky.
do $$
begin
  alter publication supabase_realtime add table public.lanterns;
exception when duplicate_object then null;
end $$;
