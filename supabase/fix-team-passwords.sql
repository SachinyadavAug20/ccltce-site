-- ============================================================
-- RESET TEAM PASSWORDS — run entire file in Supabase SQL Editor
-- Password for all team accounts: ccltce@2024
-- Uses a pre-computed bcrypt hash (verified) so it does not
-- depend on crypt()/pgcrypto being available in the SQL editor.
-- ============================================================

update auth.users
set encrypted_password = '$2a$10$dKtWM8eYUZlUimsf5XKgveip.sV.I8n2UAPcVZA4EQjvYQIlXye1K',
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email like '%@ccltce.in';

-- If any team user is missing entirely, recreate them
do $$
declare
  m record;
  uid uuid;
  hash text := '$2a$10$dKtWM8eYUZlUimsf5XKgveip.sV.I8n2UAPcVZA4EQjvYQIlXye1K';
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
      continue;
    end if;

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
  end loop;
end $$;

-- Ensure profiles exist with club role
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name',''), 'coding_club_member'
from auth.users u
where u.email like '%@ccltce.in'
on conflict (id) do update set
  role = 'coding_club_member',
  email = excluded.email;

notify pgrst, 'reload schema';

select email from auth.users where email like '%@ccltce.in' order by email;
