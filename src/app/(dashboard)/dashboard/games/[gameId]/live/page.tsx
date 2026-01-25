import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LiveClient from "./LiveClient";
import type {
    Goalie,
    GoalieStatRow,
    Skater,
    SkaterStatRow,
} from "@/lib/types/stats";
import {
    getGameById,
    getGoalieStatsByGameId,
    getGoaliesByTeam,
    getMemberRoleByTeam,
    getSkaterStatsByGameId,
    getSkatersByTeam,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function GameLivePage({
    params,
}: {
    params: Promise<{ gameId: string }>;
}) {
    const { gameId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 試合が見つからない場合は一覧へ戻す
    const { data: game, error: gameError } = await getGameById(
        supabase,
        gameId
    );

    if (!game) {
        console.log("[debug] live: game not found", {
            gameId,
            userId: user.id,
            error: gameError?.message ?? null,
        });
        redirect("/dashboard/games");
    }

    // ロール確認（staff のみライブ入力可能）
    const { data: member } = await getMemberRoleByTeam(
        supabase,
        user.id,
        game.team_id
    );

    const canEdit = member?.role === "staff";

    // viewer はライブ入力不可のため、試合詳細へ戻す
    if (!canEdit) {
        console.log("[debug] live: not staff", {
            gameId: game.id,
            teamId: game.team_id,
            userId: user.id,
            role: member?.role ?? null,
        });
        redirect(`/dashboard/games/${game.id}`);
    }

    // ライブ入力に必要な選手と現在スタッツを取得
    const { data: skaters } = await getSkatersByTeam(supabase, game.team_id);

    const { data: goalies } = await getGoaliesByTeam(supabase, game.team_id);

    const { data: skaterStats } = await getSkaterStatsByGameId(
        supabase,
        game.id
    );

    const { data: goalieStats } = await getGoalieStatsByGameId(
        supabase,
        game.id
    );

    return (
        <div className="space-y-4">
            <Link
                href={`/dashboard/games/${game.id}`}
                className="text-xs text-muted-foreground hover:text-foreground"
            >
                ← 試合詳細へ
            </Link>
            <LiveClient
                gameId={game.id}
                opponent={game.opponent}
                canEdit={canEdit}
                skaters={(skaters ?? []) as Skater[]}
                goalies={(goalies ?? []) as Goalie[]}
                skaterStats={(skaterStats ?? []) as SkaterStatRow[]}
                goalieStats={(goalieStats ?? []) as GoalieStatRow[]}
            />
        </div>
    );
}
