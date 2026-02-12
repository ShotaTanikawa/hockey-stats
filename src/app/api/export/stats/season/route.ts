import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";
import type { GoalieSummaryRow, SkaterSummaryRow } from "@/lib/types/stats";
import {
    getGoalieStatsByGameIds,
    getGoaliesByTeam,
    getGamesBySeason,
    getMemberWithTeam,
    getSkaterStatsByGameIds,
    getSkatersByTeam,
} from "@/lib/supabase/queries";

function formatPercent(value: number | null) {
    if (value === null) return "";
    return `${(value * 100).toFixed(1)}%`;
}

function safeFileNameSegment(value: string) {
    return value.replace(/[^\p{L}\p{N}_-]+/gu, "_");
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "未ログインです。" }, { status: 401 });
    }

    const { data: member } = await getMemberWithTeam(supabase, user.id);
    const team = member?.team;

    if (!team) {
        return NextResponse.json(
            { error: "チーム情報が見つかりません。" },
            { status: 404 }
        );
    }

    const url = new URL(request.url);
    const selectedSeason =
        url.searchParams.get("season")?.trim() || team.season_label;

    const { data: games } = await getGamesBySeason(
        supabase,
        team.id,
        selectedSeason
    );
    const gameIds = (games ?? []).map((game) => game.id);

    const { data: skaters } = await getSkatersByTeam(supabase, team.id);
    const { data: goalies } = await getGoaliesByTeam(supabase, team.id);
    const { data: skaterStats } = await getSkaterStatsByGameIds(
        supabase,
        gameIds
    );
    const { data: goalieStats } = await getGoalieStatsByGameIds(
        supabase,
        gameIds
    );

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

    (skaterStats ?? []).forEach((stat) => {
        const row = skaterTotals.get(stat.player_id);
        if (!row) return;

        row.goals += stat.goals;
        row.assists += stat.assists;
        row.shots += stat.shots;
        row.blocks += stat.blocks;
        row.pim += stat.pim;

        if (!stat.game_id) return;
        const set = skaterGameCounts.get(stat.player_id) ?? new Set<string>();
        set.add(stat.game_id);
        skaterGameCounts.set(stat.player_id, set);
    });

    skaterGameCounts.forEach((set, playerId) => {
        const row = skaterTotals.get(playerId);
        if (row) row.gp = set.size;
    });

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

        if (!stat.game_id) return;
        const set = goalieGameCounts.get(stat.player_id) ?? new Set<string>();
        set.add(stat.game_id);
        goalieGameCounts.set(stat.player_id, set);
    });

    goalieGameCounts.forEach((set, playerId) => {
        const row = goalieTotals.get(playerId);
        if (row) row.gp = set.size;
    });

    const headers = [
        "team",
        "season",
        "category",
        "number",
        "name",
        "position",
        "gp",
        "goals",
        "assists",
        "points",
        "shots",
        "blocks",
        "pim",
        "shooting_pct",
        "shots_against",
        "saves",
        "goals_against",
        "save_pct",
        "gaa",
    ];

    const rows: Array<Array<string | number | null>> = [];

    Array.from(skaterTotals.values()).forEach((player) => {
        rows.push([
            team.name,
            selectedSeason,
            "skater",
            player.number,
            player.name,
            player.position,
            player.gp,
            player.goals,
            player.assists,
            player.goals + player.assists,
            player.shots,
            player.blocks,
            player.pim,
            player.shots > 0 ? formatPercent(player.goals / player.shots) : "",
            "",
            "",
            "",
            "",
            "",
        ]);
    });

    Array.from(goalieTotals.values()).forEach((player) => {
        const savePct =
            player.shots_against > 0
                ? formatPercent(player.saves / player.shots_against)
                : "";
        const gaa =
            player.gp > 0 ? (player.goals_against / player.gp).toFixed(2) : "";

        rows.push([
            team.name,
            selectedSeason,
            "goalie",
            player.number,
            player.name,
            "G",
            player.gp,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            player.shots_against,
            player.saves,
            player.goals_against,
            savePct,
            gaa,
        ]);
    });

    const csv = toCsv(headers, rows);
    const fileName = `season_${safeFileNameSegment(
        team.name
    )}_${safeFileNameSegment(selectedSeason)}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
                fileName
            )}`,
            "Cache-Control": "no-store",
        },
    });
}
