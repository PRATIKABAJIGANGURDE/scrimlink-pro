
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to allow clean re-run
drop table if exists public.match_player_stats cascade;
drop table if exists public.match_team_stats cascade;
drop table if exists public.matches cascade;
drop table if exists public.scrim_teams cascade;
drop table if exists public.scrims cascade;
drop table if exists public.join_requests cascade;
drop table if exists public.players cascade;
drop table if exists public.teams cascade;

-- Teams Table (Linked to Auth User)
create table public.teams (
  id uuid references auth.users(id) primary key,
  name text not null,
  email text not null unique,
  join_code text not null unique,
  country text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Players Table (Linked to Auth User)
create table public.players (
  id uuid references auth.users(id) primary key,
  username text not null,
  email text not null unique,
  team_id uuid references public.teams(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Join Requests
create table public.join_requests (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.players(id) not null,
  team_id uuid references public.teams(id) not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scrims Table
create table public.scrims (
  id uuid default uuid_generate_v4() primary key,
  host_team_id uuid references public.teams(id) not null,
  name text not null,
  match_count int not null,
  start_time timestamp with time zone,
  status text default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scrim Teams (Teams participating in a scrim)
create table public.scrim_teams (
  id uuid default uuid_generate_v4() primary key,
  scrim_id uuid references public.scrims(id) not null,
  team_id uuid references public.teams(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(scrim_id, team_id)
);

-- Matches Table
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  scrim_id uuid references public.scrims(id) not null,
  match_number int not null,
  map_name text,
  status text default 'pending' check (status in ('pending', 'ongoing', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Match Results / Stats (Per Team)
create table public.match_team_stats (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) not null,
  team_id uuid references public.teams(id) not null,
  placement int,
  kill_points int default 0,
  placement_points int default 0,
  total_points int default 0,
  is_booyah boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(match_id, team_id)
);

-- Match Player Stats (Per Player)
create table public.match_player_stats (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) not null,
  player_id uuid references public.players(id) not null,
  team_id uuid references public.teams(id) not null,
  kills int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(match_id, player_id)
);

-- Admins Table
create table public.admins (
  id uuid references auth.users(id) primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scrim Players (Roster selected by IGL for a scrim)
create table public.scrim_players (
  id uuid default uuid_generate_v4() primary key,
  scrim_id uuid references public.scrims(id) not null,
  team_id uuid references public.teams(id) not null,
  player_id uuid references public.players(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(scrim_id, player_id)
);

-- RLS Policies
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.join_requests enable row level security;
alter table public.scrims enable row level security;
alter table public.scrim_teams enable row level security;
alter table public.scrim_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_team_stats enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.admins enable row level security;

-- Admins Policies
-- Admins Policies
create policy "Public read access for admins" on public.admins for select using (true);
create policy "Allow public insert to admins" on public.admins for insert with check (true);

-- Teams Policies
create policy "Public read access for teams" on public.teams for select using (true);
create policy "Teams can update own profile" on public.teams for update using (auth.uid() = id);
create policy "Teams can insert own profile" on public.teams for insert with check (auth.uid() = id);

-- Players Policies
create policy "Public read access for players" on public.players for select using (true);
create policy "Players can update own profile" on public.players for update using (auth.uid() = id);
create policy "Players can insert own profile" on public.players for insert with check (auth.uid() = id);
create policy "Teams can update their players" on public.players for update using (auth.uid() = team_id);

-- Join Requests Policies
create policy "Public read access for join_requests" on public.join_requests for select using (true);
create policy "Players can create join requests" on public.join_requests for insert with check (auth.uid() = player_id);
create policy "Teams can update join requests for their team" on public.join_requests for update using (
  exists (select 1 from public.teams where id = auth.uid() and id = join_requests.team_id)
);

-- Scrims Policies
create policy "Public read access for scrims" on public.scrims for select using (true);
create policy "Admins can create scrims" on public.scrims for insert with check (
  exists (select 1 from public.admins where id = auth.uid())
);
create policy "Admins can update scrims" on public.scrims for update using (
  exists (select 1 from public.admins where id = auth.uid())
);

-- Scrim Teams Policies
create policy "Public read access for scrim_teams" on public.scrim_teams for select using (true);
create policy "Teams can join scrims" on public.scrim_teams for insert with check (auth.uid() = team_id);
create policy "Admins can manage scrim_teams" on public.scrim_teams for all using (
  exists (select 1 from public.admins where id = auth.uid())
);

-- Scrim Players Policies
create policy "Public read access for scrim_players" on public.scrim_players for select using (true);
create policy "Teams can add players to scrims" on public.scrim_players for insert with check (auth.uid() = team_id);
create policy "Teams can remove players from scrims" on public.scrim_players for delete using (auth.uid() = team_id);
create policy "Admins can manage scrim_players" on public.scrim_players for all using (
  exists (select 1 from public.admins where id = auth.uid())
);

-- Matches Policies
create policy "Public read access for matches" on public.matches for select using (true);
create policy "Admins can manage matches" on public.matches for all using (
  exists (select 1 from public.admins where id = auth.uid())
);

-- Stats Policies
create policy "Public read access for stats" on public.match_team_stats for select using (true);
create policy "Admins can manage team stats" on public.match_team_stats for all using (
  exists (select 1 from public.admins where id = auth.uid())
);

create policy "Public read access for player stats" on public.match_player_stats for select using (true);
create policy "Admins can manage player stats" on public.match_player_stats for all using (
  exists (select 1 from public.admins where id = auth.uid())
);
