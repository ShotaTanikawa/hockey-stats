-- Fix audit trigger to avoid referencing non-existent columns on some tables.

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
    v_row jsonb;
    v_team_text text;
    v_entity_text text;
    v_game_text text;
begin
    v_actor := auth.uid();
    v_action := lower(TG_OP);

    if TG_OP = 'INSERT' then
        v_after := to_jsonb(NEW);
        v_row := v_after;
    elsif TG_OP = 'UPDATE' then
        v_before := to_jsonb(OLD);
        v_after := to_jsonb(NEW);
        v_row := v_after;
    else
        v_before := to_jsonb(OLD);
        v_row := v_before;
    end if;

    -- Read fields via JSON so tables without team_id do not crash.
    v_entity_text := v_row ->> 'id';
    if v_entity_text is not null and v_entity_text <> '' then
        v_entity_id := v_entity_text::uuid;
    end if;

    v_team_text := v_row ->> 'team_id';
    if v_team_text is not null and v_team_text <> '' then
        v_team_id := v_team_text::uuid;
    end if;

    if v_team_id is null and TG_TABLE_NAME in ('player_stats', 'goalie_stats') then
        v_game_text := v_row ->> 'game_id';
        if v_game_text is not null and v_game_text <> '' then
            select team_id
            into v_team_id
            from public.games
            where id = v_game_text::uuid;
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
