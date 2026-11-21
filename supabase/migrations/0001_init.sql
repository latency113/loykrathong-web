-- Loy Krathong schema for Supabase (Postgres).
-- Run once in the SQL editor, or: supabase db push

create extension if not exists pgcrypto;

-- One row per krathong. The 3D shape is not stored: only its parameters.
create table if not exists public.krathongs (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 24),
  wish text not null default '' check (char_length(wish) <= 140),
  config jsonb not null,
  position_x real not null,
  position_z real not null,
  reports integer not null default 0,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index if not exists krathongs_live_idx
  on public.krathongs (created_at desc)
  where hidden_at is null;

-- Rate limiting ledger. Hashed IP only, pruned after 1 day.
create table if not exists public.wish_events (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists wish_events_ip_idx
  on public.wish_events (ip_hash, created_at desc);

-- Nobody may read the rate-limit ledger through the API, including hashed IPs.
alter table public.wish_events enable row level security;

-- The public (anon key) may read live krathongs. Nobody but the server
-- (service role) may write.
alter table public.krathongs enable row level security;

drop policy if exists "live krathongs are readable" on public.krathongs;
create policy "live krathongs are readable"
  on public.krathongs
  for select
  to anon, authenticated
  using (hidden_at is null and expires_at > now());

-- Reporting: count, and auto-hide after N reports.
create or replace function public.report_krathong(
  p_id uuid,
  p_hide_after integer default 3
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.krathongs
     set reports = reports + 1,
         hidden_at = case
           when reports + 1 >= p_hide_after then now()
           else hidden_at
         end
   where id = p_id and hidden_at is null
  returning reports;
$$;

revoke all on function public.report_krathong(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.report_krathong(uuid, integer)
  to service_role;

-- Housekeeping. Old krathongs are kept 30 days after expiry so a bad delete
-- can be undone, then removed for good.
create or replace function public.prune_old_rows()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.krathongs
   where expires_at < now() - interval '30 days'
      or (hidden_at is not null and hidden_at < now() - interval '30 days');
  delete from public.wish_events
   where created_at < now() - interval '1 day';
$$;

revoke all on function public.prune_old_rows() from public, anon, authenticated;
grant execute on function public.prune_old_rows() to service_role;

-- Optional hourly pruning (Supabase ships pg_cron). Safe to skip.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'prune-loykrathong',
    '17 * * * *',
    'select public.prune_old_rows()'
  );
exception when others then
  raise notice 'pg_cron not scheduled: %', sqlerrm;
end $$;

-- Realtime inserts for the river.
do $$
begin
  alter publication supabase_realtime add table public.krathongs;
exception when duplicate_object then null;
end $$;
