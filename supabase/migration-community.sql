-- ============================================================
-- COMMUNITY + PROFILE FIELDS — run entire file in SQL Editor
-- 1) bio/links on profiles  2) DMs  3) pre-event team invites
-- ============================================================

-- 1. Profile fields (idempotent)
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists links jsonb not null default '[]'::jsonb;

-- Seed club bios (skip if already set)
update public.profiles p
set bio = t.bio
from (values
  ('Aakash Gupta',        'Sets the club''s direction and chairs every standup and decision.'),
  ('Nitesh Yadav',        'Co-pilots the club — strategy, partnerships and the long game.'),
  ('Vivek Tiwari',        'Keeps the exec layer honest and unblocks every domain lead.'),
  ('Sachin Yadav',        'Ships the code — site, bots, infra and everything that beeps.'),
  ('Ayush Vishwakarma',   'Runs the calendar, the minutes and the follow-ups that stick.'),
  ('Shashank Suryawanshi','Guards the treasury and makes sure every rupee has a purpose.'),
  ('Rashi Kasotiya',      'Owns the look — posters, reels, merch and the club''s visual voice.'),
  ('Samiksha Patil',      'Writes the docs, recaps and stories that outlive the event.'),
  ('Sanjana Jagtap',      'Makes the club loud in the right places — socials and outreach.'),
  ('Adarsh Mishra',       'Turns ideas into run-sheets — logistics, venues, day-of flow.'),
  ('Rushi Jadhav',        'Finds the next batch of members and makes them feel at home.')
) as t(full_name, bio)
where p.full_name = t.full_name
  and p.role = 'coding_club_member'
  and (p.bio is null or p.bio = '');

-- 2. Direct messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists idx_messages_pair on public.messages (from_id, to_id, created_at);
create index if not exists idx_messages_to on public.messages (to_id, created_at);

alter table public.messages enable row level security;
drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = from_id);
create policy "messages_update_own" on public.messages
  for update using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

-- 3. Pre-event team invites ("team up in advance")
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  note text check (char_length <= 500),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (from_id, to_id, event_id)
);
create index if not exists idx_invites_to on public.team_invites (to_id, status, created_at);
create index if not exists idx_invites_from on public.team_invites (from_id, status, created_at);

alter table public.team_invites enable row level security;
drop policy if exists "invites_select_own" on public.team_invites;
drop policy if exists "invites_insert_own" on public.team_invites;
drop policy if exists "invites_update_own" on public.team_invites;
drop policy if exists "invites_delete_own" on public.team_invites;
create policy "invites_select_own" on public.team_invites
  for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "invites_insert_own" on public.team_invites
  for insert with check (auth.uid() = from_id);
create policy "invites_update_own" on public.team_invites
  for update using (auth.uid() = to_id)
  with check (auth.uid() = to_id);
create policy "invites_delete_own" on public.team_invites
  for delete using (auth.uid() = from_id or auth.uid() = to_id);

-- 4. Grants (page visitors + logged-in users)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;

notify pgrst, 'reload schema';

select
  (select count(*) from public.profiles where bio is not null) as with_bio,
  (select count(*) from information_schema.tables where table_name = 'messages') as messages_tbl,
  (select count(*) from information_schema.tables where table_name = 'team_invites') as invites_tbl;
