import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
    GameRow,
    GoalieStatWithPlayer,
    SkaterStatWithPlayer,
} from "@/lib/types/stats";

export const dynamic = "force-dynamic";

function formatGameDate(dateString: string) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    const parts = new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
    }).formatToParts(date);

    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    const weekday = parts.find((part) => part.type === "weekday")?.value;

    if (!month || !day || !weekday) {
        return date.toLocaleDateString("ja-JP");
    }

    return `${month}月${day}日(${weekday})`;
}

export default async function GameDetailPage({
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
        .select("id, game_date, opponent, venue, period_minutes, has_overtime")
        .eq("id", params.gameId)
        .maybeSingle();

    if (!game) {
        redirect("/dashboard/games");
    }

    const { data: skaterStats } = await supabase
        .from("player_stats")
        .select(
            "player_id, goals, assists, shots, blocks, pim, players (name, number, position)"
        )
        .eq("game_id", game.id);

    const { data: goalieStats } = await supabase
        .from("goalie_stats")
        .select(
            "player_id, shots_against, saves, goals_against, players (name, number)"
        )
        .eq("game_id", game.id);

    const skaterRows = (skaterStats ?? []) as SkaterStatWithPlayer[];
    const goalieRows = (goalieStats ?? []) as GoalieStatWithPlayer[];

    const totals = skaterRows.reduce(
        (acc, row) => ({
            goals: acc.goals + row.goals,
            assists: acc.assists + row.assists,
            shots: acc.shots + row.shots,
            blocks: acc.blocks + row.blocks,
            pim: acc.pim + row.pim,
        }),
        { goals: 0, assists: 0, shots: 0, blocks: 0, pim: 0 }
    );

    return (
        <main className="min-h-svh bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                        試合詳細
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
                            {formatGameDate(game.game_date)} vs {game.opponent}
                        </div>
                        <div className="text-xs text-gray-500">
                            {game.venue ?? "会場未設定"} ・ {game.period_minutes}
                            min
                            {game.has_overtime ? " / OT" : ""}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/games/${game.id}/edit`}>
                                修正
                            </Link>
                        </Button>
                        <Button size="sm" className="bg-black text-white" asChild>
                            <Link href={`/dashboard/games/${game.id}/live`}>
                                ライブ
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-base">
                                Team Totals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 py-6 text-sm sm:grid-cols-5">
                            <div>
                                <div className="text-xs text-gray-500">G</div>
                                <div className="font-semibold">
                                    {totals.goals}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">A</div>
                                <div className="font-semibold">
                                    {totals.assists}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">SOG</div>
                                <div className="font-semibold">
                                    {totals.shots}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">BLK</div>
                                <div className="font-semibold">
                                    {totals.blocks}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">PIM</div>
                                <div className="font-semibold">
                                    {totals.pim}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-base">
                                Skaters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>POS</div>
                                <div>G</div>
                                <div>A</div>
                                <div>PIM</div>
                                <div>SOG</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {skaterRows.map((row) => {
                                    const player = row.players?.[0];
                                    return (
                                        <div
                                            key={row.player_id}
                                            className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]"
                                        >
                                            <div className="font-semibold text-gray-700">
                                                #{player?.number} {player?.name}
                                            </div>
                                            <div>{player?.position ?? "-"}</div>
                                            <div>{row.goals}</div>
                                            <div>{row.assists}</div>
                                            <div>{row.pim}</div>
                                            <div>{row.shots}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-base">
                                Goalies
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>SA</div>
                                <div>Saves</div>
                                <div>GA</div>
                                <div>SV%</div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {goalieRows.map((row) => {
                                    const player = row.players?.[0];
                                    return (
                                        <div
                                            key={row.player_id}
                                            className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr]"
                                        >
                                            <div className="font-semibold text-gray-700">
                                                #{player?.number} {player?.name}
                                            </div>
                                            <div>{row.shots_against}</div>
                                            <div>{row.saves}</div>
                                            <div>{row.goals_against}</div>
                                            <div>
                                                {row.shots_against === 0
                                                    ? "-"
                                                    : (
                                                        row.saves /
                                                        row.shots_against
                                                    ).toFixed(3)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
