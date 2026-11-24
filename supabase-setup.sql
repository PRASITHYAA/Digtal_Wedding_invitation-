-- =====================================================================
-- Timeline database for an ONLINE site (Netlify / GitHub Pages / Vercel)
-- Supabase dashboard > SQL Editor > New query > paste ALL of this > Run
-- Admin password is on the line marked  <<< PASSWORD  (appears 3 times)
-- =====================================================================

create table if not exists public.moments (
  seq        bigint generated always as identity,
  id         text primary key default gen_random_uuid()::text,
  date       text not null default '',          -- 'YYYY-MM-DD' or empty (no date)
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.moments enable row level security;
drop policy if exists "anyone can read" on public.moments;
create policy "anyone can read" on public.moments for select to anon, authenticated using (true);
-- No insert/update/delete policy: visitors can NOT change data directly.
-- Only the three functions below can, and only with the correct admin password.

create or replace function public.add_moment(k text, i text, d text, t text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if k is distinct from 'Dhanu@5130' then raise exception 'WRONG_KEY' using errcode = '28000'; end if;   -- <<< PASSWORD
  if coalesce(trim(t), '') = '' then raise exception 'Text is required'; end if;
  if coalesce(d, '') <> '' and d !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Date must be YYYY-MM-DD'; end if;
  insert into public.moments(date, text) values (coalesce(d, ''), left(trim(t), 500));
end $$;

create or replace function public.update_moment(k text, i text, d text, t text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if k is distinct from 'Dhanu@5130' then raise exception 'WRONG_KEY' using errcode = '28000'; end if;   -- <<< PASSWORD
  if coalesce(trim(t), '') = '' then raise exception 'Text is required'; end if;
  if coalesce(d, '') <> '' and d !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Date must be YYYY-MM-DD'; end if;
  update public.moments set date = coalesce(d, ''), text = left(trim(t), 500) where id = i;
  if not found then raise exception 'Not found'; end if;
end $$;

create or replace function public.delete_moment(k text, i text, d text, t text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if k is distinct from 'Dhanu@5130' then raise exception 'WRONG_KEY' using errcode = '28000'; end if;   -- <<< PASSWORD
  delete from public.moments where id = i;
end $$;

-- Used by the admin page lock screen: returns true only for the correct password
create or replace function public.check_key(k text)
returns boolean language sql security definer set search_path = public as $$
  select k is not distinct from 'Dhanu@5130';   -- <<< PASSWORD
$$;
grant execute on function public.check_key(text) to anon, authenticated;

grant execute on function public.add_moment(text, text, text, text)    to anon, authenticated;
grant execute on function public.update_moment(text, text, text, text) to anon, authenticated;
grant execute on function public.delete_moment(text, text, text, text) to anon, authenticated;

-- Your 15 moments (only inserted when the table is empty)
insert into public.moments(date, text)
select * from (values
  ('', 'Gym meeting'),
  ('', 'Our first bike ride'),
  ('', 'Our first movie date'),
  ('', 'The first time I came to Santhosh’s house ❤️'),
  ('2025-11-11', 'Our first phone call'),
  ('2025-11-17', 'Our first meeting at the temple'),
  ('2026-03-14', 'Ooty trip'),
  ('2026-07-03', 'Chennai trip'),
  ('2026-08-10', 'Our first kiss on the long bike ride'),
  ('2026-08-14', 'Car kiss'),
  ('2026-08-30', 'The first time Prasithya bought a wish for me ❤️'),
  ('2026-09-12', 'Our first honeymoon in Vallapi ❤️'),
  ('2026-09-28', 'Our first night of separation after marriage — I was in Tiruppur, missing you'),
  ('2026-10-16', 'Took Ammachi to the hospital, spent the night apart, and sent each other “Miss you” messages ❤️'),
  ('2026-10-26', 'The day Santhosh stood up for me during a fight with my mother')
) as v(date, text)
where not exists (select 1 from public.moments);
