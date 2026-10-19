-- ClearCut Stage 4: payments — manual top-up (admin-approved) + provider-ready schema
-- Run this in Supabase SQL Editor (one time).

-- 1. Allow 'manual' provider for admin-approved top-ups
--    (Online Paytm/PhonePe orders will use 'paytm'/'phonepe' once the
--    merchant account is approved — never trust client-set amounts.)
alter table public.payments
  drop constraint if exists payments_provider_check;
alter table public.payments
  add constraint payments_provider_check
  check (provider in ('paytm', 'phonepe', 'manual'));

-- 2. ADMIN-ONLY wallet credit for manual top-ups.
--    Verifies admin role server-side. Idempotent. Writes audit ledger entry.
create or replace function public.admin_credit_wallet(
  p_user_id uuid,
  p_amount_paise bigint,
  p_payment_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
  v_txn_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_amount_paise <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id into v_txn_id
  from public.wallet_transactions
  where idempotency_key = p_idempotency_key;
  if v_txn_id is not null then
    return v_txn_id; -- already credited, no double top-up
  end if;

  update public.payments
  set status = 'success', verified_at = now()
  where id = p_payment_id;

  update public.wallets
  set balance_paise = balance_paise + p_amount_paise,
      updated_at = now()
  where user_id = p_user_id
  returning balance_paise into v_balance;

  insert into public.wallet_transactions
    (user_id, type, amount_paise, balance_after_paise,
     reference_type, reference_id, idempotency_key, note)
  values
    (p_user_id, 'topup', p_amount_paise, v_balance,
     'payment', p_payment_id, p_idempotency_key, 'Manual top-up approved by admin')
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

grant execute on function public.admin_credit_wallet(uuid, bigint, uuid, text) to authenticated;
