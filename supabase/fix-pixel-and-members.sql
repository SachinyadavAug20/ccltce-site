-- ============================================================
-- FIX: pixel_art column + reload schema cache
--      + public profiles for club members
--      + seed Coding Club team accounts (coding_club_member)
-- Run ALL of this in: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1. pixel_art column (ignore error if it already exists)
alter table public.profiles add column if not exists pixel_art text;

-- 2. *** THIS FIXES "Could not find the 'pixel_art' column" ***
--    Forces PostgREST to reload its schema cache immediately.
notify pgrst, 'reload schema';

-- 3. Make club-member / admin profiles publicly readable
--    (so anyone can view team profiles on the Members page)
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select using (true);

-- 4. Seed Coding Club team accounts as coding_club_member
--    Each gets a placeholder auth account. They can reset password via
--    "Forgot password?" on the login page using their email below.
--    Change any email to the real one before running if you prefer.
do $$
declare
  m record;
  uid uuid;
begin
  for m in
    select * from (values
      ('aakash.gupta@ccltce.in',   'Aakash Gupta',      'President'),
      ('nitesh.yadav@ccltce.in',   'Nitesh Yadav',      'President'),
      ('vivek.tiwari@ccltce.in',   'Vivek Tiwari',      'Vice President'),
      ('ayush.vishwakarma@ccltce.in','Ayush Vishwakarma','Secretary'),
      ('sachin.yadav@ccltce.in',   'Sachin Yadav',      'Technical Head'),
      ('shashank.suryawanshi@ccltce.in','Shashank Suryawanshi','Treasurer'),
      ('sanjana.jagtap@ccltce.in', 'Sanjana Jagtap',    'Social media and Publicity'),
      ('samiksha.patil@ccltce.in', 'Samiksha Patil',    'Documentation and Content'),
      ('rashi.kasotiya@ccltce.in', 'Rashi Kasotiya',    'Design & Creative'),
      ('adarsh.mishra@ccltce.in',  'Adarsh Mishra',     'Event Management'),
      ('rushi.jadhav@ccltce.in',   'Rushi Jadhav',      'Student Outreach')
    ) as t(email, full_name, club_role)
  loop
    -- skip if auth user already exists
    if exists (select 1 from auth.users where email = m.email) then
      -- just ensure role is coding_club_member
      update public.profiles set role = 'coding_club_member'
      where email = m.email and role <> 'admin';
      continue;
    end if;

    uid := gen_random_uuid();

    -- create auth user (password = ccltce@2024 — they should reset it)
    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      m.email,
      crypt('ccltce@2024', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('full_name', m.full_name)::text,
      now(), now()
    );

    -- create profile (trigger may also do this; upsert to be safe)
    insert into public.profiles (id, email, full_name, role)
    values (uid, m.email, m.full_name, 'coding_club_member')
    on conflict (id) do update set role = 'coding_club_member';

    -- also add identity row (Supabase newer versions)
    insert into auth.identities (
      id, user_id, provider_id, provider,
      identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, m.email, 'email',
      json_build_object('sub', uid::text, 'email', m.email, 'full_name', m.full_name)::text,
      now(), now(), now()
    ) on conflict do nothing;
  end loop;
end $$;

-- 5. Reload schema cache again after all changes
notify pgrst, 'reload schema';

select 'all fixes applied — pixel_art + public profiles + team accounts seeded' as status;
