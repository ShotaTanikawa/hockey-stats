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

// SupabaseのDBアクセスを集約して、RLS前提の読み書きを統一する
// - 画面側はこの関数群だけを使い、クエリの書き方を分散させない
type TeamRow = Tables<"teams">;
type OperationalGameAlert = {
    id: string;
    game_date: string;
    opponent: string;
    workflow_status: "draft" | "in_progress" | "finalized";
};

type GoalieMismatchRow = {
    game_id: string;
    shots_against: number;
    saves: number;
    goals_against: number;
    games: {
        id: string;
        game_date: string;
        opponent: string;
    } | null;
};

type GoalieMismatchGameAlert = {
    id: string;
    game_date: string;
    opponent: string;
    mismatch_count: number;
};

// チーム所属情報とチーム詳細をまとめて扱うための型
type MemberWithTeam = {
    role: "staff" | "viewer";
    team: TeamRow | null;
} | null;

// ログインユーザーの所属とチーム詳細を取得する（2段階クエリ）
// Supabaseの1:1/1:Nの返り値ゆらぎを避けるため分離して取得する
export async function getMemberWithTeam(
    supabase: SupabaseClient<Database>,
    userId: string
) {
    // team_members から role / team_id を取得（RLSで本人のみに限定）
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

    // team_id が無い場合は未所属とみなす
    if (!memberResult.data?.team_id) {
        return { data: null as MemberWithTeam };
    }

    // team_id を使って teams から表示用の基本情報だけを取得
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

// チームに紐づく試合一覧を取得する
// - 一覧は日付降順で表示するため order を固定する
// - teamId 未指定の場合は全件となるため、呼び出し側で制御する
type GameFilters = {
    season?: string | null;
    from?: string | null;
    to?: string | null;
    overtime?: boolean | null;
};

export async function getGamesByTeam(
    supabase: SupabaseClient<Database>,
    teamId?: string | null,
    filters?: GameFilters
) {
    let query = supabase
        .from("games")
        .select(
            "id, game_date, opponent, venue, period_minutes, has_overtime, workflow_status"
        )
        .order("game_date", { ascending: false });

    if (teamId) {
        query = query.eq("team_id", teamId);
    }

    if (filters?.season) {
        query = query.eq("season", filters.season);
    }

    if (filters?.from) {
        query = query.gte("game_date", filters.from);
    }

    if (filters?.to) {
        query = query.lte("game_date", filters.to);
    }

    if (filters?.overtime) {
        query = query.eq("has_overtime", true);
    }

    return query.then((result) => result as { data: GameRow[] | null });
}

// チーム内で未入力（スタッツ未記録）の試合数を取得する
// - player_stats / goalie_stats が0件の試合を未入力とみなす
export async function getUnloggedGameCountByTeam(
    supabase: SupabaseClient<Database>,
    teamId?: string | null
) {
    if (!teamId) {
        return { data: 0 };
    }

    const { data: games } = await supabase
        .from("games")
        .select("id")
        .eq("team_id", teamId);

    const gameIds = (games ?? []).map((game) => game.id);

    if (gameIds.length === 0) {
        return { data: 0 };
    }

    const { data: skaterStats } = await supabase
        .from("player_stats")
        .select("game_id")
        .in("game_id", gameIds);

    const { data: goalieStats } = await supabase
        .from("goalie_stats")
        .select("game_id")
        .in("game_id", gameIds);

    const loggedGameIds = new Set<string>();

    (skaterStats ?? []).forEach((stat) => {
        if (stat.game_id) loggedGameIds.add(stat.game_id);
    });

    (goalieStats ?? []).forEach((stat) => {
        if (stat.game_id) loggedGameIds.add(stat.game_id);
    });

    const unloggedCount = gameIds.filter((id) => !loggedGameIds.has(id)).length;
    return { data: unloggedCount };
}

// シーズンに紐づく試合ID一覧を取得する
// - シーズン通算集計の対象試合を先に確定させる用途
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
// - セレクトUIの候補として使う
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
// roster管理用（Activeのみ）
export async function getPlayersByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null,
    options?: { includeInactive?: boolean }
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

    let query = supabase
        .from("players")
        .select("id, name, number, position, is_active")
        .eq("team_id", teamId)
        .order("number", { ascending: true });

    if (!options?.includeInactive) {
        query = query.eq("is_active", true);
    }

    return query;
}

// チーム所属のスケーター一覧を取得する（G以外）
// Skater集計と入力画面の基礎データに使う
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
// Goalie集計と入力画面の基礎データに使う
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
// game.team_id を含めて権限チェックに使う
export async function getGameById(
    supabase: SupabaseClient<Database>,
    gameId: string
) {
    return supabase
        .from("games")
        .select(
            "id, team_id, season, game_date, opponent, venue, period_minutes, has_overtime, workflow_status"
        )
        .eq("id", gameId)
        .maybeSingle()
        .then(
            (result) =>
                result as {
                    data: (GameRow & { team_id: string }) | null;
                    error: { message: string } | null;
                }
        );
}

// 試合IDからスケーター成績を取得する
// ライブ/修正画面で既存値を初期表示する用途
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
// ライブ/修正画面で既存値を初期表示する用途
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
// 試合詳細画面で名前・背番号を表示するためのJOIN
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
// 試合詳細画面で名前・背番号を表示するためのJOIN
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
// シーズン通算の集計ベース
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
// シーズン通算の集計ベース
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
// game.team_id に対する staff 判定に使う
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
        .then(
            (result) => result as { data: { role: "staff" | "viewer" } | null }
        );
}

// 実運用向けの要対応アラートを取得する
// - stale_games: 2日以上未確定の試合
// - goalie_mismatch_games: finalizedなのに SA != Saves + GA の試合
export async function getOperationalAlertsByTeam(
    supabase: SupabaseClient<Database>,
    teamId: string | null
) {
    if (!teamId) {
        return {
            data: {
                staleGames: [] as OperationalGameAlert[],
                staleCount: 0,
                goalieMismatchGames: [] as GoalieMismatchGameAlert[],
                goalieMismatchCount: 0,
            },
        };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffDate = cutoff.toISOString().slice(0, 10);

    const { data: staleGamesRaw } = await supabase
        .from("games")
        .select("id, game_date, opponent, workflow_status")
        .eq("team_id", teamId)
        .neq("workflow_status", "finalized")
        .lte("game_date", cutoffDate)
        .order("game_date", { ascending: true });

    const staleGames = (staleGamesRaw ?? []) as OperationalGameAlert[];

    const { data: goalieRowsRaw } = await supabase
        .from("goalie_stats")
        .select(
            "game_id, shots_against, saves, goals_against, games!inner(id, game_date, opponent, team_id, workflow_status)"
        )
        .eq("games.team_id", teamId)
        .eq("games.workflow_status", "finalized");

    const goalieRows = (goalieRowsRaw ?? []) as GoalieMismatchRow[];
    const mismatchMap = new Map<string, GoalieMismatchGameAlert>();

    goalieRows.forEach((row) => {
        if (!row.games) return;
        if (row.shots_against === row.saves + row.goals_against) return;

        const current = mismatchMap.get(row.game_id);
        if (current) {
            current.mismatch_count += 1;
            return;
        }

        mismatchMap.set(row.game_id, {
            id: row.games.id,
            game_date: row.games.game_date,
            opponent: row.games.opponent,
            mismatch_count: 1,
        });
    });

    const goalieMismatchGames = Array.from(mismatchMap.values()).sort((a, b) =>
        a.game_date < b.game_date ? -1 : 1
    );

    return {
        data: {
            staleGames: staleGames.slice(0, 5),
            staleCount: staleGames.length,
            goalieMismatchGames: goalieMismatchGames.slice(0, 5),
            goalieMismatchCount: goalieMismatchGames.length,
        },
    };
}
