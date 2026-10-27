-- ============================================================
-- FUN: levels + leaderboard — run entire file in SQL Editor
-- 1) xp on profiles  2) public profile reads  3) add_xp RPC  4) welcome seed
-- ============================================================

-- 1. XP column (new accounts start at 100 via the trigger insert default)
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles alter column xp set default 100;

-- 2. Everyone may read profiles (directory + leaderboard need names/faces)
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- 3. Safe XP award RPC (clamped per call; only yourself)
create or replace function public.add_xp(amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_xp integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  amount := least(greatest(coalesce(amount, 0), 0), 100);
  update public.profiles
     set xp = least(greatest(xp + amount, 0), 100000)
   where id = auth.uid()
  returning xp into new_xp;
  return coalesce(new_xp, 0);
end;
$$;
grant execute on function public.add_xp(integer) to anon, authenticated, service_role;

-- guard: nobody can hand-edit xp to a huge number in one UPDATE
create or replace function public.clamp_xp_on_update()
returns trigger
language plpgsql
as $$
begin
  if new.xp is distinct from old.xp then
    new.xp := least(greatest(new.xp, old.xp), old.xp + 500);
  end if;
  return new;
end;
$$;
drop trigger if exists clamp_xp on public.profiles;
create trigger clamp_xp
  before update on public.profiles
  for each row execute procedure public.clamp_xp_on_update();

-- 4. Existing accounts start with a welcome bonus (idempotent-ish: only zero rows)
update public.profiles set xp = 100 where xp = 0;

notify pgrst, 'reload schema';

select
  (select count(*) from public.profiles) as members,
  (select count(*) from public.profiles where xp > 0) as with_xp;
