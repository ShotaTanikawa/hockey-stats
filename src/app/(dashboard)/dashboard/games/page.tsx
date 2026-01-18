import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GameRow } from "@/lib/types/stats";

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
    const { data: member } = await supabase
        .from("team_members")
        .select("role, teams (id, name, season_label)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    const team = member?.teams?.[0];
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";

    // 試合一覧を日付降順で取得
    const { data: games } = await supabase
        .from("games")
        .select("id, game_date, opponent, venue, period_minutes, has_overtime")
        .order("game_date", { ascending: false });

    const gameRows = (games ?? []) as GameRow[];

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

            <div className="mx-auto w-full max-w-4xl px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold">試合一覧</div>
                        <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                    </div>
                    <Button className="h-10 rounded-xl bg-black px-4 text-white hover:bg-black/90">
                        ＋ 新規作成
                    </Button>
                </div>

                <div className="mb-3 hidden items-center px-4 text-xs text-gray-400 sm:grid sm:grid-cols-[120px_1fr_160px_160px_180px]">
                    <div>DATE</div>
                    <div>OPPONENT</div>
                    <div>VENUE</div>
                    <div>STATUS</div>
                    <div className="text-right">ACTIONS</div>
                </div>

                <div className="space-y-4">
                    {gameRows.map((game) => (
                        <Card
                            key={game.id}
                            className="border-gray-200 shadow-sm"
                        >
                            <CardContent className="flex flex-col gap-4 p-5 sm:grid sm:grid-cols-[120px_1fr_160px_160px_180px] sm:items-center">
                                <div className="text-sm text-gray-600">
                                    {formatGameDate(game.game_date)}
                                </div>
                                <div className="text-sm font-semibold">
                                    vs {game.opponent}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {game.venue ?? "-"}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {game.has_overtime && (
                                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600">
                                            OT
                                        </span>
                                    )}
                                    <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600">
                                        {game.period_minutes}min
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg px-3"
                                        asChild
                                    >
                                        <Link href={`/dashboard/games/${game.id}`}>
                                            詳細
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 rounded-lg bg-black px-3 text-white hover:bg-black/90"
                                        asChild
                                    >
                                        <Link
                                            href={`/dashboard/games/${game.id}/live`}
                                        >
                                            ライブ
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
