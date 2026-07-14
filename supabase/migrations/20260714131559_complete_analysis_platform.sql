create extension if not exists "pgcrypto";

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

alter table public.analyses
  add column if not exists title text,
  add column if not exists ai_summary text,
  add column if not exists updated_at timestamptz not null default now();

update public.analyses
set title = coalesce(title, 'Immobilienanalyse')
where title is null;

alter table public.analyses
  alter column title set not null;

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

alter table public.purchase_strategies enable row level security;
alter table public.agent_results enable row level security;

drop policy if exists "purchase_strategies_owner_all" on public.purchase_strategies;
create policy "purchase_strategies_owner_all"
on public.purchase_strategies for all
to authenticated
using (
  exists (
    select 1
    from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = (select auth.uid())
  )
);

drop policy if exists "agent_results_owner_all" on public.agent_results;
create policy "agent_results_owner_all"
on public.agent_results for all
to authenticated
using (
  exists (
    select 1
    from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete on table public.purchase_strategies to authenticated;
grant select, insert, update, delete on table public.agent_results to authenticated;
grant select, insert, update, delete on table public.purchase_strategies to service_role;
grant select, insert, update, delete on table public.agent_results to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at
before update on public.analyses
for each row execute function public.set_updated_at();
