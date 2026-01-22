import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../../database.types";
import type {
    GameRow,
    GoalieStatRow,
    GoalieStatWithPlayer,
    Goalie,
    Skater,
    SkaterStatRow,
    SkaterStatWithPlayer,
} from "@/lib/types/stats";

type TeamRow = Tables<"teams">;

// チーム所属情報とチーム詳細をまとめて扱うための型
type MemberWithTeam = {
    role: "staff" | "viewer";
    team: TeamRow | null;
} | null;

// ログインユーザーのチーム所属情報とチーム詳細を取得する
export async function getMemberWithTeam(
    supabase: SupabaseClient<Database>,
    userId: string
) {
    const memberResult = await supabase
        .from("team_members")
        .select("role, team_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

    // 一時デバッグ: team_membersの取得結果を確認
    console.log("[debug] team_members", {
        userId,
        data: memberResult.data,
        error: memberResult.error,
    });

    if (!memberResult.data?.team_id) {
        return { data: null as MemberWithTeam };
    }

    const teamResult = await supabase
        .from("teams")
        .select("id, name, season_label")
        .eq("id", memberResult.data.team_id)
        .maybeSingle();

    // 一時デバッグ: teamsの取得結果を確認
    console.log("[debug] teams", {
        teamId: memberResult.data.team_id,
        data: teamResult.data,
        error: teamResult.error,
    });

    return {
        data: {
            role: memberResult.data.role as "staff" | "viewer",
            team: teamResult.data ?? null,
        },
    };
}

// チームに紐づく試合一覧を取得する（未指定時は全件）
export async function getGamesByTeam(
    supabase: SupabaseClient<Database>,
    teamId?: string | null
) {
    let query = supabase
        .from("games")
        .select("id, game_date, opponent, venue, period_minutes, has_overtime")
        .order("game_date", { ascending: false });

    if (teamId) {
        query = query.eq("team_id", teamId);
    }

    return query.then((result) => result as { data: GameRow[] | null });
}

// シーズンに紐づく試合ID一覧を取得する
export async function getGamesBySeason(
    supabase: SupabaseClient<Database>,
    teamId: string | null,
    seasonLabel: string
) {
    if (!teamId) {
        return { data: [] as Array<{ id: string }> };
    }

    return supabase
        .from("games")
        .select("id")
        .eq("team_id", teamId)
        .eq("season", seasonLabel)
        .then((result) => result as { data: Array<{ id: string }> | null });
}

// チームに紐づくシーズン一覧を取得する（games.season から抽出）
export async function getSeasonLabelsByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null
) {
    // games.season をユニーク化して一覧化する
    // セレクトの候補が無い場合でも空配列を返す
    if (!teamId) {
        return { data: [] as string[] };
    }

    const { data } = await supabase
        .from("games")
        .select("season")
        .eq("team_id", teamId)
        .order("season", { ascending: false });

    const seasonLabels = (data ?? [])
        .map((row) => row.season)
        .filter((season): season is string => Boolean(season));

    const unique = Array.from(new Set(seasonLabels));
    return { data: unique };
}

// チーム所属の選手一覧を取得する
export async function getPlayersByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null
) {
    if (!teamId) {
        return {
            data: [] as Array<{
                id: string;
                name: string;
                number: number;
                position: string;
                is_active: boolean;
            }>,
        };
    }

    return supabase
        .from("players")
        .select("id, name, number, position, is_active")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("number", { ascending: true });
}

// チーム所属のスケーター一覧を取得する（G以外）
export async function getSkatersByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null
) {
    if (!teamId) {
        return { data: [] as Skater[] | null };
    }

    return supabase
        .from("players")
        .select("id, name, number, position")
        .eq("team_id", teamId)
        .neq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true })
        .then((result) => result as { data: Skater[] | null });
}

// チーム所属のゴーリー一覧を取得する（Gのみ）
export async function getGoaliesByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null
) {
    if (!teamId) {
        return { data: [] as Goalie[] | null };
    }

    return supabase
        .from("players")
        .select("id, name, number")
        .eq("team_id", teamId)
        .eq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true })
        .then((result) => result as { data: Goalie[] | null });
}

// 試合IDから試合詳細を取得する
export async function getGameById(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("games")
        .select("id, team_id, game_date, opponent, venue, period_minutes, has_overtime")
        .eq("id", gameId)
        .maybeSingle()
        .then((result) => result as { data: GameRow & { team_id: string } | null });
}

// 試合IDからスケーター成績を取得する
export async function getSkaterStatsByGameId(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("player_stats")
        .select("player_id, goals, assists, shots, blocks, pim")
        .eq("game_id", gameId)
        .then((result) => result as { data: SkaterStatRow[] | null });
}

// 試合IDからゴーリー成績を取得する
export async function getGoalieStatsByGameId(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("goalie_stats")
        .select("player_id, shots_against, saves, goals_against")
        .eq("game_id", gameId)
        .then((result) => result as { data: GoalieStatRow[] | null });
}

// 試合IDからスケーター成績 + 選手情報を取得する
export async function getSkaterStatsWithPlayersByGameId(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("player_stats")
        .select(
            "player_id, goals, assists, shots, blocks, pim, players (name, number, position)"
        )
        .eq("game_id", gameId)
        .then((result) => result as { data: SkaterStatWithPlayer[] | null });
}

// 試合IDからゴーリー成績 + 選手情報を取得する
export async function getGoalieStatsWithPlayersByGameId(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("goalie_stats")
        .select(
            "player_id, shots_against, saves, goals_against, players (name, number)"
        )
        .eq("game_id", gameId)
        .then((result) => result as { data: GoalieStatWithPlayer[] | null });
}

// 複数試合IDからスケーター成績を取得する
export async function getSkaterStatsByGameIds(
    supabase: SupabaseClient<Database>,
    gameIds: string[]
) {
    if (gameIds.length === 0) {
        return { data: [] as SkaterStatRow[] };
    }

    return supabase
        .from("player_stats")
        .select("player_id, game_id, goals, assists, shots, blocks, pim")
        .in("game_id", gameIds)
        .then((result) => result as { data: SkaterStatRow[] | null });
}

// 複数試合IDからゴーリー成績を取得する
export async function getGoalieStatsByGameIds(
    supabase: SupabaseClient<Database>,
    gameIds: string[]
) {
    if (gameIds.length === 0) {
        return { data: [] as GoalieStatRow[] };
    }

    return supabase
        .from("goalie_stats")
        .select("player_id, game_id, shots_against, saves, goals_against")
        .in("game_id", gameIds)
        .then((result) => result as { data: GoalieStatRow[] | null });
}

// チーム内でのユーザー権限を取得する
export async function getMemberRoleByTeam(
    supabase: SupabaseClient<Database>,
    userId: string,
    teamId: string
) {
    return supabase
        .from("team_members")
        .select("role")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .eq("is_active", true)
        .maybeSingle()
        .then((result) => result as { data: { role: "staff" | "viewer" } | null });
}
