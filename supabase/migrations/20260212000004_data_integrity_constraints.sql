-- Data integrity hardening for practical operations
-- - Normalize existing rows first so new constraints can be validated
-- - Prevent impossible values from being saved

-- Normalize games.period_minutes
update public.games
set period_minutes = 15
where period_minutes is null
   or period_minutes not in (15, 20);

alter table public.games
    drop constraint if exists games_period_minutes_mvp_chk;
alter table public.games
    add constraint games_period_minutes_mvp_chk
    check (period_minutes in (15, 20));

-- Normalize skater stats
update public.player_stats
set goals = greatest(goals, 0),
    assists = greatest(assists, 0),
    shots = greatest(shots, 0),
    blocks = greatest(blocks, 0),
    pim = greatest(pim, 0);

alter table public.player_stats
    drop constraint if exists player_stats_non_negative_chk;
alter table public.player_stats
    add constraint player_stats_non_negative_chk
    check (
        goals >= 0
        and assists >= 0
        and shots >= 0
        and blocks >= 0
        and pim >= 0
    );

-- Normalize goalie stats
update public.goalie_stats
set shots_against = greatest(shots_against, 0),
    saves = greatest(saves, 0),
    goals_against = greatest(goals_against, 0);

update public.goalie_stats
set shots_against = greatest(shots_against, saves, goals_against, saves + goals_against);

alter table public.goalie_stats
    drop constraint if exists goalie_stats_non_negative_chk;
alter table public.goalie_stats
    add constraint goalie_stats_non_negative_chk
    check (
        shots_against >= 0
        and saves >= 0
        and goals_against >= 0
    );

alter table public.goalie_stats
    drop constraint if exists goalie_stats_logical_relation_chk;
alter table public.goalie_stats
    add constraint goalie_stats_logical_relation_chk
    check (
        saves <= shots_against
        and goals_against <= shots_against
        and saves + goals_against <= shots_against
    );

-- Normalize player master rows
update public.players
set number = abs(number)
where number < 0;

update public.players
set number = 1
where number = 0;

alter table public.players
    drop constraint if exists players_number_positive_chk;
alter table public.players
    add constraint players_number_positive_chk
    check (number > 0);

alter table public.players
    drop constraint if exists players_position_valid_chk;
alter table public.players
    add constraint players_position_valid_chk
    check (position in ('F', 'D', 'G'));
