-- ============================================================
-- SEED TEAM ACCOUNTS — run in Supabase SQL Editor if needed
-- NOTE: All 11 accounts already exist and were verified via the
--       Admin API (password login 11/11 OK) on 2026-10-27.
--       This script is idempotent and safe to re-run.
--
-- WHY @ltce.in NOT @ccltce.in:
--   ccltce.in has NO DNS (NXDOMAIN). GoTrue rejects emails whose
--   domain does not resolve. ltce.in resolves, so accounts work.
--
-- Email:  firstname.lastname@ltce.in
-- Pass:   ccltce@2024   (change via Forgot password or dashboard)
-- Role:   coding_club_member
-- ============================================================

do $$
declare
  m record;
  uid uuid;
  hash text := '$2a$10$dKtWM8eYUZlUimsf5XKgveip.sV.I8n2UAPcVZA4EQjvYQIlXye1K';
begin
  for m in
    select * from (values
      ('aakash.gupta@ltce.in',        'Aakash Gupta'),
      ('nitesh.yadav@ltce.in',        'Nitesh Yadav'),
      ('vivek.tiwari@ltce.in',        'Vivek Tiwari'),
      ('ayush.vishwakarma@ltce.in',   'Ayush Vishwakarma'),
      ('sachin.yadav@ltce.in',        'Sachin Yadav'),
      ('shashank.suryawanshi@ltce.in','Shashank Suryawanshi'),
      ('sanjana.jagtap@ltce.in',      'Sanjana Jagtap'),
      ('samiksha.patil@ltce.in',      'Samiksha Patil'),
      ('rashi.kasotiya@ltce.in',      'Rashi Kasotiya'),
      ('adarsh.mishra@ltce.in',       'Adarsh Mishra'),
      ('rushi.jadhav@ltce.in',        'Rushi Jadhav')
    ) as t(email, full_name)
  loop
    if exists (select 1 from auth.users where email = m.email) then
      update auth.users
        set encrypted_password = hash,
            email_confirmed_at = coalesce(email_confirmed_at, now()),
            raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
              || json_build_object('full_name', m.full_name)::jsonb,
            updated_at = now()
        where email = m.email;
    else
      uid := gen_random_uuid();
      insert into auth.users (
        id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) values (
        uid, 'authenticated', 'authenticated', m.email,
        hash, now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('full_name', m.full_name)::jsonb,
        now(), now()
      );
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        uid::text, uid,
        json_build_object(
          'sub', uid::text, 'email', m.email,
          'email_verified', true, 'phone_verified', false,
          'full_name', m.full_name
        )::jsonb,
        'email', now(), now(), now()
      ) on conflict do nothing;
    end if;

    insert into public.profiles (id, email, full_name, role)
    select u.id, m.email, m.full_name, 'coding_club_member'
    from auth.users u where u.email = m.email
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      role = 'coding_club_member';
  end loop;
end $$;

-- Remove orphan / dead-domain profiles
delete from public.profiles where email like '%@ccltce.in';
delete from auth.users where email like '%@ccltce.in';

notify pgrst, 'reload schema';

select email, role from public.profiles where role = 'coding_club_member' order by email;
