create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists user_tier text not null default 'free'
  check (user_tier in ('free', 'starter', 'plus', 'pro', 'premium', 'founder'));

alter table public.profiles enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all"
on public.profiles for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create table if not exists public.founder_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.founder_users enable row level security;

drop policy if exists "founder_users_read" on public.founder_users;
create policy "founders_read_own_status"
on public.founder_users for select
to authenticated
using ((select auth.uid()) = id);

revoke all on table public.founder_users from anon, authenticated;
grant select (id, verified_at) on table public.founder_users to authenticated;
grant select, insert, update, delete on table public.founder_users to service_role;

-- user_tier is authorization data and must never be writable by the user.
revoke insert, update on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, full_name, created_at, updated_at) on table public.profiles to authenticated;
grant update (full_name, updated_at) on table public.profiles to authenticated;

drop policy if exists "analyses_owner_all" on public.analyses;
drop policy if exists "Users can read own analyses" on public.analyses;
drop policy if exists "Users can insert own analyses" on public.analyses;
drop policy if exists "Users can update own analyses" on public.analyses;
drop policy if exists "Users can delete own analyses" on public.analyses;

create policy "analyses_owner_select"
on public.analyses for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "analyses_owner_insert"
on public.analyses for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "analyses_owner_update"
on public.analyses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "analyses_owner_delete"
on public.analyses for delete
to authenticated
using ((select auth.uid()) = user_id);

alter table public.analysis_credits
  add column if not exists is_unlimited boolean not null default false;

create or replace function public.grant_founder_status(
  founder_email text,
  founder_name text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  founder_id uuid;
begin
  select id into founder_id from auth.users where email = founder_email;

  if founder_id is null then
    raise exception 'User not found with email: %', founder_email;
  end if;

  insert into public.founder_users (id, email, name)
  values (founder_id, founder_email, founder_name)
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        verified_at = now();

  insert into public.profiles (id, user_tier)
  values (founder_id, 'founder')
  on conflict (id) do update set user_tier = 'founder', updated_at = now();

  insert into public.analysis_credits (user_id, credits, is_unlimited)
  values (founder_id, 99999, true)
  on conflict (user_id) do update
    set credits = greatest(public.analysis_credits.credits, 99999),
        is_unlimited = true,
        updated_at = now();

  return true;
end;
$$;

create or replace function public.revoke_founder_status(
  target_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.founder_users where id = target_user_id;
  update public.profiles set user_tier = 'free', updated_at = now() where id = target_user_id;
  update public.analysis_credits set is_unlimited = false, updated_at = now() where user_id = target_user_id;
  return true;
end;
$$;

create or replace function public.is_founder(user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.founder_users where id = user_id);
$$;

create or replace function public.get_user_tier(user_id uuid)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select case
    when exists (select 1 from public.founder_users where id = user_id) then 'founder'
    else coalesce((select user_tier from public.profiles where id = user_id), 'free')
  end;
$$;

create or replace function public.has_analysis_credits(
  user_id uuid,
  required_credits integer default 1
) returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((
    select is_unlimited or credits >= required_credits
    from public.analysis_credits
    where analysis_credits.user_id = has_analysis_credits.user_id
  ), false);
$$;

create or replace function public.reserve_api_tokens(
  usage_user_id uuid,
  usage_request_id uuid,
  usage_feature text,
  usage_model text,
  token_reservation bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_tokens bigint;
  unlimited_access boolean;
begin
  if token_reservation <= 0 or token_reservation > 100000 then
    raise exception 'Invalid token reservation';
  end if;

  select token_balance, is_unlimited
  into remaining_tokens, unlimited_access
  from public.analysis_credits
  where user_id = usage_user_id
  for update;

  if not found or (not unlimited_access and remaining_tokens < token_reservation) then
    raise exception 'Insufficient API token balance';
  end if;

  if not unlimited_access then
    update public.analysis_credits
    set token_balance = token_balance - token_reservation,
        updated_at = now()
    where user_id = usage_user_id
    returning token_balance into remaining_tokens;
  end if;

  insert into public.api_usage_events (id, user_id, feature, model, reserved_tokens)
  values (usage_request_id, usage_user_id, usage_feature, usage_model, token_reservation);

  return remaining_tokens;
end;
$$;

create or replace function public.settle_api_tokens(
  usage_request_id uuid,
  actual_input_tokens bigint,
  actual_output_tokens bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_row public.api_usage_events%rowtype;
  actual_total bigint;
  remaining_tokens bigint;
  unlimited_access boolean;
begin
  select * into usage_row
  from public.api_usage_events
  where id = usage_request_id and status = 'reserved'
  for update;

  if not found then
    raise exception 'Unknown or settled API usage';
  end if;

  actual_total := greatest(0, actual_input_tokens) + greatest(0, actual_output_tokens);

  select is_unlimited into unlimited_access
  from public.analysis_credits
  where user_id = usage_row.user_id;

  update public.analysis_credits
  set token_balance = case
        when unlimited_access then token_balance
        else greatest(0, token_balance + usage_row.reserved_tokens - actual_total)
      end,
      tokens_used = tokens_used + actual_total,
      updated_at = now()
  where user_id = usage_row.user_id
  returning token_balance into remaining_tokens;

  update public.api_usage_events
  set input_tokens = greatest(0, actual_input_tokens),
      output_tokens = greatest(0, actual_output_tokens),
      total_tokens = actual_total,
      status = 'completed',
      completed_at = now()
  where id = usage_request_id;

  return remaining_tokens;
end;
$$;

create or replace function public.release_api_token_reservation(
  usage_request_id uuid
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_row public.api_usage_events%rowtype;
  remaining_tokens bigint;
  unlimited_access boolean;
begin
  select * into usage_row
  from public.api_usage_events
  where id = usage_request_id and status = 'reserved'
  for update;

  if not found then
    return null;
  end if;

  select is_unlimited into unlimited_access
  from public.analysis_credits
  where user_id = usage_row.user_id;

  update public.analysis_credits
  set token_balance = case
        when unlimited_access then token_balance
        else token_balance + usage_row.reserved_tokens
      end,
      updated_at = now()
  where user_id = usage_row.user_id
  returning token_balance into remaining_tokens;

  update public.api_usage_events
  set status = 'failed', completed_at = now()
  where id = usage_request_id;

  return remaining_tokens;
end;
$$;

create or replace view public.founder_benefits
with (security_invoker = true)
as
select
  fu.id,
  fu.email,
  fu.name,
  'founder'::text as tier,
  true as has_unlimited_credits,
  true as can_export_reports,
  true as has_priority_support,
  fu.verified_at
from public.founder_users fu;

revoke all on function public.grant_founder_status(text, text) from public, anon, authenticated;
revoke all on function public.revoke_founder_status(uuid) from public, anon, authenticated;
revoke all on function public.is_founder(uuid) from public, anon, authenticated;
revoke all on function public.get_user_tier(uuid) from public, anon, authenticated;
revoke all on function public.has_analysis_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.reserve_api_tokens(uuid, uuid, text, text, bigint) from public, anon, authenticated;
revoke all on function public.settle_api_tokens(uuid, bigint, bigint) from public, anon, authenticated;
revoke all on function public.release_api_token_reservation(uuid) from public, anon, authenticated;
revoke all on table public.founder_benefits from public, anon, authenticated;

grant execute on function public.grant_founder_status(text, text) to service_role;
grant execute on function public.revoke_founder_status(uuid) to service_role;
grant execute on function public.is_founder(uuid) to service_role;
grant execute on function public.get_user_tier(uuid) to service_role;
grant execute on function public.has_analysis_credits(uuid, integer) to service_role;
grant execute on function public.reserve_api_tokens(uuid, uuid, text, text, bigint) to service_role;
grant execute on function public.settle_api_tokens(uuid, bigint, bigint) to service_role;
grant execute on function public.release_api_token_reservation(uuid) to service_role;
grant select on table public.founder_benefits to service_role;
