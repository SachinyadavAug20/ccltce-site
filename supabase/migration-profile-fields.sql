-- ============================================================
-- PROFILE FIELDS — run in Supabase SQL Editor
-- Adds bio + flexible social links for every member profile.
-- ============================================================

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists links jsonb not null default '[]'::jsonb;

-- links shape: [{"label":"Instagram","url":"https://instagram.com/..."}, ...]

-- RLS already allows own-row update; ensure columns are selected publicly
-- (profiles_select_all already covers SELECT * )

-- Seed bios from the static roster so tree/profile match day one
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

notify pgrst, 'reload schema';

select full_name, bio is not null as has_bio, links
from public.profiles
where role = 'coding_club_member'
order by full_name;
