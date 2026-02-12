import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
    getMemberWithTeam,
    getOperationalAlertsByTeam,
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await getMemberWithTeam(supabase, user.id);
    const isStaff = member?.role === "staff";
    const teamId = member?.team?.id ?? null;
    const { data: operationalAlerts } = await getOperationalAlertsByTeam(
        supabase,
        teamId
    );
    const staleGames = operationalAlerts?.staleGames ?? [];
    const staleCount = operationalAlerts?.staleCount ?? 0;
    const goalieMismatchGames = operationalAlerts?.goalieMismatchGames ?? [];
    const goalieMismatchCount = operationalAlerts?.goalieMismatchCount ?? 0;

    if (!isStaff) {
        return (
            <div className="mx-auto w-full max-w-4xl">
                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">運用メニュー</CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 text-sm text-muted-foreground">
                        このページは staff のみ閲覧できます。
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    <span className="font-display">Operations</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                    実運用の週次タスクと緊急時フローを確認できます。
                </div>
            </div>

            <Card className="border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">週次チェック</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 py-5 text-sm">
                    <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                        1. 監査ログを確認（異常更新・誤操作の有無）
                    </div>
                    <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                        2. 招待コード運用を確認（不要な共有・漏えいの有無）
                    </div>
                    <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                        3. バックアップを取得（Freeプラン: 週1手動）
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">要対応アラート</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 py-5 text-sm">
                    <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                        未確定（2日超）:{" "}
                        <span className="font-semibold">{staleCount}</span>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-white/80 p-3">
                        ゴーリー整合性エラー:{" "}
                        <span className="font-semibold">
                            {goalieMismatchCount}
                        </span>
                    </div>

                    {staleGames.length > 0 && (
                        <div>
                            <div className="mb-2 text-xs text-muted-foreground">
                                未確定の試合
                            </div>
                            <div className="space-y-2">
                                {staleGames.map((game) => (
                                    <Link
                                        key={game.id}
                                        href={`/dashboard/games/${game.id}`}
                                        className="block rounded-lg border border-border/70 bg-white px-3 py-2 text-xs hover:border-border"
                                    >
                                        {game.game_date} vs {game.opponent}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {goalieMismatchGames.length > 0 && (
                        <div>
                            <div className="mb-2 text-xs text-muted-foreground">
                                整合性確認が必要な試合
                            </div>
                            <div className="space-y-2">
                                {goalieMismatchGames.map((game) => (
                                    <Link
                                        key={game.id}
                                        href={`/dashboard/games/${game.id}/edit`}
                                        className="block rounded-lg border border-border/70 bg-white px-3 py-2 text-xs hover:border-border"
                                    >
                                        {game.game_date} vs {game.opponent} ・{" "}
                                        {game.mismatch_count}件
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {staleCount === 0 && goalieMismatchCount === 0 && (
                        <div className="text-xs text-muted-foreground">
                            現在、緊急対応が必要な項目はありません。
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">運用導線</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 py-5 sm:grid-cols-3">
                    <Link
                        href="/dashboard/audit"
                        className="rounded-xl border border-border/70 bg-white/80 p-3 text-sm font-medium transition hover:border-border"
                    >
                        監査ログ
                    </Link>
                    <Link
                        href="/dashboard/games"
                        className="rounded-xl border border-border/70 bg-white/80 p-3 text-sm font-medium transition hover:border-border"
                    >
                        試合一覧
                    </Link>
                    <Link
                        href="/dashboard"
                        className="rounded-xl border border-border/70 bg-white/80 p-3 text-sm font-medium transition hover:border-border"
                    >
                        ダッシュボード
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
