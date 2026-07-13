create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  address_line1 text not null,
  street text not null default '',
  house_number text not null default '',
  city text not null default '',
  postal_code text not null,
  country text not null default 'Deutschland',
  lat double precision,
  lon double precision,
  location_source text,
  geocoded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.properties
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists address_line1 text not null default '',
  add column if not exists street text not null default '',
  add column if not exists house_number text not null default '',
  add column if not exists city text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists country text not null default 'Deutschland',
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists location_source text,
  add column if not exists geocoded_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists properties_owner_created_idx
  on public.properties (owner_id, created_at desc);

alter table public.properties enable row level security;

drop policy if exists "properties_owner_all" on public.properties;
create policy "properties_owner_all"
on public.properties for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

grant select, insert, update, delete on table public.properties to authenticated;
