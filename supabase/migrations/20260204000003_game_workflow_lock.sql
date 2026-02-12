-- Game workflow state and stat lock rules

alter table public.games
add column if not exists workflow_status text not null default 'draft';

alter table public.games
drop constraint if exists games_workflow_status_check;

alter table public.games
add constraint games_workflow_status_check
check (workflow_status in ('draft', 'in_progress', 'finalized'));

-- Backfill existing games based on whether any stats already exist.
update public.games g
set workflow_status = case
    when exists (select 1 from public.player_stats ps where ps.game_id = g.id)
      or exists (select 1 from public.goalie_stats gs where gs.game_id = g.id)
    then 'in_progress'
    else 'draft'
end
where g.workflow_status is null or g.workflow_status not in ('draft', 'in_progress', 'finalized');

-- Lock stats when a game is finalized.
drop policy if exists "player_stats_insert_staff" on public.player_stats;
drop policy if exists "player_stats_update_staff" on public.player_stats;
drop policy if exists "player_stats_delete_staff" on public.player_stats;

drop policy if exists "goalie_stats_insert_staff" on public.goalie_stats;
drop policy if exists "goalie_stats_update_staff" on public.goalie_stats;
drop policy if exists "goalie_stats_delete_staff" on public.goalie_stats;

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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
              and public.is_active_team_staff(g.team_id)
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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
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
              and g.workflow_status <> 'finalized'
              and public.is_active_team_staff(g.team_id)
        )
    );
