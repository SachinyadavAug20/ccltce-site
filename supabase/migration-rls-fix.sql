-- Fix infinite RLS recursion between public.teams <-> public.team_members
-- (error 42P17 "infinite recursion detected in policy for relation teams")
--
-- The original policies cross-referenced each other:
--   teams SELECT     -> exists (... from team_members ...)   [team_members RLS runs]
--   team_members SEL -> exists (... from teams ...)          [teams RLS runs]  => loop
-- registrations had the same cycle (teams -> team_members -> teams).
--
-- Fix: security-definer helpers that read both tables as the function owner
-- (table owner bypasses RLS), so policy evaluation never re-enters RLS.

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

-- teams
drop policy if exists "teams_select_related" on public.teams;
create policy "teams_select_related" on public.teams
  for select using (
    auth.uid() = leader_id
    or public.is_team_member(id)
    or public.current_user_role() in ('admin', 'coding_club_member')
  );

-- team_members
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

-- registrations (broke with the same teams -> team_members cycle)
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
