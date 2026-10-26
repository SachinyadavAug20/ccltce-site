-- CCLTCE Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor > New query > paste > Run

-- ========== 1. Types ==========
create type public.user_role as enum ('student', 'coding_club_member', 'admin');

-- ========== 2. Tables ==========

-- Profiles — one row per auth.users row, auto-created by trigger below
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'student',
  roll_no text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  max_team_size int not null default 4 check (max_team_size between 1 and 10),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  team_name text not null,
  leader_id uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  unique (event_id, team_name)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_in_team text not null default 'member' check (role_in_team in ('leader', 'member')),
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  registered_at timestamptz default now(),
  unique (event_id, team_id)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz default now()
);

-- Indexes for common lookups
create index if not exists idx_teams_leader on public.teams(leader_id);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_registrations_event on public.registrations(event_id);
create index if not exists idx_registrations_team on public.registrations(team_id);
create index if not exists idx_feedback_user on public.feedback(user_id);

-- ========== 3. Helper: current user role (security definer) ==========
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ========== 4. Trigger: auto-create profile on signup ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== 5. Seed a default event so team-creation works on day one ==========
insert into public.events (title, description, max_team_size)
select 'CCLTCE General', 'Default space for forming teams before specific events are announced', 4
where not exists (select 1 from public.events where title = 'CCLTCE General');

-- ========== 6. Row Level Security ==========
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.registrations enable row level security;
alter table public.feedback enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select using (public.current_user_role() in ('admin', 'coding_club_member'));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- freeze role on self-update (admins change roles via SQL editor / service role)
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

-- events — public read, admin insert/update/delete
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events
  for select using (true);

drop policy if exists "events_insert_admin" on public.events;
create policy "events_insert_admin" on public.events
  for insert with check (public.current_user_role() = 'admin');

drop policy if exists "events_update_admin" on public.events;
create policy "events_update_admin" on public.events
  for update using (public.current_user_role() = 'admin');

drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin" on public.events
  for delete using (public.current_user_role() = 'admin');

-- teams
drop policy if exists "teams_select_related" on public.teams;
create policy "teams_select_related" on public.teams
  for select using (
    auth.uid() = leader_id
    or exists (select 1 from public.team_members tm where tm.team_id = id and tm.user_id = auth.uid())
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

drop policy if exists "teams_insert_leader" on public.teams;
create policy "teams_insert_leader" on public.teams
  for insert with check (auth.uid() = leader_id);

drop policy if exists "teams_update_leader" on public.teams;
create policy "teams_update_leader" on public.teams
  for update using (auth.uid() = leader_id);

drop policy if exists "teams_delete_leader" on public.teams;
create policy "teams_delete_leader" on public.teams
  for delete using (auth.uid() = leader_id or public.current_user_role() = 'admin');

-- team_members
drop policy if exists "team_members_select_related" on public.team_members;
create policy "team_members_select_related" on public.team_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

drop policy if exists "team_members_insert_leader" on public.team_members;
create policy "team_members_insert_leader" on public.team_members
  for insert with check (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
    or user_id = auth.uid()
  );

drop policy if exists "team_members_delete_leader" on public.team_members;
create policy "team_members_delete_leader" on public.team_members
  for delete using (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
    or user_id = auth.uid()
  );

-- registrations
drop policy if exists "registrations_select_related" on public.registrations;
create policy "registrations_select_related" on public.registrations
  for select using (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
    or exists (select 1 from public.team_members tm where tm.team_id = team_id and tm.user_id = auth.uid())
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

drop policy if exists "registrations_insert_leader" on public.registrations;
create policy "registrations_insert_leader" on public.registrations
  for insert with check (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
    and public.current_user_role() = 'student'
  );

drop policy if exists "registrations_update_staff" on public.registrations;
create policy "registrations_update_staff" on public.registrations
  for update using (public.current_user_role() in ('admin', 'coding_club_member'));

-- feedback
drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "feedback_select_staff" on public.feedback;
create policy "feedback_select_staff" on public.feedback
  for select using (public.current_user_role() in ('admin', 'coding_club_member'));

-- ========== 7. Avatar storage bucket ==========
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- users can upload/update only their own folder (id = their user id)
drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- public read for avatars
drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- ========== 8. Done ==========
-- Next steps (Supabase Dashboard):
--   1. Authentication > Providers > Email: enable (disable "Confirm email" for local testing if you want).
--   2. Authentication > URL Configuration: add Site URL + Redirect URLs for prod.
--   3. To promote a user to admin / coding_club_member:
--        update public.profiles set role = 'admin' where email = 'you@example.com';
--        update public.profiles set role = 'coding_club_member' where email = 'club@example.com';
select 'schema ok' as status;
