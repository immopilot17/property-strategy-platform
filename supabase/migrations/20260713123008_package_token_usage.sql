create extension if not exists "pgcrypto";

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

alter table public.analysis_credits enable row level security;
alter table public.payments enable row level security;

drop policy if exists "credits_owner_select" on public.analysis_credits;
create policy "credits_owner_select"
on public.analysis_credits for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "payments_owner_select" on public.payments;
create policy "payments_owner_select"
on public.payments for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on table public.analysis_credits, public.payments to authenticated;
grant select, insert, update, delete on table public.analysis_credits, public.payments to service_role;

alter table public.analysis_credits
  add column if not exists token_balance bigint not null default 0,
  add column if not exists tokens_used bigint not null default 0;

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

alter table public.api_usage_events enable row level security;

drop policy if exists "api_usage_owner_select" on public.api_usage_events;
create policy "api_usage_owner_select"
on public.api_usage_events for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on table public.api_usage_events to authenticated;
grant select, insert, update, delete on table public.api_usage_events to service_role;
grant select, insert, update on table public.analysis_credits to service_role;

with purchased_tokens as (
  select user_id,
    sum(case package_code
      when 'starter' then 25000
      when 'plus' then 60000
      when 'pro' then 120000
      when 'premium' then 250000
      else 0
    end)::bigint as tokens
  from public.payments
  where status = 'completed'
  group by user_id
)
update public.analysis_credits as balance
set token_balance = greatest(
  balance.token_balance,
  balance.credits::bigint * 5000,
  coalesce(purchased_tokens.tokens, 0)
)
from purchased_tokens
where purchased_tokens.user_id = balance.user_id;

update public.analysis_credits
set token_balance = greatest(token_balance, credits::bigint * 5000)
where token_balance = 0 and credits > 0;

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
begin
  if token_reservation <= 0 or token_reservation > 100000 then
    raise exception 'Invalid token reservation';
  end if;

  update public.analysis_credits
  set token_balance = token_balance - token_reservation,
      updated_at = now()
  where user_id = usage_user_id
    and token_balance >= token_reservation
  returning token_balance into remaining_tokens;

  if remaining_tokens is null then
    raise exception 'Insufficient API token balance';
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
begin
  select * into usage_row
  from public.api_usage_events
  where id = usage_request_id and status = 'reserved'
  for update;

  if not found then
    raise exception 'Unknown or settled API usage';
  end if;

  actual_total := greatest(0, actual_input_tokens) + greatest(0, actual_output_tokens);

  update public.analysis_credits
  set token_balance = greatest(0, token_balance + usage_row.reserved_tokens - actual_total),
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
begin
  select * into usage_row
  from public.api_usage_events
  where id = usage_request_id and status = 'reserved'
  for update;

  if not found then
    return null;
  end if;

  update public.analysis_credits
  set token_balance = token_balance + usage_row.reserved_tokens,
      updated_at = now()
  where user_id = usage_row.user_id
  returning token_balance into remaining_tokens;

  update public.api_usage_events
  set status = 'failed', completed_at = now()
  where id = usage_request_id;

  return remaining_tokens;
end;
$$;

create or replace function public.complete_credit_payment(
  payment_user_id uuid,
  payment_provider text,
  external_payment_id text,
  payment_amount_cents integer,
  payment_package_code text,
  purchased_credits integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  purchased_tokens bigint;
begin
  if not (
    (payment_package_code = 'starter' and payment_amount_cents = 799 and purchased_credits = 5) or
    (payment_package_code = 'plus' and payment_amount_cents = 1499 and purchased_credits = 10) or
    (payment_package_code = 'pro' and payment_amount_cents = 1999 and purchased_credits = 20) or
    (payment_package_code = 'premium' and payment_amount_cents = 2499 and purchased_credits = 35)
  ) then
    raise exception 'Invalid payment package';
  end if;

  purchased_tokens := case payment_package_code
    when 'starter' then 25000
    when 'plus' then 60000
    when 'pro' then 120000
    when 'premium' then 250000
  end;

  insert into public.payments (user_id, provider, provider_payment_id, amount_cents, currency, status, package_code, credits)
  values (payment_user_id, payment_provider, external_payment_id, payment_amount_cents, 'EUR', 'completed', payment_package_code, purchased_credits)
  on conflict (provider_payment_id) do nothing;

  if found then
    insert into public.analysis_credits (user_id, credits, token_balance)
    values (payment_user_id, purchased_credits, purchased_tokens)
    on conflict (user_id) do update
      set credits = analysis_credits.credits + excluded.credits,
          token_balance = analysis_credits.token_balance + excluded.token_balance,
          updated_at = now();
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.reserve_api_tokens(uuid,uuid,text,text,bigint) from public, anon, authenticated;
revoke all on function public.settle_api_tokens(uuid,bigint,bigint) from public, anon, authenticated;
revoke all on function public.release_api_token_reservation(uuid) from public, anon, authenticated;
revoke all on function public.complete_credit_payment(uuid,text,text,integer,text,integer) from public, anon, authenticated;

grant execute on function public.reserve_api_tokens(uuid,uuid,text,text,bigint) to service_role;
grant execute on function public.settle_api_tokens(uuid,bigint,bigint) to service_role;
grant execute on function public.release_api_token_reservation(uuid) to service_role;
grant execute on function public.complete_credit_payment(uuid,text,text,integer,text,integer) to service_role;
