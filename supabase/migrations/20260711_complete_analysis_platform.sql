create extension if not exists "pgcrypto";

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
using (
  exists (
    select 1
    from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.analyses
    where analyses.id = purchase_strategies.analysis_id
      and analyses.user_id = auth.uid()
  )
);

drop policy if exists "agent_results_owner_all" on public.agent_results;
create policy "agent_results_owner_all"
on public.agent_results for all
using (
  exists (
    select 1
    from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.analyses
    where analyses.id = agent_results.analysis_id
      and analyses.user_id = auth.uid()
  )
);

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
