-- Migration: add pixel_art column for 16×16 pixel avatar matrix
-- Run in: Supabase Dashboard > SQL Editor

alter table public.profiles add column if not exists pixel_art text;
select 'pixel_art migration ok' as status;
