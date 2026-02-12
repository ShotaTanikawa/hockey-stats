-- Audit logs for operational traceability

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    actor_user_id uuid,
    team_id uuid,
    action text not null, -- insert/update/delete
    entity_type text not null, -- table name
    entity_id uuid,
    before_data jsonb,
    after_data jsonb
);

alter table public.audit_logs enable row level security;

-- Read: only active team members can read their team logs
create policy "audit_logs_read_team" on public.audit_logs
for select
using (is_active_team_member(team_id));

-- Writes are performed by SECURITY DEFINER trigger function (table owner bypasses RLS)

create or replace function public.audit_log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid;
    v_team_id uuid;
    v_entity_id uuid;
    v_action text;
    v_before jsonb;
    v_after jsonb;
begin
    v_actor := auth.uid();
    v_action := lower(TG_OP);

    if TG_OP = 'INSERT' then
        v_after := to_jsonb(NEW);
        v_entity_id := NEW.id;
        v_team_id := NEW.team_id;
    elsif TG_OP = 'UPDATE' then
        v_before := to_jsonb(OLD);
        v_after := to_jsonb(NEW);
        v_entity_id := NEW.id;
        v_team_id := NEW.team_id;
    elsif TG_OP = 'DELETE' then
        v_before := to_jsonb(OLD);
        v_entity_id := OLD.id;
        v_team_id := OLD.team_id;
    end if;

    -- Resolve team_id for tables without direct team_id
    if v_team_id is null then
        if TG_TABLE_NAME in ('player_stats', 'goalie_stats') then
            v_team_id := (
                select team_id
                from public.games
                where id = coalesce(NEW.game_id, OLD.game_id)
            );
        elsif TG_TABLE_NAME = 'team_members' then
            v_team_id := coalesce(NEW.team_id, OLD.team_id);
        end if;
    end if;

    insert into public.audit_logs (
        actor_user_id,
        team_id,
        action,
        entity_type,
        entity_id,
        before_data,
        after_data
    ) values (
        v_actor,
        v_team_id,
        v_action,
        TG_TABLE_NAME,
        v_entity_id,
        v_before,
        v_after
    );

    return coalesce(NEW, OLD);
end;
$$;

-- Attach triggers to key tables
create trigger audit_log_teams
after insert or update or delete on public.teams
for each row execute function public.audit_log_change();

create trigger audit_log_team_members
after insert or update or delete on public.team_members
for each row execute function public.audit_log_change();

create trigger audit_log_players
after insert or update or delete on public.players
for each row execute function public.audit_log_change();

create trigger audit_log_games
after insert or update or delete on public.games
for each row execute function public.audit_log_change();

create trigger audit_log_player_stats
after insert or update or delete on public.player_stats
for each row execute function public.audit_log_change();

create trigger audit_log_goalie_stats
after insert or update or delete on public.goalie_stats
for each row execute function public.audit_log_change();
