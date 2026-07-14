create schema if not exists private;

do $$ begin
  create type public.app_role as enum ('user', 'admin', 'founder');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{2,63}$'),
  label text not null,
  description text not null,
  enabled boolean not null default true,
  environment text not null default 'production' check (environment in ('production', 'staging', 'development')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_at_idx on public.admin_audit_events (created_at desc);
create index if not exists user_roles_role_idx on public.user_roles (role);

create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select ur.role from public.user_roles ur where ur.user_id = (select auth.uid())),
    'user'::public.app_role
  );
$$;

create or replace function private.sync_role_to_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('app_role', new.role::text)
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists sync_role_to_auth_metadata on public.user_roles;
create trigger sync_role_to_auth_metadata
after insert or update of role on public.user_roles
for each row execute function private.sync_role_to_auth_metadata();

insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role from auth.users
on conflict (user_id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'founder'::public.app_role from public.founder_users
on conflict (user_id) do update set role = 'founder', updated_at = now();

insert into public.user_roles (user_id, role)
select id, 'founder'::public.app_role from auth.users where lower(email) = lower('immobilienfirst@gmail.com')
on conflict (user_id) do update set role = 'founder', updated_at = now();

insert into public.feature_flags (key, label, description, enabled)
values
  ('ai_analysis', 'KI-Analyse', 'KI-Erklärungen und Analyse-Agenten', true),
  ('url_import', 'Inserat-Import', 'Immobiliendaten aus einer öffentlichen URL übernehmen', true),
  ('funding_intelligence', 'Förderprüfung', 'Personalisierte Prüfung offizieller Förderprogramme', true),
  ('premium_reports', 'Premium-Berichte', 'Vollständige PDF-Berichte erzeugen', true),
  ('debug_tools', 'Debug-Werkzeuge', 'Technische Diagnosewerkzeuge für Founder', true)
on conflict (key) do nothing;

alter table public.user_roles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.admin_audit_events enable row level security;

drop policy if exists "user_roles_select" on public.user_roles;
create policy "user_roles_select" on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id or private.current_user_role() in ('admin', 'founder'));

drop policy if exists "user_roles_founder_write" on public.user_roles;
create policy "user_roles_founder_write" on public.user_roles for all to authenticated
using (private.current_user_role() = 'founder')
with check (private.current_user_role() = 'founder');

drop policy if exists "feature_flags_admin_read" on public.feature_flags;
create policy "feature_flags_admin_read" on public.feature_flags for select to authenticated
using (private.current_user_role() in ('admin', 'founder'));

drop policy if exists "feature_flags_admin_write" on public.feature_flags;
create policy "feature_flags_admin_write" on public.feature_flags for update to authenticated
using (private.current_user_role() in ('admin', 'founder'))
with check (private.current_user_role() in ('admin', 'founder'));

drop policy if exists "admin_audit_read" on public.admin_audit_events;
create policy "admin_audit_read" on public.admin_audit_events for select to authenticated
using (private.current_user_role() in ('admin', 'founder'));

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated, service_role;
revoke all on function private.sync_role_to_auth_metadata() from public, anon, authenticated;

revoke all on table public.user_roles, public.feature_flags, public.admin_audit_events from anon;
grant select on table public.user_roles, public.feature_flags, public.admin_audit_events to authenticated;
grant update on table public.user_roles, public.feature_flags to authenticated;
grant select, insert, update, delete on table public.user_roles, public.feature_flags, public.admin_audit_events to service_role;

do $$
declare
  target_table text;
  admin_policy text;
begin
  foreach target_table in array array[
    'profiles', 'financial_profiles', 'properties', 'analyses', 'purchase_strategies',
    'agent_results', 'analysis_credits', 'api_usage_events', 'payments'
  ] loop
    admin_policy := target_table || '_admin_all';
    execute format('drop policy if exists %I on public.%I', admin_policy, target_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (private.current_user_role() in (''admin'', ''founder'')) with check (private.current_user_role() in (''admin'', ''founder''))',
      admin_policy,
      target_table
    );
  end loop;
end $$;

insert into public.admin_audit_events (actor_id, action, target_type, target_id, metadata)
select null, 'rbac.initialized', 'system', 'application', jsonb_build_object('roles', jsonb_build_array('founder', 'admin', 'user'));

