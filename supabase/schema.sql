create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  user_tier text not null default 'free' check (user_tier in ('free', 'starter', 'plus', 'pro', 'premium', 'founder')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_net_income numeric not null default 0,
  equity numeric not null default 0,
  monthly_fixed_costs numeric not null default 0,
  existing_loan_payments numeric not null default 0,
  marital_status text,
  number_of_children integer not null default 0,
  purchase_type text not null default 'alone' check (purchase_type in ('alone','joint')),
  annual_gross_income numeric not null default 0,
  marginal_tax_rate_percent numeric not null default 0,
  partner_data jsonb,
  kfw_data jsonb not null default '{}'::jsonb,
  tax_orientation jsonb not null default '{}'::jsonb,
  purchase_purpose text not null check (purchase_purpose in ('owner_occupied','investment')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  status text not null default 'draft',
  analysis_type text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_strategies (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  strategy_type text not null check (strategy_type in ('safe','balanced','maximum','alternative')),
  title text not null,
  purchase_price numeric,
  monthly_rate numeric,
  reserve numeric,
  risk_level text check (risk_level in ('low','medium','high')),
  rationale jsonb not null default '[]'::jsonb
);

create table if not exists public.agent_results (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  agent_name text not null,
  facts jsonb not null default '{}'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  confidence text check (confidence in ('low','medium','high')),
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credits integer not null default 0,
  token_balance bigint not null default 0,
  tokens_used bigint not null default 0,
  is_unlimited boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.api_usage_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  model text not null,
  reserved_tokens bigint not null check (reserved_tokens > 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  total_tokens bigint not null default 0 check (total_tokens >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists api_usage_events_user_created_idx
  on public.api_usage_events (user_id, created_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null,
  package_code text,
  credits integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx
  on public.payments (user_id);

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

alter table public.profiles enable row level security;
alter table public.founder_users enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.analyses enable row level security;
alter table public.purchase_strategies enable row level security;
alter table public.agent_results enable row level security;
alter table public.analysis_credits enable row level security;
alter table public.api_usage_events enable row level security;
alter table public.payments enable row level security;
alter table public.funding_program_versions enable row level security;

create policy "profiles_owner_all"
on public.profiles for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "founders_read_own_status"
on public.founder_users for select
to authenticated
using ((select auth.uid()) = id);

revoke all on table public.founder_users from anon, authenticated;
grant select (id, verified_at) on table public.founder_users to authenticated;
grant select, insert, update, delete on table public.founder_users to service_role;

revoke insert, update on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, full_name, created_at, updated_at) on table public.profiles to authenticated;
grant update (full_name, updated_at) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy "financial_profiles_owner_all"
on public.financial_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "properties_owner_all"
on public.properties for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "analyses_owner_all"
on public.analyses for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "purchase_strategies_owner_all"
on public.purchase_strategies for all
to authenticated
using (
  exists (
    select 1 from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = (select auth.uid())
  )
);

create policy "agent_results_owner_all"
on public.agent_results for all
to authenticated
using (
  exists (
    select 1 from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = (select auth.uid())
  )
);

create policy "credits_owner_select"
on public.analysis_credits for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "api_usage_owner_select"
on public.api_usage_events for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on table public.api_usage_events to authenticated;
grant select, insert, update, delete on table public.api_usage_events to service_role;

create policy "payments_owner_select"
on public.payments for select
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.financial_profiles to authenticated;
grant select, insert, update, delete on table public.properties to authenticated;
grant select, insert, update, delete on table public.analyses to authenticated;
grant select, insert, update, delete on table public.purchase_strategies to authenticated;
grant select, insert, update, delete on table public.agent_results to authenticated;
grant select on table public.analysis_credits to authenticated;
grant select on table public.payments to authenticated;

grant select, insert, update, delete on table public.financial_profiles to service_role;
grant select, insert, update, delete on table public.properties to service_role;
grant select, insert, update, delete on table public.analyses to service_role;
grant select, insert, update, delete on table public.purchase_strategies to service_role;
grant select, insert, update, delete on table public.agent_results to service_role;
grant select, insert, update, delete on table public.analysis_credits to service_role;
grant select, insert, update, delete on table public.payments to service_role;

drop policy if exists "funding_programs_public_read" on public.funding_program_versions;

revoke all on table public.funding_program_versions from anon, authenticated;
grant select, insert on table public.funding_program_versions to service_role;

create or replace view public.current_funding_programs
with (security_invoker = true)
as
select distinct on (provider_id, program_id)
  id, provider_id, program_id, program_name, official_source,
  normalized_data, valid_from, valid_until, source_published_at, fetched_at
from public.funding_program_versions
where (valid_until is null or valid_until >= current_date)
order by provider_id, program_id, fetched_at desc;

revoke all on table public.current_funding_programs from anon, authenticated;
grant select on table public.current_funding_programs to service_role;
