import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    BarChart,
    Calendar,
    ClipboardList,
    Flag,
    PlayCircle,
} from "lucide-react";
import {
    getMemberWithTeam,
    getOperationalAlertsByTeam,
    getUnloggedGameCountByTeam,
} from "@/lib/supabase/queries";
import TeamMembersCard from "./TeamMembersCard";
import GameFlowSteps from "@/components/games/GameFlowSteps";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    // サーバー側でSupabaseクライアントを生成（RLSで絞り込み）
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // 未ログインはログイン画面へ
        redirect("/login");
    }

    // ログインユーザーの所属チームとロールを取得
    // - TeamMembersCard の表示制御にも使用
    const { data: member } = await getMemberWithTeam(supabase, user.id);

    const team = member?.team ?? null;
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";
    const roleLabel = member?.role ?? "viewer";
    const isStaff = roleLabel === "staff";
    const teamId = team?.id ?? null;

    const { data: unloggedGameCount } = await getUnloggedGameCountByTeam(
        supabase,
        teamId
    );
    const { data: operationalAlerts } = await getOperationalAlertsByTeam(
        supabase,
        teamId
    );
    const staleGames = operationalAlerts?.staleGames ?? [];
    const staleCount = operationalAlerts?.staleCount ?? 0;
    const goalieMismatchGames = operationalAlerts?.goalieMismatchGames ?? [];
    const goalieMismatchCount = operationalAlerts?.goalieMismatchCount ?? 0;

    return (
        <div className="mx-auto w-full max-w-4xl">
            {/* 役割チップ付きのダッシュボード見出し */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        <span className="font-display">Dashboard</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        チーム運用の全体状況をまとめて確認できます
                    </div>
                </div>
                <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
                        isStaff
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-muted text-foreground"
                    }`}
                >
                    {roleLabel.toUpperCase()}
                </span>
            </div>

            <Card className="mb-8 border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">
                        Team Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 py-6 sm:grid-cols-2">
                    <div>
                        <div className="text-xs text-muted-foreground">
                            Team
                        </div>
                        <div className="text-sm font-semibold">{teamName}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            Season
                        </div>
                        <div className="text-sm font-semibold">
                            {seasonLabel}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            Email
                        </div>
                        <div className="text-sm font-semibold">
                            {user.email}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            Role
                        </div>
                        <div className="text-sm font-semibold">{roleLabel}</div>
                    </div>
                </CardContent>
            </Card>

            {/* staff のみメンバー管理カードを表示 */}
            {teamId && (
                <TeamMembersCard
                    teamId={teamId}
                    currentUserId={user.id}
                    canManage={isStaff}
                />
            )}

            <Card className="mb-8 border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">
                        Operational Snapshot
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-xs text-muted-foreground">
                            入力未開始の試合数
                        </div>
                        <div className="mt-2 text-3xl font-semibold tracking-tight">
                            {unloggedGameCount}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            スタッツが未記録の試合をカウントしています
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="h-10 rounded-xl border border-border/70"
                        asChild
                    >
                        <Link href="/dashboard/games">試合一覧へ</Link>
                    </Button>
                </CardContent>
            </Card>

            {isStaff && (
                <Card className="mb-8 border border-amber-200/80 bg-amber-50/50">
                    <CardHeader className="border-b border-amber-200/80">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-amber-700" />
                            要対応アラート
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 py-5 text-sm">
                        <div className="rounded-xl border border-amber-200 bg-white/90 p-3">
                            未確定（2日超）:{" "}
                            <span className="font-semibold">{staleCount}</span>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-white/90 p-3">
                            ゴーリー整合性エラー:{" "}
                            <span className="font-semibold">
                                {goalieMismatchCount}
                            </span>
                        </div>

                        {staleGames.length > 0 && (
                            <div>
                                <div className="mb-2 text-xs text-muted-foreground">
                                    未確定の試合（先頭5件）
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
                                    整合性確認が必要な試合（先頭5件）
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
            )}

            {isStaff && (
                <Card className="mb-8 border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">今日やること</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 py-6">
                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                                試合運用フロー
                            </div>
                            <GameFlowSteps current="create" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Link href="/dashboard/games" className="block">
                                <div className="rounded-2xl border border-border/70 bg-white/70 p-4 transition hover:border-border hover:shadow-sm">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                        <Flag className="h-4 w-4" />
                                        試合を登録
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        まず新規試合を作成
                                    </div>
                                </div>
                            </Link>
                            <Link href="/dashboard/games" className="block">
                                <div className="rounded-2xl border border-border/70 bg-white/70 p-4 transition hover:border-border hover:shadow-sm">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                        <PlayCircle className="h-4 w-4" />
                                        ライブ入力
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        試合中に記録を更新
                                    </div>
                                </div>
                            </Link>
                            <Link href="/dashboard/games" className="block">
                                <div className="rounded-2xl border border-border/70 bg-white/70 p-4 transition hover:border-border hover:shadow-sm">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                        <ClipboardList className="h-4 w-4" />
                                        試合後修正
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        スコアシートで最終確認
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* よく使う画面への導線 */}
            <div className="mb-4 text-sm font-semibold">Quick Actions</div>
            <div className="space-y-4">
                <Link href="/dashboard/games" className="block">
                    <Card className="border border-border/60 transition hover:bg-muted/40">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                <Calendar />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    試合一覧
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    試合作成・ライブ・修正
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/players" className="block">
                    <Card className="border border-border/60 transition hover:bg-muted/40">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                👤
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    選手一覧
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    ロースター管理
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/stats/players" className="block">
                    <Card className="border border-border/60 transition hover:bg-muted/40">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                <BarChart />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    シーズン通算
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    シーズン集計を確認
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>

                {isStaff && (
                    <Link href="/dashboard/audit" className="block">
                        <Card className="border border-border/60 transition hover:bg-muted/40">
                            <CardContent className="flex items-center gap-4 py-5">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                    <ClipboardList />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">
                                        監査ログ
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        変更履歴を確認
                                    </div>
                                </div>
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>

            {isStaff && (
                <Card
                    id="operations"
                    className="mt-6 border border-border/60 bg-muted/20"
                >
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">運用メニュー</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 py-5 sm:grid-cols-3">
                        <Link href="/dashboard/audit" className="block">
                            <div className="rounded-xl border border-border/70 bg-white/80 p-3 text-xs font-medium text-foreground transition hover:border-border">
                                監査ログを確認
                            </div>
                        </Link>
                        <Link href="/dashboard/games" className="block">
                            <div className="rounded-xl border border-border/70 bg-white/80 p-3 text-xs font-medium text-foreground transition hover:border-border">
                                試合の入力漏れを確認
                            </div>
                        </Link>
                        <Link href="/dashboard/operations" className="block">
                            <div className="rounded-xl border border-border/70 bg-white/80 p-3 text-xs font-medium text-foreground transition hover:border-border">
                                週次バックアップ手順
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            )}

            <Card className="mt-6 border border-dashed border-border/70 bg-muted/20">
                <CardContent className="flex gap-2 p-4 text-xs text-muted-foreground">
                    <div className="w-1 bg-muted-foreground/30" />
                    <div>
                        <span className="font-semibold text-foreground">
                            {isStaff ? "Staff Mode" : "Viewer Mode"}
                        </span>
                        <span className="ml-2">
                            {isStaff
                                ? "試合作成、選手管理、スタッツ編集が可能です"
                                : "スタッツの閲覧のみ可能です"}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
