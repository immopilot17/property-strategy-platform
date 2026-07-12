create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  purchase_price numeric,
  living_area numeric,
  city text,
  postal_code text,
  year_built integer,
  monthly_rent numeric,
  monthly_service_charge numeric,
  renovation_cost numeric,
  energy_class text,
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
  updated_at timestamptz not null default now(),
  unique(user_id)
);

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

alter table public.profiles enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.properties enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_credits enable row level security;
alter table public.payments enable row level security;

create policy "profiles_owner_all"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "financial_profiles_owner_all"
on public.financial_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "properties_owner_all"
on public.properties for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "analyses_owner_all"
on public.analyses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "credits_owner_select"
on public.analysis_credits for select
using (auth.uid() = user_id);

create policy "payments_owner_select"
on public.payments for select
using (auth.uid() = user_id);
