-- ============================================================
-- DEFINITIVE FIX — run this entire file in Supabase SQL Editor
-- Fixes: GRANT permission denied, RLS, pixel_art column,
--        schema cache, seeds 11 team accounts (verified + login)
-- ============================================================

-- 0. Extensions (for gen_salt / crypt)
create extension if not exists pgcrypto with schema extensions;

-- 1. pixel_art column
alter table public.profiles add column if not exists pixel_art text;

-- 2. GRANTS — without these, PostgREST returns "permission denied for table profiles"
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;

-- 3. Reset ALL profile RLS policies from scratch
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_staff" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

-- anyone can read profiles (Members directory + avatar rendering)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- user can update only their own row
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- user can insert only their own row
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- user can delete only their own row
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- 4. Keep role freeze trigger (admins change roles via SQL / service role)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role and auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- 5. Seed ALL team accounts — verified email, can log in immediately
--    email: firstname.lastname@ccltce.in   password: ccltce@2024
do $$
declare
  m record;
  uid uuid;
begin
  for m in
    select * from (values
      ('aakash.gupta@ccltce.in',        'Aakash Gupta'),
      ('nitesh.yadav@ccltce.in',        'Nitesh Yadav'),
      ('vivek.tiwari@ccltce.in',        'Vivek Tiwari'),
      ('ayush.vishwakarma@ccltce.in',   'Ayush Vishwakarma'),
      ('sachin.yadav@ccltce.in',        'Sachin Yadav'),
      ('shashank.suryawanshi@ccltce.in','Shashank Suryawanshi'),
      ('sanjana.jagtap@ccltce.in',      'Sanjana Jagtap'),
      ('samiksha.patil@ccltce.in',      'Samiksha Patil'),
      ('rashi.kasotiya@ccltce.in',      'Rashi Kasotiya'),
      ('adarsh.mishra@ccltce.in',       'Adarsh Mishra'),
      ('rushi.jadhav@ccltce.in',        'Rushi Jadhav')
    ) as t(email, full_name)
  loop
    if exists (select 1 from auth.users where email = m.email) then
      -- already exists: ensure verified + club role
      update auth.users
        set email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
          || json_build_object('full_name', m.full_name)::jsonb
        where email = m.email;
      update public.profiles
        set role = 'coding_club_member', full_name = m.full_name
        where email = m.email;
      continue;
    end if;

    uid := gen_random_uuid();

    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      m.email,
      crypt('ccltce@2024', gen_salt('bf')),
      now(),  -- verified — no email confirmation needed
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('full_name', m.full_name)::jsonb,
      now(),
      now()
    );

    insert into public.profiles (id, email, full_name, role)
    values (uid, m.email, m.full_name, 'coding_club_member')
    on conflict (id) do update set
      role = 'coding_club_member',
      full_name = excluded.full_name,
      email = excluded.email;

    insert into auth.identities (
      id, user_id, provider_id, provider,
      identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, m.email, 'email',
      json_build_object('sub', uid::text, 'email', m.email, 'full_name', m.full_name)::jsonb,
      now(), now(), now()
    ) on conflict do nothing;
  end loop;
end $$;

-- 6. Force PostgREST to reload schema cache
notify pgrst, 'reload schema';

-- 7. Verify
select
  (select count(*) from public.profiles where role = 'coding_club_member') as club_members,
  (select count(*) from auth.users where email like '%@ccltce.in')          as team_accounts,
  (select count(*) from auth.users where email like '%@ccltce.in' and email_confirmed_at is not null) as verified;
