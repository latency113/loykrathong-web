-- Add blessing (heart) counter to krathongs with toggle (+1 / -1) support.
-- Run in Supabase SQL Editor or: supabase db push

alter table public.krathongs
  add column if not exists blessings integer not null default 0;

drop function if exists public.bless_krathong(uuid);
create or replace function public.bless_krathong(
  p_id uuid,
  p_delta integer default 1
)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.krathongs
     set blessings = greatest(0, blessings + case when p_delta < 0 then -1 else 1 end)
   where id = p_id and hidden_at is null
  returning blessings;
$$;

revoke all on function public.bless_krathong(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.bless_krathong(uuid, integer)
  to service_role;
