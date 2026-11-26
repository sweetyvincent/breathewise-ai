-- BreatheWise AI database schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor (or `psql`) once. Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
--
-- Security model
--   * The API (server/) uses the SERVICE ROLE key, which bypasses RLS, and enforces ownership itself.
--   * RLS below ALSO protects the tables if anyone queries them directly with the public anon key.
--   * community_reports never exposes user_id publicly: the public reads a view without it.

create extension if not exists "pgcrypto";

-- ───────────────────────── users ─────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 80),
  email       text,
  location    jsonb,                          -- { lat, lon, name }  (user-chosen default location)
  age_group   text check (age_group in ('child','teen','adult','senior')),
  occupation  text,
  preferences jsonb not null default '{}'::jsonb,   -- commute, lifestyle, voluntary sensitivities, notification + privacy prefs
  created_at  timestamptz not null default now()
);

-- Create the profile row automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── aqi_history ─────────────────────────
create table if not exists public.aqi_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  location    text not null,
  aqi         integer not null check (aqi between 0 and 500),
  pm25        numeric(7,2) not null check (pm25 >= 0),
  pm10        numeric(7,2) not null check (pm10 >= 0),
  recorded_at timestamptz not null default now()
);
create index if not exists aqi_history_user_time on public.aqi_history (user_id, recorded_at desc);

-- ───────────────────────── daily_plans ─────────────────────────
create table if not exists public.daily_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  plan_data  jsonb not null,                  -- the validated plan JSON returned to the user
  created_at timestamptz not null default now()
);
create index if not exists daily_plans_user_time on public.daily_plans (user_id, created_at desc);

-- ───────────────────────── chat_history ─────────────────────────
create table if not exists public.chat_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  message    text not null check (char_length(message) <= 1500),
  response   text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_history_user_time on public.chat_history (user_id, created_at desc);

-- ───────────────────────── impact_records ─────────────────────────
create table if not exists public.impact_records (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  transport_type      text not null check (transport_type in
                        ('walk','cycle','metro','bus','carpool','e_scooter','ev_car','avoided_trip','household_habit')),
  distance            numeric(8,2) not null default 0 check (distance >= 0),   -- total km across all trips in this record
  trip_count          integer not null default 1 check (trip_count between 1 and 50),
  estimated_co2_saved numeric(8,3) not null default 0 check (estimated_co2_saved >= 0),  -- kg, an ESTIMATE
  created_at          timestamptz not null default now()
);
create index if not exists impact_records_user_time on public.impact_records (user_id, created_at desc);

-- ───────────────────────── community_reports ─────────────────────────
create table if not exists public.community_reports (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  report_type           text not null check (report_type in
                          ('garbage_burning','construction_dust','vehicle_emissions','industrial_smoke','other')),
  description           text not null check (char_length(description) between 10 and 500),
  approximate_location  text not null check (char_length(approximate_location) between 2 and 80),  -- neighbourhood label, never a home address
  approx_lat            numeric(6,2),         -- rounded to 2 decimals (~1 km) by the API before storage
  approx_lon            numeric(6,2),
  verification_status   text not null default 'unverified' check (verification_status in ('unverified','verified','rejected')),
  created_at            timestamptz not null default now()
);
create index if not exists community_reports_time on public.community_reports (created_at desc);

-- Public projection: no user_id. Views run with owner rights on purpose, so anon can read this view but not the table.
create or replace view public.community_reports_public as
  select id, report_type, description, approximate_location, approx_lat, approx_lon, verification_status, created_at
  from public.community_reports
  where verification_status <> 'rejected';

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.users              enable row level security;
alter table public.aqi_history        enable row level security;
alter table public.daily_plans        enable row level security;
alter table public.chat_history       enable row level security;
alter table public.impact_records     enable row level security;
alter table public.community_reports  enable row level security;

drop policy if exists users_select_own on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists users_insert_own on public.users;
create policy users_select_own on public.users for select using (auth.uid() = id);
create policy users_update_own on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy users_insert_own on public.users for insert with check (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array['aqi_history','daily_plans','chat_history','impact_records'] loop
    execute format('drop policy if exists %I_owner_all on public.%I', t, t);
    execute format('create policy %I_owner_all on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

drop policy if exists reports_owner_select on public.community_reports;
drop policy if exists reports_owner_insert on public.community_reports;
create policy reports_owner_select on public.community_reports for select using (auth.uid() = user_id);
create policy reports_owner_insert on public.community_reports for insert
  with check (auth.uid() = user_id and verification_status = 'unverified');   -- users can never self-verify

grant select on public.community_reports_public to anon, authenticated;

-- Moderation (verify / reject a report) is done by an admin with the service role, e.g.:
--   update public.community_reports set verification_status = 'verified' where id = '<uuid>';
