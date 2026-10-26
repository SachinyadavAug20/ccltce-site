-- ============================================================
-- CLEAN FIX — run this entire file in Supabase SQL Editor
-- Fixes: pixel_art column, schema cache, RLS, team accounts
-- ============================================================

-- 1. pixel_art column
alter table public.profiles add column if not exists pixel_art text;

-- 2. Fix ALL profile RLS policies from scratch (the old ones got mangled)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_staff" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

-- anyone can read profiles (needed for Members directory)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- user can update only their own row
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- user can insert only their own row (usually handled by trigger, but safe)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- 3. Seed team accounts (cast jsonb correctly!)
do $$
declare
  m record;
  uid uuid;
begin
  for m in
    select * from (values
      ('aakash.gupta@ccltce.in',      'Aakash Gupta'),
      ('nitesh.yadav@ccltce.in',      'Nitesh Yadav'),
      ('vivek.tiwari@ccltce.in',      'Vivek Tiwari'),
      ('ayush.vishwakarma@ccltce.in', 'Ayush Vishwakarma'),
      ('sachin.yadav@ccltce.in',      'Sachin Yadav'),
      ('shashank.suryawanshi@ccltce.in','Shashank Suryawanshi'),
      ('sanjana.jagtap@ccltce.in',    'Sanjana Jagtap'),
      ('samiksha.patil@ccltce.in',    'Samiksha Patil'),
      ('rashi.kasotiya@ccltce.in',    'Rashi Kasotiya'),
      ('adarsh.mishra@ccltce.in',     'Adarsh Mishra'),
      ('rushi.jadhav@ccltce.in',      'Rushi Jadhav')
    ) as t(email, full_name)
  loop
    if exists (select 1 from auth.users where email = m.email) then
      update public.profiles set role = 'coding_club_member' where email = m.email;
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
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('full_name', m.full_name)::jsonb,
      now(),
      now()
    );

    insert into public.profiles (id, email, full_name, role)
    values (uid, m.email, m.full_name, 'coding_club_member')
    on conflict (id) do update set role = 'coding_club_member';

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

-- 4. Force PostgREST to reload schema cache (fixes "column not found in schema cache")
notify pgrst, 'reload schema';

select 'DONE — pixel_art added, RLS fixed, team accounts seeded' as status;
