-- ============================================================
-- FIX TEAM LOGINS — run entire file in Supabase SQL Editor
-- Symptom: login sachin.yadav@ccltce.in → 500 "Database error
--          querying schema" (all %40ccltce.in accounts)
-- Cause:   hand-inserted auth.users/identities don't match what
--          GoTrue expects (instance_id, provider_id, metadata)
-- Fix:     delete broken users, reinsert in GoTrue-compatible shape
-- ============================================================

-- 1. Tear down broken team users (cascade removes profiles + identities)
delete from auth.users where email like '%@ccltce.in';

-- 2. Recreate in the shape GoTrue itself writes
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
    uid := gen_random_uuid();

    -- auth.users — only columns Supabase Auth reliably supports
    insert into auth.users (
      id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      uid,
      'authenticated',
      'authenticated',
      lower(m.email),
      extensions.crypt('ccltce@2024', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object('full_name', m.full_name)::jsonb,
      now(),
      now()
    );

    -- auth.identities — provider_id MUST be the user id (not the email)
    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      uid::text,
      uid,
      json_build_object(
        'sub', uid::text,
        'email', lower(m.email),
        'email_verified', true,
        'phone_verified', false,
        'full_name', m.full_name
      )::jsonb,
      'email',
      now(), now(), now()
    )
    on conflict (provider_id, provider) do nothing;
  end loop;
end $$;

-- 3. Profiles (trigger may already have created them; force club role)
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name',''), 'coding_club_member'
from auth.users u
where u.email like '%@ccltce.in'
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name,''), public.profiles.full_name),
  role = 'coding_club_member';

-- 4. Reload PostgREST schema cache
notify pgrst, 'reload schema';

-- 5. Verify
select email, email_confirmed_at is not null as verified
from auth.users where email like '%@ccltce.in' order by email;
