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
