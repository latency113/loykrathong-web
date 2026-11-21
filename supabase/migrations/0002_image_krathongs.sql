-- Support uploaded image krathongs + Supabase Storage bucket.
-- Run in Supabase SQL Editor or: supabase db push

alter table public.krathongs
  alter column config drop not null;

alter table public.krathongs
  add column if not exists image_path text,
  add column if not exists image_url text;

-- Public bucket for compressed krathong images (1 GB free tier).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'krathongs',
  'krathongs',
  true,
  262144, -- 256 KB max per file
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read krathong images" on storage.objects;
create policy "public read krathong images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'krathongs');
