create index if not exists agent_results_analysis_id_idx
  on public.agent_results (analysis_id);

create index if not exists financial_profiles_user_id_idx
  on public.financial_profiles (user_id);

create index if not exists purchase_strategies_analysis_id_idx
  on public.purchase_strategies (analysis_id);

revoke all on table public.founder_benefits from service_role;
grant select on table public.founder_benefits to service_role;
