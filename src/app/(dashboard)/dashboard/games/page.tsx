import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GameFlowSteps from "@/components/games/GameFlowSteps";
import type { GameRow } from "@/lib/types/stats";
import {
    getGamesByTeam,
    getMemberWithTeam,
    getSeasonLabelsByTeam,
} from "@/lib/supabase/queries";
import GameCreateDialog from "./GameCreateDialog";

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

export default async function DashboardGamesPage({
    searchParams,
}: {
    searchParams?: Promise<{
        season?: string;
        q?: string;
        from?: string;
        to?: string;
        overtime?: string;
    }>;
}) {
    // サーバー側でSupabaseクライアントを生成（RLSで絞り込み）
    const supabase = await createClient();

    const resolvedSearchParams = await searchParams;
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // 未ログインはログイン画面へ
        redirect("/login");
    }

    // ログインユーザーの所属チーム情報を取得
    const { data: member } = await getMemberWithTeam(supabase, user.id);

    const team = member?.team ?? null;
    // staffのみ作成/ライブ導線を表示する
    const isStaff = member?.role === "staff";

    const selectedSeason =
        resolvedSearchParams?.season ?? team?.season_label ?? "all";
    const fromDate = resolvedSearchParams?.from ?? "";
    const toDate = resolvedSearchParams?.to ?? "";
    const searchQuery = resolvedSearchParams?.q?.trim() ?? "";
    const overtimeOnly = resolvedSearchParams?.overtime === "1";

    // 試合一覧を日付降順で取得
    const { data: games } = await getGamesByTeam(supabase, team?.id, {
        season: selectedSeason === "all" ? null : selectedSeason,
        from: fromDate || null,
        to: toDate || null,
        overtime: overtimeOnly || null,
    });

    const gameRows = (games ?? []) as GameRow[];
    const gameIds = gameRows.map((game) => game.id);

    // 試合ごとの入力状況を判定するため、スタッツ有無をまとめて取得する
    const [skaterLoggedResult, goalieLoggedResult] =
        gameIds.length > 0
            ? await Promise.all([
                  supabase
                      .from("player_stats")
                      .select("game_id")
                      .in("game_id", gameIds),
                  supabase
                      .from("goalie_stats")
                      .select("game_id")
                      .in("game_id", gameIds),
              ])
            : [{ data: [] }, { data: [] }];

    const skaterLoggedIds = new Set(
        (skaterLoggedResult.data ?? []).map((row) => row.game_id)
    );
    const goalieLoggedIds = new Set(
        (goalieLoggedResult.data ?? []).map((row) => row.game_id)
    );

    const filteredGames = searchQuery
        ? gameRows.filter((game) => {
              const haystack = `${game.opponent} ${game.venue ?? ""}`.toLowerCase();
              return haystack.includes(searchQuery.toLowerCase());
          })
        : gameRows;

    const { data: seasons } = await getSeasonLabelsByTeam(
        supabase,
        team?.id ?? null
    );
    const seasonOptions = Array.from(
        new Set(
            [team?.season_label, ...(seasons ?? [])].filter(
                (season): season is string => Boolean(season)
            )
        )
    );

    function getGameStage(gameId: string) {
        const game = gameRows.find((item) => item.id === gameId);
        if (game?.workflow_status === "finalized") return "確定済み";

        const hasSkater = skaterLoggedIds.has(gameId);
        const hasGoalie = goalieLoggedIds.has(gameId);

        if (!hasSkater && !hasGoalie) return "未入力";
        if (hasSkater && hasGoalie) return "入力済み";
        return "入力中";
    }

    return (
        <div className="mx-auto w-full max-w-6xl">
            {/* staff のみ作成ボタンを表示 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        <span className="font-display">Games</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        試合の作成・管理とライブ入力をまとめて確認
                    </div>
                </div>
                {isStaff && (
                    <GameCreateDialog
                        teamId={team?.id}
                        seasonLabel={team?.season_label}
                    />
                )}
            </div>

            <Card className="mb-6 border border-border/60">
                <CardContent className="space-y-3 p-5">
                    <div className="text-xs text-muted-foreground">
                        試合運用フロー
                    </div>
                    <GameFlowSteps current="create" />
                </CardContent>
            </Card>

            <Card className="mb-6 border border-border/60">
                <CardContent className="space-y-4 p-5">
                    <form method="GET" className="grid gap-4">
                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-xs">
                                    検索（対戦相手/会場）
                                </Label>
                                <Input
                                    id="search"
                                    name="q"
                                    placeholder="Tigers / Tokyo"
                                    className="h-11 rounded-xl border-2"
                                    defaultValue={searchQuery}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="season" className="text-xs">
                                    シーズン
                                </Label>
                                <select
                                    id="season"
                                    name="season"
                                    className="h-11 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                    defaultValue={selectedSeason}
                                >
                                    <option value="all">全シーズン</option>
                                    {seasonOptions.map((season) => (
                                        <option key={season} value={season}>
                                            {season}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="from" className="text-xs">
                                    From
                                </Label>
                                <Input
                                    id="from"
                                    name="from"
                                    type="date"
                                    className="h-11 rounded-xl border-2"
                                    defaultValue={fromDate}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to" className="text-xs">
                                    To
                                </Label>
                                <Input
                                    id="to"
                                    name="to"
                                    type="date"
                                    className="h-11 rounded-xl border-2"
                                    defaultValue={toDate}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="overtime"
                                        value="1"
                                        defaultChecked={overtimeOnly}
                                        className="h-4 w-4 rounded border-border/70"
                                    />
                                    OTのみ表示
                                </label>
                                <span>{filteredGames.length} games</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9 rounded-lg border border-foreground bg-foreground px-3 text-background"
                                >
                                    適用
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg border-border/70"
                                    asChild
                                >
                                    <Link href="/dashboard/games">リセット</Link>
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* PC幅のみテーブル風のヘッダー行を表示 */}
            <div className="mb-3 hidden items-center px-4 text-xs text-muted-foreground sm:grid sm:grid-cols-[120px_1fr_160px_160px_220px]">
                <div>DATE</div>
                <div>OPPONENT</div>
                <div>VENUE</div>
                <div>STATUS</div>
                <div className="text-right">ACTIONS</div>
            </div>

            <div className="space-y-4">
                {filteredGames.length === 0 && (
                    <Card className="border border-dashed border-border/70 bg-muted/20">
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            該当する試合がありません。
                            {isStaff
                                ? " 右上の「新規作成」から追加できます。"
                                : " staff に作成を依頼してください。"}
                        </CardContent>
                    </Card>
                )}
                {filteredGames.map((game) => (
                    <Card
                        key={game.id}
                        className="border border-border/60 transition hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg"
                    >
                        {(() => {
                            const stage = getGameStage(game.id);
                            const isLocked = game.workflow_status === "finalized";
                            return (
                        <CardContent className="flex flex-col gap-4 p-5 sm:grid sm:grid-cols-[120px_1fr_160px_160px_220px] sm:items-center">
                            <div className="text-sm text-muted-foreground">
                                {formatGameDate(game.game_date)}
                            </div>
                            <div className="text-sm font-semibold">
                                vs {game.opponent}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {game.venue ?? "-"}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span
                                    className={`rounded-full border px-2 py-0.5 ${
                                        stage === "未入力"
                                            ? "border-amber-300 bg-amber-50 text-amber-700"
                                            : stage === "入力中"
                                              ? "border-blue-300 bg-blue-50 text-blue-700"
                                              : "border-emerald-300 bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    {stage}
                                </span>
                                {game.has_overtime && (
                                    <span className="rounded-full border border-border/70 bg-white/80 px-2 py-0.5 text-gray-600">
                                        OT
                                    </span>
                                )}
                                <span className="rounded-full border border-border/70 bg-white/80 px-2 py-0.5 text-gray-600">
                                    {game.period_minutes}min
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg border border-border/70 px-3"
                                    asChild
                                >
                                    <Link href={`/dashboard/games/${game.id}`}>
                                        詳細
                                    </Link>
                                </Button>
                                {/* ライブ入力は staff のみ */}
                                {isStaff && !isLocked && (
                                    <Button
                                        size="sm"
                                        className="h-8 rounded-lg border border-foreground bg-foreground px-3 text-background hover:bg-foreground/90"
                                        asChild
                                    >
                                        <Link
                                            href={`/dashboard/games/${game.id}/live`}
                                        >
                                            ライブ
                                        </Link>
                                    </Button>
                                )}
                                {isStaff && !isLocked && stage !== "未入力" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg border border-border/70 px-3"
                                        asChild
                                    >
                                        <Link href={`/dashboard/games/${game.id}/edit`}>
                                            修正
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                            );
                        })()}
                    </Card>
                ))}
            </div>

            {/* viewer 向けの注意書き */}
            {!isStaff && (
                <Card className="mt-6 border border-dashed border-border/70 bg-muted/20">
                    <CardContent className="p-4 text-xs text-muted-foreground">
                        ※ viewer 権限のため閲覧のみ可能です
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
