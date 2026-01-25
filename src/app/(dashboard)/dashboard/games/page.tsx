import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GameRow } from "@/lib/types/stats";
import { getGamesByTeam, getMemberWithTeam } from "@/lib/supabase/queries";
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

export default async function DashboardGamesPage() {
    // サーバー側でSupabaseクライアントを生成（RLSで絞り込み）
    const supabase = await createClient();

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

    // 試合一覧を日付降順で取得
    const { data: games } = await getGamesByTeam(supabase, team?.id);

    const gameRows = (games ?? []) as GameRow[];

    return (
        <div className="mx-auto w-full max-w-4xl">
            {/* staff のみ作成ボタンを表示 */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold">試合一覧</div>
                    <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                </div>
                {isStaff && (
                    <GameCreateDialog
                        teamId={team?.id}
                        seasonLabel={team?.season_label}
                    />
                )}
            </div>

            {/* PC幅のみテーブル風のヘッダー行を表示 */}
            <div className="mb-3 hidden items-center px-4 text-xs text-muted-foreground sm:grid sm:grid-cols-[120px_1fr_160px_160px_180px]">
                <div>DATE</div>
                <div>OPPONENT</div>
                <div>VENUE</div>
                <div>STATUS</div>
                <div className="text-right">ACTIONS</div>
            </div>

            <div className="space-y-4">
                {gameRows.map((game) => (
                    <Card key={game.id} className="border-2 border-border">
                        <CardContent className="flex flex-col gap-4 p-5 sm:grid sm:grid-cols-[120px_1fr_160px_160px_180px] sm:items-center">
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
                                {game.has_overtime && (
                                    <span className="rounded-full border-2 border-border bg-white px-2 py-0.5 text-gray-600">
                                        OT
                                    </span>
                                )}
                                <span className="rounded-full border-2 border-border bg-white px-2 py-0.5 text-gray-600">
                                    {game.period_minutes}min
                                </span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg border-2 px-3"
                                    asChild
                                >
                                    <Link href={`/dashboard/games/${game.id}`}>
                                        詳細
                                    </Link>
                                </Button>
                                {/* ライブ入力は staff のみ */}
                                {isStaff && (
                                    <Button
                                        size="sm"
                                        className="h-8 rounded-lg border-2 border-foreground bg-black px-3 text-white hover:bg-black/90"
                                        asChild
                                    >
                                        <Link
                                            href={`/dashboard/games/${game.id}/live`}
                                        >
                                            ライブ
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* viewer 向けの注意書き */}
            {!isStaff && (
                <Card className="mt-6 border-2 border-dashed border-border bg-muted/20">
                    <CardContent className="p-4 text-xs text-muted-foreground">
                        ※ viewer 権限のため閲覧のみ可能です
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
