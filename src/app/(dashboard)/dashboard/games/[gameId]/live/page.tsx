import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LiveClient from "./LiveClient";
import type { Goalie, GoalieStatRow, Skater, SkaterStatRow } from "@/lib/types/stats";
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
    params: { gameId: string };
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: game } = await getGameById(supabase, params.gameId);

    if (!game) {
        redirect("/dashboard/games");
    }

    const { data: member } = await getMemberRoleByTeam(
        supabase,
        user.id,
        game.team_id
    );

    const canEdit = member?.role === "staff";

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
