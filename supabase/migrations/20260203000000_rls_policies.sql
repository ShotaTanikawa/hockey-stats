-- RLS policies for Hockey Stats (MVP)
-- - Enforce team-based access
-- - Staff can CRUD, viewer can read
-- - Service role bypasses RLS for privileged operations

-- Helper functions for RLS checks
create or replace function public.is_active_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.team_members tm
        where tm.team_id = target_team_id
          and tm.user_id = auth.uid()
          and tm.is_active = true
    );
$$;

create or replace function public.is_active_team_staff(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.team_members tm
        where tm.team_id = target_team_id
          and tm.user_id = auth.uid()
          and tm.is_active = true
          and tm.role = 'staff'
    );
$$;

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.player_stats enable row level security;
alter table public.goalie_stats enable row level security;

-- Drop existing policies on target tables to avoid permissive leftovers
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'teams',
              'team_members',
              'players',
              'games',
              'player_stats',
              'goalie_stats'
          )
    LOOP
        EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- teams: members can read, staff can update/delete
create policy "teams_select_member"
    on public.teams
    for select
    using (public.is_active_team_member(id));

create policy "teams_update_staff"
    on public.teams
    for update
    using (public.is_active_team_staff(id))
    with check (public.is_active_team_staff(id));

create policy "teams_delete_staff"
    on public.teams
    for delete
    using (public.is_active_team_staff(id));

-- team_members: self or staff can read active members only
create policy "team_members_select_self_or_staff"
    on public.team_members
    for select
    using (
        (user_id = auth.uid() and is_active = true)
        or public.is_active_team_staff(team_id)
    );

-- players: members can read, staff can CRUD
create policy "players_select_member"
    on public.players
    for select
    using (public.is_active_team_member(team_id));

create policy "players_insert_staff"
    on public.players
    for insert
    with check (public.is_active_team_staff(team_id));

create policy "players_update_staff"
    on public.players
    for update
    using (public.is_active_team_staff(team_id))
    with check (public.is_active_team_staff(team_id));

create policy "players_delete_staff"
    on public.players
    for delete
    using (public.is_active_team_staff(team_id));

-- games: members can read, staff can CRUD
create policy "games_select_member"
    on public.games
    for select
    using (public.is_active_team_member(team_id));

create policy "games_insert_staff"
    on public.games
    for insert
    with check (public.is_active_team_staff(team_id));

create policy "games_update_staff"
    on public.games
    for update
    using (public.is_active_team_staff(team_id))
    with check (public.is_active_team_staff(team_id));

create policy "games_delete_staff"
    on public.games
    for delete
    using (public.is_active_team_staff(team_id));

-- player_stats: members can read via game.team_id, staff can CRUD if player belongs to same team
create policy "player_stats_select_member"
    on public.player_stats
    for select
    using (
        exists (
            select 1
            from public.games g
            where g.id = player_stats.game_id
              and public.is_active_team_member(g.team_id)
        )
    );

create policy "player_stats_insert_staff"
    on public.player_stats
    for insert
    with check (
        exists (
            select 1
            from public.games g
            join public.players p on p.id = player_stats.player_id
            where g.id = player_stats.game_id
              and p.team_id = g.team_id
              and public.is_active_team_staff(g.team_id)
        )
    );

create policy "player_stats_update_staff"
    on public.player_stats
    for update
    using (
        exists (
            select 1
            from public.games g
            where g.id = player_stats.game_id
              and public.is_active_team_staff(g.team_id)
        )
    )
    with check (
        exists (
            select 1
            from public.games g
            join public.players p on p.id = player_stats.player_id
            where g.id = player_stats.game_id
              and p.team_id = g.team_id
              and public.is_active_team_staff(g.team_id)
        )
    );

create policy "player_stats_delete_staff"
    on public.player_stats
    for delete
    using (
        exists (
            select 1
            from public.games g
            where g.id = player_stats.game_id
              and public.is_active_team_staff(g.team_id)
        )
    );

-- goalie_stats: members can read via game.team_id, staff can CRUD if player belongs to same team
create policy "goalie_stats_select_member"
    on public.goalie_stats
    for select
    using (
        exists (
            select 1
            from public.games g
            where g.id = goalie_stats.game_id
              and public.is_active_team_member(g.team_id)
        )
    );

create policy "goalie_stats_insert_staff"
    on public.goalie_stats
    for insert
    with check (
        exists (
            select 1
            from public.games g
            join public.players p on p.id = goalie_stats.player_id
            where g.id = goalie_stats.game_id
              and p.team_id = g.team_id
              and public.is_active_team_staff(g.team_id)
        )
    );

create policy "goalie_stats_update_staff"
    on public.goalie_stats
    for update
    using (
        exists (
            select 1
            from public.games g
            where g.id = goalie_stats.game_id
              and public.is_active_team_staff(g.team_id)
        )
    )
    with check (
        exists (
            select 1
            from public.games g
            join public.players p on p.id = goalie_stats.player_id
            where g.id = goalie_stats.game_id
              and p.team_id = g.team_id
              and public.is_active_team_staff(g.team_id)
        )
    );

create policy "goalie_stats_delete_staff"
    on public.goalie_stats
    for delete
    using (
        exists (
            select 1
            from public.games g
            where g.id = goalie_stats.game_id
              and public.is_active_team_staff(g.team_id)
        )
    );
