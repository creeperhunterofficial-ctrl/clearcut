-- ClearCut initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)
-- All money is stored as INTEGER paise. Never store rupees as float.

-- ----------------------------------------------------------------
-- Profiles (extends auth.users)
-- ----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Wallets: one row per user, balance in paise (never negative)
-- ----------------------------------------------------------------
create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance_paise bigint not null default 0 check (balance_paise >= 0),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Wallet ledger: every credit/debit is an immutable row.
-- amount_paise > 0 = credit, < 0 = debit.
-- idempotency_key prevents duplicate credits/charges.
-- ----------------------------------------------------------------
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('topup', 'reserve', 'capture', 'release', 'refund', 'adjust')),
  amount_paise bigint not null check (amount_paise <> 0),
  balance_after_paise bigint not null check (balance_after_paise >= 0),
  reference_type text check (reference_type in ('payment', 'job')),
  reference_id uuid,
  idempotency_key text not null unique,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index wallet_txn_user_idx on public.wallet_transactions(user_id, created_at desc);

-- ----------------------------------------------------------------
-- Payments: server-created orders, verified via provider callbacks.
-- Never trust screenshots or frontend success messages.
-- ----------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('paytm', 'phonepe')),
  provider_order_id text not null unique,
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'expired')),
  verified_at timestamptz,
  raw_callback jsonb,
  created_at timestamptz not null default now()
);
create index payments_user_idx on public.payments(user_id, created_at desc);

-- ----------------------------------------------------------------
-- Video jobs: queued -> uploading -> processing -> completed | failed
-- Reserve wallet amount atomically at job start; capture on success,
-- release/refund on failure. Never charge twice (idempotency).
-- ----------------------------------------------------------------
create table public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'uploading', 'processing', 'completed', 'failed')),
  input_path text,
  output_path text,
  duration_sec integer check (duration_sec > 0),
  price_paise integer not null check (price_paise >= 0),
  reserve_txn_id uuid references public.wallet_transactions(id),
  idempotency_key text not null unique,
  attempts integer not null default 0,
  error_log text,
  download_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index video_jobs_user_idx on public.video_jobs(user_id, created_at desc);
create index video_jobs_status_idx on public.video_jobs(status, created_at);

-- ----------------------------------------------------------------
-- App settings: prices and limits, editable from the admin dashboard.
-- ----------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('price_30s_paise', '700'),
  ('price_60s_paise', '1200'),
  ('min_topup_paise', '1000'),
  ('max_video_seconds', '60'),
  ('max_upload_mb', '100'),
  ('download_expiry_hours', '24'),
  ('retention_days', '7'),
  ('processing_enabled', 'false');

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payments enable row level security;
alter table public.video_jobs enable row level security;
alter table public.app_settings enable row level security;

-- Helper: is the current user an admin? (server-verified role)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles: users read their own row; admins read all.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Wallets: users read their own wallet. Writes are server-side only
-- (service role bypasses RLS).
create policy "wallets_select_own"
  on public.wallets for select
  using (auth.uid() = user_id);

-- Ledger: users read their own transactions (immutable, no updates/deletes).
create policy "wallet_txn_select_own"
  on public.wallet_transactions for select
  using (auth.uid() = user_id);

-- Payments: users read their own payments.
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

-- Jobs: users read their own jobs; users may insert their own queued jobs.
create policy "video_jobs_select_own"
  on public.video_jobs for select
  using (auth.uid() = user_id);

create policy "video_jobs_insert_own"
  on public.video_jobs for insert
  with check (auth.uid() = user_id and status = 'queued');

-- Settings: readable by authenticated users (prices/limits shown in UI);
-- writable only via service role (admin dashboard uses server API).
create policy "app_settings_select_auth"
  on public.app_settings for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------
-- Storage buckets (create via dashboard or API; policies below assume
-- bucket names 'uploads' and 'outputs')
-- ----------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values
--   ('uploads', 'uploads', false),
--   ('outputs', 'outputs', false);
--
-- create policy "uploads_insert_own" on storage.objects for insert
--   with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "uploads_select_own" on storage.objects for select
--   using (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "outputs_select_own" on storage.objects for select
--   using (bucket_id = 'outputs' and auth.uid()::text = (storage.foldername(name))[1]);
-- (Service role manages writes/deletes for outputs.)
