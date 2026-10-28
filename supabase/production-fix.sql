-- ============================================================
-- PRODUCTION FIX SCRIPT FOR SUPABASE
-- Run this in: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1. FIX INFINITE RLS RECURSION (Teams, Team Members, Registrations)
-- Resolves error: 42P17 "infinite recursion detected in policy for relation teams"

create or replace function public.is_team_leader(team_uuid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teams t
    where t.id = team_uuid and t.leader_id = auth.uid()
  );
$$;

create or replace function public.is_team_member(team_uuid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.team_id = team_uuid and tm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_team_leader(uuid), public.is_team_member(uuid) from public;
grant execute on function public.is_team_leader(uuid), public.is_team_member(uuid) to authenticated, anon;

-- teams policies
drop policy if exists "teams_select_related" on public.teams;
create policy "teams_select_related" on public.teams
  for select using (
    auth.uid() = leader_id
    or public.is_team_member(id)
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

-- team_members policies
drop policy if exists "team_members_select_related" on public.team_members;
create policy "team_members_select_related" on public.team_members
  for select using (
    user_id = auth.uid()
    or public.is_team_leader(team_id)
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

drop policy if exists "team_members_insert_leader" on public.team_members;
create policy "team_members_insert_leader" on public.team_members
  for insert with check (
    public.is_team_leader(team_id)
    or user_id = auth.uid()
  );

drop policy if exists "team_members_delete_leader" on public.team_members;
create policy "team_members_delete_leader" on public.team_members
  for delete using (
    public.is_team_leader(team_id)
    or user_id = auth.uid()
  );

-- registrations policies
drop policy if exists "registrations_select_related" on public.registrations;
create policy "registrations_select_related" on public.registrations
  for select using (
    public.is_team_leader(team_id)
    or public.is_team_member(team_id)
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

drop policy if exists "registrations_insert_leader" on public.registrations;
create policy "registrations_insert_leader" on public.registrations
  for insert with check (
    public.is_team_leader(team_id)
    and public.current_user_role() = 'student'
  );


-- 2. CREATE PUBLIC AVATARS STORAGE BUCKET & POLICIES
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

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

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');


-- 3. ENABLE REALTIME ON MESSAGES TABLE
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception when undefined_object then
  null;
end $$;


-- 4. RELOAD SCHEMA CACHE
notify pgrst, 'reload schema';

-- Verification output
select 'PRODUCTION SETUP COMPLETED SUCCESSFULLY!' as status;
