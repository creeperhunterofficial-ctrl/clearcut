-- ClearCut Stage 3: wallet ledger (reserve -> capture / release)
-- Run this in Supabase SQL Editor (one time).
-- All money in integer paise. All operations atomic + idempotent.

-- 1. Track held amounts separately
alter table public.wallets
  add column if not exists reserved_paise bigint not null default 0
  check (reserved_paise >= 0);

-- 2. Allow zero-amount marker entries (capture events)
alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_amount_paise_check;
alter table public.wallet_transactions
  add constraint wallet_transactions_amount_paise_check
  check (amount_paise is not null);

-- 3. RESERVE: atomically hold funds when a job starts.
--    Deducts from balance, marks as reserved, writes ledger entry.
--    Raises 'Insufficient balance' if not enough. Idempotent via key.
create or replace function public.reserve_for_job(
  p_user_id uuid,
  p_job_id uuid,
  p_amount_paise bigint,
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
  if p_user_id != auth.uid() then
    raise exception 'Not authorized';
  end if;
  if p_amount_paise <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id into v_txn_id
  from public.wallet_transactions
  where idempotency_key = p_idempotency_key;
  if v_txn_id is not null then
    return v_txn_id; -- already done, no double charge
  end if;

  select balance_paise into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;
  if not found then
    raise exception 'Wallet not found';
  end if;
  if v_balance < p_amount_paise then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets
  set balance_paise = balance_paise - p_amount_paise,
      reserved_paise = reserved_paise + p_amount_paise,
      updated_at = now()
  where user_id = p_user_id
  returning balance_paise into v_balance;

  insert into public.wallet_transactions
    (user_id, type, amount_paise, balance_after_paise,
     reference_type, reference_id, idempotency_key, note)
  values
    (p_user_id, 'reserve', -p_amount_paise, v_balance,
     'job', p_job_id, p_idempotency_key, 'Reserved for video job')
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

-- 4. CAPTURE: job succeeded. Clears the hold; money stays deducted.
create or replace function public.capture_job_charge(
  p_user_id uuid,
  p_job_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserve_amt bigint;
  v_txn_id uuid;
begin
  if p_user_id != auth.uid() then
    raise exception 'Not authorized';
  end if;

  select id into v_txn_id
  from public.wallet_transactions
  where idempotency_key = p_idempotency_key;
  if v_txn_id is not null then
    return v_txn_id;
  end if;

  select abs(amount_paise) into v_reserve_amt
  from public.wallet_transactions
  where user_id = p_user_id
    and reference_type = 'job'
    and reference_id = p_job_id
    and type = 'reserve'
  order by created_at desc
  limit 1;
  if not found then
    raise exception 'No reservation found for job';
  end if;

  update public.wallets
  set reserved_paise = reserved_paise - v_reserve_amt,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_transactions
    (user_id, type, amount_paise, balance_after_paise,
     reference_type, reference_id, idempotency_key, note)
  values
    (p_user_id, 'capture', 0,
     (select balance_paise from public.wallets where user_id = p_user_id),
     'job', p_job_id, p_idempotency_key, 'Job completed, charge finalized')
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

-- 5. RELEASE: job failed. Refunds the held amount to balance.
create or replace function public.release_job_reservation(
  p_user_id uuid,
  p_job_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserve_amt bigint;
  v_balance bigint;
  v_txn_id uuid;
begin
  if p_user_id != auth.uid() then
    raise exception 'Not authorized';
  end if;

  select id into v_txn_id
  from public.wallet_transactions
  where idempotency_key = p_idempotency_key;
  if v_txn_id is not null then
    return v_txn_id;
  end if;

  select abs(amount_paise) into v_reserve_amt
  from public.wallet_transactions
  where user_id = p_user_id
    and reference_type = 'job'
    and reference_id = p_job_id
    and type = 'reserve'
  order by created_at desc limit 1;
  if not found then
    raise exception 'No reservation found for job';
  end if;

  update public.wallets
  set balance_paise = balance_paise + v_reserve_amt,
      reserved_paise = reserved_paise - v_reserve_amt,
      updated_at = now()
  where user_id = p_user_id
  returning balance_paise into v_balance;

  insert into public.wallet_transactions
    (user_id, type, amount_paise, balance_after_paise,
     reference_type, reference_id, idempotency_key, note)
  values
    (p_user_id, 'release', v_reserve_amt, v_balance,
     'job', p_job_id, p_idempotency_key, 'Job failed, reservation refunded')
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

-- 6. Let logged-in users call these (each function still checks auth.uid())
grant execute on function public.reserve_for_job(uuid, uuid, bigint, text) to authenticated;
grant execute on function public.capture_job_charge(uuid, uuid, text) to authenticated;
grant execute on function public.release_job_reservation(uuid, uuid, text) to authenticated;
