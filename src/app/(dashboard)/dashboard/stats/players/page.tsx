import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { GoalieSummaryRow, SkaterSummaryRow } from "@/lib/types/stats";
import {
    getGoalieStatsByGameIds,
    getGoaliesByTeam,
    getGamesBySeason,
    getMemberWithTeam,
    getSeasonLabelsByTeam,
    getSkaterStatsByGameIds,
    getSkatersByTeam,
} from "@/lib/supabase/queries";
import SeasonStatsClient from "./SeasonStatsClient";

export const dynamic = "force-dynamic";

// シーズン集計のデータ取得はサーバー側で行う
// RLSが効いた状態でteam/seasonに紐づく統計を集約する
export default async function DashboardStatsPlayersPage({
    searchParams,
}: {
    searchParams?: Promise<{ season?: string }>;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await getMemberWithTeam(supabase, user.id);

    const team = member?.team ?? null;
    const teamId = team?.id ?? null;
    const fallbackSeason = team?.season_label ?? "-";
    const resolvedSearchParams = await searchParams;
    const selectedSeason = resolvedSearchParams?.season ?? fallbackSeason;

    // シーズン内の試合IDを先に取得しておく
    const { data: games } = await getGamesBySeason(
        supabase,
        teamId,
        selectedSeason
    );

    const gameIds = (games ?? []).map((game) => game.id);

    const { data: skaters } = await getSkatersByTeam(supabase, teamId);

    const { data: goalies } = await getGoaliesByTeam(supabase, teamId);

    const { data: skaterStats } = await getSkaterStatsByGameIds(
        supabase,
        gameIds
    );

    const { data: goalieStats } = await getGoalieStatsByGameIds(
        supabase,
        gameIds
    );

    // 出場試合数は game_id のユニーク数で算出する
    const skaterGameCounts = new Map<string, Set<string>>();
    const skaterTotals = new Map<string, SkaterSummaryRow>();

    (skaters ?? []).forEach((player) => {
        skaterTotals.set(player.id, {
            ...player,
            gp: 0,
            goals: 0,
            assists: 0,
            shots: 0,
            blocks: 0,
            pim: 0,
        });
    });

    // 試合スタッツをプレイヤー別に集計する
    (skaterStats ?? []).forEach((stat) => {
        const row = skaterTotals.get(stat.player_id);
        if (!row) return;
        row.goals += stat.goals;
        row.assists += stat.assists;
        row.shots += stat.shots;
        row.blocks += stat.blocks;
        row.pim += stat.pim;

        if (stat.game_id) {
            const set =
                skaterGameCounts.get(stat.player_id) ?? new Set<string>();
            set.add(stat.game_id);
            skaterGameCounts.set(stat.player_id, set);
        }
    });

    // 集計済みのユニーク試合数をGPに反映
    skaterGameCounts.forEach((set, playerId) => {
        const row = skaterTotals.get(playerId);
        if (row) {
            row.gp = set.size;
        }
    });

    // ゴーリーも同様にGPと合計値を集計
    const goalieGameCounts = new Map<string, Set<string>>();
    const goalieTotals = new Map<string, GoalieSummaryRow>();

    (goalies ?? []).forEach((player) => {
        goalieTotals.set(player.id, {
            ...player,
            gp: 0,
            shots_against: 0,
            saves: 0,
            goals_against: 0,
        });
    });

    (goalieStats ?? []).forEach((stat) => {
        const row = goalieTotals.get(stat.player_id);
        if (!row) return;
        row.shots_against += stat.shots_against;
        row.saves += stat.saves;
        row.goals_against += stat.goals_against;

        if (stat.game_id) {
            const set =
                goalieGameCounts.get(stat.player_id) ?? new Set<string>();
            set.add(stat.game_id);
            goalieGameCounts.set(stat.player_id, set);
        }
    });

    goalieGameCounts.forEach((set, playerId) => {
        const row = goalieTotals.get(playerId);
        if (row) {
            row.gp = set.size;
        }
    });

    const skaterRows = Array.from(skaterTotals.values());
    const goalieRows = Array.from(goalieTotals.values());

    const { data: seasons } = await getSeasonLabelsByTeam(supabase, teamId);

    return (
        <SeasonStatsClient
            seasonLabel={selectedSeason}
            seasons={seasons ?? []}
            skaterRows={skaterRows}
            goalieRows={goalieRows}
        />
    );
}
