import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";
import {
    getGameById,
    getGoalieStatsWithPlayersByGameId,
    getMemberRoleByTeam,
    getSkaterStatsWithPlayersByGameId,
} from "@/lib/supabase/queries";

function formatPercent(value: number | null) {
    if (value === null) return "";
    return `${(value * 100).toFixed(1)}%`;
}

function safeFileNameSegment(value: string) {
    return value.replace(/[^\p{L}\p{N}_-]+/gu, "_");
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ gameId: string }> }
) {
    const { gameId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "未ログインです。" }, { status: 401 });
    }

    const { data: game } = await getGameById(supabase, gameId);

    if (!game) {
        return NextResponse.json(
            { error: "試合が見つかりません。" },
            { status: 404 }
        );
    }

    const { data: member } = await getMemberRoleByTeam(
        supabase,
        user.id,
        game.team_id
    );

    if (!member) {
        return NextResponse.json(
            { error: "この試合を出力する権限がありません。" },
            { status: 403 }
        );
    }

    const { data: skaterStats } = await getSkaterStatsWithPlayersByGameId(
        supabase,
        game.id
    );
    const { data: goalieStats } = await getGoalieStatsWithPlayersByGameId(
        supabase,
        game.id
    );
    const season = game.season ?? "";
    const workflowStatus = game.workflow_status ?? "draft";

    const headers = [
        "section",
        "game_id",
        "game_date",
        "season",
        "opponent",
        "venue",
        "workflow_status",
        "player_number",
        "player_name",
        "position",
        "goals",
        "assists",
        "points",
        "shots",
        "blocks",
        "pim",
        "shots_against",
        "saves",
        "goals_against",
        "save_pct",
    ];

    const rows: Array<Array<string | number | null>> = [
        [
            "game",
            game.id,
            game.game_date,
            season,
            game.opponent,
            game.venue,
            workflowStatus,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ],
    ];

    (skaterStats ?? []).forEach((row) => {
        rows.push([
            "skater",
            game.id,
            game.game_date,
            season,
            game.opponent,
            game.venue,
            workflowStatus,
            row.players?.number ?? "",
            row.players?.name ?? "",
            row.players?.position ?? "",
            row.goals,
            row.assists,
            row.goals + row.assists,
            row.shots,
            row.blocks,
            row.pim,
            "",
            "",
            "",
            "",
        ]);
    });

    (goalieStats ?? []).forEach((row) => {
        rows.push([
            "goalie",
            game.id,
            game.game_date,
            season,
            game.opponent,
            game.venue,
            workflowStatus,
            row.players?.number ?? "",
            row.players?.name ?? "",
            "G",
            "",
            "",
            "",
            "",
            "",
            "",
            row.shots_against,
            row.saves,
            row.goals_against,
            row.shots_against > 0
                ? formatPercent(row.saves / row.shots_against)
                : "",
        ]);
    });

    const csv = toCsv(headers, rows);
    const fileName = `game_${game.game_date}_${safeFileNameSegment(game.opponent)}.csv`;

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
