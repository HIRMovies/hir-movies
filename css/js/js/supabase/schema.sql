-- =====================================================================
-- Hir Movies — Supabase schema + Row Level Security
-- Run in: Supabase Dashboard > SQL Editor > New query > Run
-- Safe to run once on a fresh project.
-- =====================================================================

-- 1) Tables ------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_so    text not null,
  name_en    text,
  sort_order int  not null default 0
);

create table if not exists public.movies (
  id               uuid primary key default gen_random_uuid(),
  title_so         text not null check (char_length(title_so) between 1 and 200),
  synopsis_so      text,
  poster_url       text check (poster_url is null or poster_url ~* '^https://'),
  category_id      uuid references public.categories(id) on delete set null,
  release_year     smallint check (release_year between 1900 and 2100),
  duration_minutes smallint check (duration_minutes > 0),
  bunny_video_id   text check (bunny_video_id is null or bunny_video_id ~ '^[A-Za-z0-9-]{8,64}$'),
  featured         boolean not null default false,
  published        boolean not null default false,
  views            integer not null default 0 check (views >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Administrators (linked to Supabase Auth users). No API access at all.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 2) Indexes -----------------------------------------------------------
create index if not exists movies_pub_created_idx on public.movies (published, created_at desc);
create index if not exists movies_pub_views_idx   on public.movies (published, views desc);
create index if not exists movies_category_idx    on public.movies (category_id);
create index if not exists movies_featured_idx    on public.movies (featured) where featured and published;

-- 3) updated_at trigger ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at
before update on public.movies
for each row execute function public.set_updated_at();

-- 4) Admin check -------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 5) Row Level Security ------------------------------------------------
alter table public.categories enable row level security;
alter table public.movies     enable row level security;
alter table public.admins     enable row level security;   -- no policies = closed to the API

create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "movies_public_read_published" on public.movies
  for select to anon, authenticated using (published);
create policy "movies_admin_all" on public.movies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6) Privileges (defence in depth; RLS still decides row access) -------
revoke all on public.admins from anon, authenticated;
revoke all on public.movies, public.categories from anon;
grant select on public.movies, public.categories to anon;
grant select, insert, update, delete on public.movies, public.categories to authenticated;

-- 7) Seed categories ---------------------------------------------------
insert into public.categories (slug, name_so, name_en, sort_order) values
  ('action',      'Ficil',       'Action',      1),
  ('drama',       'Riwaayad',    'Drama',       2),
  ('comedy',      'Majaajillo',  'Comedy',      3),
  ('adventure',   'Sahamin',     'Adventure',   4),
  ('horror',      'Cabsi',       'Horror',      5),
  ('documentary', 'Dokumentari', 'Documentary', 6)
on conflict (slug) do nothing;

-- 8) Make yourself an administrator -----------------------------------
-- First create a user: Dashboard > Authentication > Users > Add user (email + password).
-- Then run this with YOUR email:
-- insert into public.admins (user_id) select id from auth.users where email = 'EMAIL_KAAGA@example.com';
