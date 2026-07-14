create table if not exists public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_net_income numeric not null default 0,
  equity numeric not null default 0,
  monthly_fixed_costs numeric not null default 0,
  existing_loan_payments numeric not null default 0,
  marital_status text,
  number_of_children integer not null default 0,
  purchase_purpose text not null default 'owner_occupied'
    check (purchase_purpose in ('owner_occupied','investment')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.financial_profiles enable row level security;

drop policy if exists "financial_profiles_owner_all" on public.financial_profiles;
create policy "financial_profiles_owner_all"
on public.financial_profiles for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.financial_profiles to authenticated;
grant select, insert, update, delete on table public.financial_profiles to service_role;

alter table public.financial_profiles
  add column if not exists marital_status text,
  add column if not exists number_of_children integer not null default 0,
  add column if not exists purchase_type text not null default 'alone',
  add column if not exists annual_gross_income numeric not null default 0,
  add column if not exists marginal_tax_rate_percent numeric not null default 0,
  add column if not exists partner_data jsonb,
  add column if not exists kfw_data jsonb not null default '{}'::jsonb,
  add column if not exists tax_orientation jsonb not null default '{}'::jsonb;

alter table public.financial_profiles
  drop constraint if exists financial_profiles_purchase_type_check;

alter table public.financial_profiles
  add constraint financial_profiles_purchase_type_check
  check (purchase_type in ('alone', 'joint'));
