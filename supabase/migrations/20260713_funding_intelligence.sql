create table if not exists public.funding_program_versions (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  program_id text not null,
  program_name text not null,
  official_source text not null,
  source_checksum text not null,
  source_snapshot text not null,
  normalized_data jsonb not null,
  valid_from date,
  valid_until date,
  source_published_at timestamptz,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (provider_id, program_id, source_checksum)
);

create index if not exists funding_program_current_idx
  on public.funding_program_versions (provider_id, program_id, fetched_at desc);

alter table public.funding_program_versions enable row level security;

drop policy if exists "funding_programs_public_read" on public.funding_program_versions;
create policy "funding_programs_public_read"
on public.funding_program_versions for select
using (true);

create or replace view public.current_funding_programs
with (security_invoker = true)
as
select distinct on (provider_id, program_id)
  id, provider_id, program_id, program_name, official_source,
  normalized_data, valid_from, valid_until, source_published_at, fetched_at
from public.funding_program_versions
where (valid_until is null or valid_until >= current_date)
order by provider_id, program_id, fetched_at desc;
