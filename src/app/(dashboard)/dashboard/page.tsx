import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart } from "lucide-react";
import { getMemberWithTeam } from "@/lib/supabase/queries";
import TeamMembersCard from "./TeamMembersCard";

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

    return (
        <div className="mx-auto w-full max-w-2xl">
            {/* 役割チップ付きのダッシュボード見出し */}
            <div className="mb-4 flex items-center gap-3">
                <div className="text-lg font-semibold">Dashboard</div>
                <span
                    className={`rounded-full border-2 px-2 py-0.5 text-xs font-semibold ${
                        isStaff
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground"
                    }`}
                >
                    {roleLabel.toUpperCase()}
                </span>
            </div>
            <div className="mb-8 h-1 w-16 bg-foreground" />

            <Card className="mb-8 border-2 border-border">
                <CardHeader className="border-b-2 border-border">
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

            {/* よく使う画面への導線 */}
            <div className="mb-4 text-sm font-semibold">Quick Actions</div>
            <div className="space-y-4">
                <Link href="/dashboard/games" className="block">
                    <Card className="border-2 border-border transition hover:bg-muted/50">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-lg border-2 border-foreground bg-white">
                                <Calendar />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    試合一覧
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    View and manage games
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/players" className="block">
                    <Card className="border-2 border-border transition hover:bg-muted/50">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-lg border-2 border-foreground bg-white">
                                👤
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    選手一覧
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    View and manage players
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/stats/players" className="block">
                    <Card className="border-2 border-border transition hover:bg-muted/50">
                        <CardContent className="flex items-center gap-4 py-5">
                            <div className="grid h-12 w-12 place-items-center rounded-lg border-2 border-foreground bg-white">
                                <BarChart />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">
                                    シーズン通算
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Season statistics
                                </div>
                            </div>
                            <div className="text-gray-400">→</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Card className="mt-6 border-2 border-dashed border-border bg-muted/20">
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
