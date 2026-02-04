import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
    GoalieStatWithPlayer,
    SkaterStatWithPlayer,
} from "@/lib/types/stats";
import GameMetaEditDialog from "./GameMetaEditDialog";
import {
    getGameById,
    getGoalieStatsWithPlayersByGameId,
    getMemberRoleByTeam,
    getSkaterStatsWithPlayersByGameId,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// 日本語表記（「1月1日(火)」）で日付を整形する
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

    // 試合情報が取得できない場合は一覧へ戻す
    const { data: game } = await getGameById(supabase, gameId);

    if (!game) {
        redirect("/dashboard/games");
    }

    // 試合単位のスタッツを取得（選手情報を含む）
    const { data: skaterStats } = await getSkaterStatsWithPlayersByGameId(
        supabase,
        game.id
    );

    const { data: goalieStats } = await getGoalieStatsWithPlayersByGameId(
        supabase,
        game.id
    );

    // ロール判定（staffのみ編集導線を表示）
    const { data: member } = await getMemberRoleByTeam(
        supabase,
        user.id,
        game.team_id
    );
    const canEdit = member?.role === "staff";

    const skaterRows = (skaterStats ?? []) as SkaterStatWithPlayer[];
    const goalieRows = (goalieStats ?? []) as GoalieStatWithPlayer[];

    // チーム合計を算出（スケーター分のみ）
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
        <div className="space-y-6">
            <Link
                href="/dashboard/games"
                className="text-xs text-muted-foreground hover:text-foreground"
            >
                ← 試合一覧へ
            </Link>

            <Card className="border border-border/60">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-lg font-semibold tracking-tight">
                            {formatGameDate(game.game_date)} vs {game.opponent}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {game.venue ?? "会場未設定"} ・{" "}
                            {game.period_minutes}
                            min
                            {game.has_overtime ? " / OT" : ""}
                        </div>
                    </div>
                    {/* staff のみ編集 / ライブ導線を表示 */}
                    {canEdit && (
                        <div className="flex flex-wrap items-center gap-2">
                            <GameMetaEditDialog game={game} canEdit={canEdit} />
                            <Button
                                variant="outline"
                                size="sm"
                                className="border border-border/70"
                                asChild
                            >
                                <Link href={`/dashboard/games/${game.id}/edit`}>
                                    修正
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                className="border border-foreground bg-foreground text-background"
                                asChild
                            >
                                <Link href={`/dashboard/games/${game.id}/live`}>
                                    ライブ
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6">
                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">Team Totals</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 py-6 text-sm sm:grid-cols-5">
                        <div>
                            <div className="text-xs text-muted-foreground">
                                G
                            </div>
                            <div className="font-semibold">{totals.goals}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">
                                A
                            </div>
                            <div className="font-semibold">
                                {totals.assists}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">
                                SOG
                            </div>
                            <div className="font-semibold">{totals.shots}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">
                                BLK
                            </div>
                            <div className="font-semibold">{totals.blocks}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">
                                PIM
                            </div>
                            <div className="font-semibold">{totals.pim}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">Skaters</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]">
                            <div>Name</div>
                            <div>POS</div>
                            <div>G</div>
                            <div>A</div>
                            <div>PIM</div>
                            <div>SOG</div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {skaterRows.map((row) => {
                                const player = row.players;
                                return (
                                    <div
                                        key={row.player_id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]"
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

                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">Goalies</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[140px_1fr_1fr_1fr_1fr]">
                            <div>Name</div>
                            <div>SA</div>
                            <div>Saves</div>
                            <div>GA</div>
                            <div>SV%</div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {goalieRows.map((row) => {
                                const player = row.players;
                                return (
                                    <div
                                        key={row.player_id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr]"
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
    );
}
