import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SkaterRow = {
    id: string;
    name: string;
    number: number;
    position: string;
    goals: number;
    assists: number;
    shots: number;
    blocks: number;
    pim: number;
};

type GoalieRow = {
    id: string;
    name: string;
    number: number;
    shots_against: number;
    saves: number;
    goals_against: number;
};

export default async function DashboardStatsPlayersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await supabase
        .from("team_members")
        .select("teams (id, name, season_label)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    const team = member?.teams?.[0];
    const teamId = team?.id ?? null;
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";

    // MVPは選手マスタのみ取得し、スタッツは仮値で表示する
    const { data: skaters } = await supabase
        .from("players")
        .select("id, name, number, position")
        .eq("team_id", teamId)
        .neq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true });

    const { data: goalies } = await supabase
        .from("players")
        .select("id, name, number")
        .eq("team_id", teamId)
        .eq("position", "G")
        .eq("is_active", true)
        .order("number", { ascending: true });

    // TODO: player_stats を集計して実データに置き換える
    const skaterRows = (skaters ?? []).map((player) => ({
        ...player,
        goals: 0,
        assists: 0,
        shots: 0,
        blocks: 0,
        pim: 0,
    })) as SkaterRow[];

    // TODO: goalie_stats を集計して実データに置き換える
    const goalieRows = (goalies ?? []).map((player) => ({
        ...player,
        shots_against: 0,
        saves: 0,
        goals_against: 0,
    })) as GoalieRow[];

    return (
        <main className="min-h-svh bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white">
                            <span>🏒</span>
                        </div>
                        <div>
                            <div className="text-sm font-semibold">
                                {teamName}
                            </div>
                            <div className="text-xs text-gray-500">
                                {seasonLabel}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        ☰
                    </Button>
                </div>
            </div>

            <div className="mx-auto w-full max-w-5xl px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold">
                            シーズン通算
                        </div>
                        <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                    </div>
                    <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
                        {seasonLabel}
                    </div>
                </div>

                <div className="mb-6 grid gap-6">
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="mb-4 text-sm font-semibold">
                                Skaters
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>G</div>
                                <div>A</div>
                                <div>PIM</div>
                                <div>SOG</div>
                                <div>BLK</div>
                                <div>PTS</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {skaterRows.map((player) => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <div>{player.goals}</div>
                                        <div>{player.assists}</div>
                                        <div>{player.pim}</div>
                                        <div>{player.shots}</div>
                                        <div>{player.blocks}</div>
                                        <div>{player.goals + player.assists}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="mb-4 text-sm font-semibold">
                                Goalies
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>SA</div>
                                <div>Saves</div>
                                <div>GA</div>
                                <div>SV%</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {goalieRows.map((player) => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <div>{player.shots_against}</div>
                                        <div>{player.saves}</div>
                                        <div>{player.goals_against}</div>
                                        <div>
                                            {player.shots_against === 0
                                                ? "-"
                                                : (
                                                    player.saves /
                                                    player.shots_against
                                                ).toFixed(3)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="border-t border-gray-200 bg-white">
                <div className="mx-auto grid w-full max-w-3xl grid-cols-3 text-center text-xs text-gray-500">
                    <Link href="/dashboard/games" className="py-3">
                        Games
                    </Link>
                    <Link href="/dashboard/players" className="py-3">
                        Players
                    </Link>
                    <Link href="/dashboard/stats/players" className="py-3">
                        Stats
                    </Link>
                </div>
            </div>
        </main>
    );
}
