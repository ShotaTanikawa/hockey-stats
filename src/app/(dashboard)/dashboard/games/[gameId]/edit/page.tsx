import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditClient from "./EditClient";
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

export default async function GameEditPage({
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
    const { data: game } = await getGameById(supabase, gameId);

    if (!game) {
        redirect("/dashboard/games");
    }

    // ロール確認（staff のみ編集可能）
    const { data: member } = await getMemberRoleByTeam(
        supabase,
        user.id,
        game.team_id
    );

    const canEdit = member?.role === "staff";

    // 編集フォームに必要な選手と現在スタッツを取得
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
            <EditClient
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
