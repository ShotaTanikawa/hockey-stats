import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GoalieSummaryRow, SkaterSummaryRow } from "@/lib/types/stats";
import {
    getGoalieStatsByGameIds,
    getGoaliesByTeam,
    getGamesBySeason,
    getMemberWithTeam,
    getSkaterStatsByGameIds,
    getSkatersByTeam,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`;
}

export default async function DashboardStatsPlayersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await getMemberWithTeam(supabase, user.id);

    const team = member?.teams?.[0];
    const teamId = team?.id ?? null;
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";

    // シーズン内の試合IDを先に取得しておく
    const { data: games } = await getGamesBySeason(
        supabase,
        teamId,
        seasonLabel
    );

    const gameIds = (games ?? []).map((game) => game.id);

    // MVPは選手マスタのみ取得し、スタッツは仮値で表示する
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

        if (stat.game_id) {
            const set =
                skaterGameCounts.get(stat.player_id) ?? new Set<string>();
            set.add(stat.game_id);
            skaterGameCounts.set(stat.player_id, set);
        }
    });

    skaterGameCounts.forEach((set, playerId) => {
        const row = skaterTotals.get(playerId);
        if (row) {
            row.gp = set.size;
        }
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
                            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[160px_80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>POS</div>
                                <div>GP</div>
                                <div>G</div>
                                <div>A</div>
                                <div>P</div>
                                <div>SOG</div>
                                <div>BLK</div>
                                <div>PIM</div>
                                <div>SH%</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {skaterRows.map((player) => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[160px_80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <div>{player.position}</div>
                                        <div>{player.gp}</div>
                                        <div>{player.goals}</div>
                                        <div>{player.assists}</div>
                                        <div>{player.goals + player.assists}</div>
                                        <div>{player.shots}</div>
                                        <div>{player.blocks}</div>
                                        <div>{player.pim}</div>
                                        <div>
                                            {player.shots === 0
                                                ? "-"
                                                : formatPercent(
                                                    player.goals / player.shots
                                                )}
                                        </div>
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
                            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[160px_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>GP</div>
                                <div>SA</div>
                                <div>Saves</div>
                                <div>GA</div>
                                <div>SV%</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {goalieRows.map((player) => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[160px_1fr_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <div>{player.gp}</div>
                                        <div>{player.shots_against}</div>
                                        <div>{player.saves}</div>
                                        <div>{player.goals_against}</div>
                                        <div>
                                            {player.shots_against === 0
                                                ? "-"
                                                : formatPercent(
                                                    player.saves /
                                                    player.shots_against
                                                )}
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
