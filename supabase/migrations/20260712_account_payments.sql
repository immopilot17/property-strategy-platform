alter table public.payments
  add column if not exists credits integer not null default 0;

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
begin
  if not (
    (payment_package_code = 'starter' and payment_amount_cents = 799 and purchased_credits = 5) or
    (payment_package_code = 'plus' and payment_amount_cents = 1499 and purchased_credits = 10) or
    (payment_package_code = 'pro' and payment_amount_cents = 1999 and purchased_credits = 20) or
    (payment_package_code = 'premium' and payment_amount_cents = 2499 and purchased_credits = 35)
  ) then
    raise exception 'Invalid payment package';
  end if;

  insert into public.payments (user_id, provider, provider_payment_id, amount_cents, currency, status, package_code, credits)
  values (payment_user_id, payment_provider, external_payment_id, payment_amount_cents, 'EUR', 'completed', payment_package_code, purchased_credits)
  on conflict (provider_payment_id) do nothing;

  if found then
    insert into public.analysis_credits (user_id, credits)
    values (payment_user_id, purchased_credits)
    on conflict (user_id) do update set credits = analysis_credits.credits + excluded.credits, updated_at = now();
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.complete_credit_payment(uuid,text,text,integer,text,integer) from public, anon, authenticated;
grant execute on function public.complete_credit_payment(uuid,text,text,integer,text,integer) to service_role;
