-- MY WISHLIST — Supabase setup
-- Run this entire script in Supabase -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product_url text not null,
  image_url text not null,
  image_path text,
  description text default '',
  price numeric(12, 2),
  reserved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.wishes enable row level security;

-- Public wishlist: visitors can read, add, edit reservation state and delete.
-- This is intentionally public because the site has no login system.
drop policy if exists "public read wishes" on public.wishes;
create policy "public read wishes"
on public.wishes
for select
to anon, authenticated
using (true);

drop policy if exists "public insert wishes" on public.wishes;
create policy "public insert wishes"
on public.wishes
for insert
to anon, authenticated
with check (true);

drop policy if exists "public update wishes" on public.wishes;
create policy "public update wishes"
on public.wishes
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public delete wishes" on public.wishes;
create policy "public delete wishes"
on public.wishes
for delete
to anon, authenticated
using (true);

-- Make sure the table is available through Supabase Realtime.
alter table public.wishes replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wishes'
  ) then
    alter publication supabase_realtime add table public.wishes;
  end if;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication is not available yet; enable Realtime in the Dashboard and rerun this part.';
end $$;


-- STORAGE
-- Create a PUBLIC bucket named wishlist-images.
insert into storage.buckets (id, name, public)
values ('wishlist-images', 'wishlist-images', true)
on conflict (id) do update set public = true;

-- Anyone can view uploaded wishlist images.
drop policy if exists "public read wishlist images" on storage.objects;
create policy "public read wishlist images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'wishlist-images');

-- Anyone can upload an image.
drop policy if exists "public upload wishlist images" on storage.objects;
create policy "public upload wishlist images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'wishlist-images');

-- Anyone can delete images. Needed because visitors can delete wishes.
drop policy if exists "public delete wishlist images" on storage.objects;
create policy "public delete wishlist images"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'wishlist-images');

-- Optional: if your Supabase dashboard does not expose Realtime automatically,
-- open Database -> Replication and make sure public.wishes is enabled.
