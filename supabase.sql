-- MY WISHLIST — Supabase setup
-- Run this in Supabase -> SQL Editor.
--
-- This version intentionally allows ANY visitor to add, reserve/unreserve,
-- and delete wishes. There is NO owner/admin login.

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

drop policy if exists "owner delete wishes" on public.wishes;
drop policy if exists "public delete wishes" on public.wishes;
create policy "public delete wishes"
on public.wishes
for delete
to anon, authenticated
using (true);

alter table public.wishes replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wishes'
  ) then
    alter publication supabase_realtime add table public.wishes;
  end if;
exception when undefined_object then
  raise notice 'Enable Realtime for public.wishes in the Dashboard, then rerun the publication part.';
end $$;

-- No Storage bucket is required.
-- Product images are entered as external image URLs.
