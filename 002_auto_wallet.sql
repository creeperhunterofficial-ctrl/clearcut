-- ClearCut Stage 2: auto-create profile + wallet on signup
-- Run this in Supabase SQL Editor (one time).

-- 1. Trigger function: runs whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance_paise)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2. Attach the trigger to new signups
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill: create missing rows for users who already signed up
insert into public.profiles (id, email, role)
select id, email, 'user'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

insert into public.wallets (user_id, balance_paise)
select id, 0
from public.profiles
where id not in (select user_id from public.wallets)
on conflict (user_id) do nothing;

-- 4. Make YOURSELF admin: replace the email with your login email, then run
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
