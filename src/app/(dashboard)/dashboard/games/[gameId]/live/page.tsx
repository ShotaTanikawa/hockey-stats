import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LiveClient from "./LiveClient";
import type {
    Goalie,
    GoalieStatRow,
    Skater,
    SkaterStatRow,
} from "@/lib/types/stats";

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

    const { data: game } = await supabase
        .from("games")
        .select("id, team_id, opponent")
        .eq("id", params.gameId)
        .maybeSingle();

    if (!game) {
        redirect("/dashboard/games");
    }

    const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("team_id", game.team_id)
        .eq("is_active", true)
        .maybeSingle();

    const canEdit = member?.role === "staff";

    const { data: skaters } = await supabase
        .from("players")
        .select("id, name, number, position")
        .eq("team_id", game.team_id)
        .neq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true });

    const { data: goalies } = await supabase
        .from("players")
        .select("id, name, number, position")
        .eq("team_id", game.team_id)
        .eq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true });

    const { data: skaterStats } = await supabase
        .from("player_stats")
        .select("player_id, goals, assists, shots, blocks, pim")
        .eq("game_id", game.id);

    const { data: goalieStats } = await supabase
        .from("goalie_stats")
        .select("player_id, shots_against, saves, goals_against")
        .eq("game_id", game.id);

    return (
        <main className="min-h-svh bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                        ライブ入力
                    </div>
                </div>
            </div>

            <LiveClient
                gameId={game.id}
                opponent={game.opponent}
                canEdit={canEdit}
                skaters={(skaters ?? []) as Skater[]}
                goalies={(goalies ?? []) as Goalie[]}
                skaterStats={(skaterStats ?? []) as SkaterStatRow[]}
                goalieStats={(goalieStats ?? []) as GoalieStatRow[]}
            />
        </main>
    );
}
