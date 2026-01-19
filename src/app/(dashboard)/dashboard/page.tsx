import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart } from "lucide-react";
import { getMemberWithTeam } from "@/lib/supabase/queries";

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
    const { data: member } = await getMemberWithTeam(supabase, user.id);

    const team = member?.teams?.[0];
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";
    const roleLabel = member?.role ?? "viewer";
    const isStaff = roleLabel === "staff";

    return (
        <main className="min-h-svh bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-500">
                        アイスホッケースタッツ管理アプリ
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        ☰
                    </Button>
                </div>
            </div>

            <div className="mx-auto w-full max-w-3xl px-6 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 bg-white">
                        <span>🏒</span>
                    </div>
                    <div>
                        <div className="text-base font-semibold">
                            {teamName}
                        </div>
                        <div className="text-sm text-gray-500">
                            {seasonLabel}
                        </div>
                    </div>
                </div>

                <div className="mb-8 flex items-center gap-3">
                    <div className="text-sm font-semibold">Dashboard</div>
                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {roleLabel.toUpperCase()}
                    </span>
                </div>

                <Card className="mb-8 border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-base">
                            Team Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 py-6 sm:grid-cols-2">
                        <div>
                            <div className="text-xs text-gray-500">Team</div>
                            <div className="text-sm font-semibold">
                                {teamName}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Season</div>
                            <div className="text-sm font-semibold">
                                {seasonLabel}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-sm font-semibold">
                                {user.email}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Role</div>
                            <div className="text-sm font-semibold">
                                {roleLabel}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mb-4 text-sm font-semibold">Quick Actions</div>
                <div className="space-y-4">
                    <Link href="/dashboard/games" className="block">
                        <Card className="border-gray-200 transition hover:border-gray-300">
                            <CardContent className="flex items-center gap-4 py-5">
                                <div className="grid h-12 w-12 place-items-center rounded-lg border border-gray-200 bg-white">
                                    <Calendar />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">
                                        試合一覧
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        View and manage games
                                    </div>
                                </div>
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/players" className="block">
                        <Card className="border-gray-200 transition hover:border-gray-300">
                            <CardContent className="flex items-center gap-4 py-5">
                                <div className="grid h-12 w-12 place-items-center rounded-lg border border-gray-200 bg-white">
                                    👤
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">
                                        選手一覧
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        View and manage players
                                    </div>
                                </div>
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/stats/players" className="block">
                        <Card className="border-gray-200 transition hover:border-gray-300">
                            <CardContent className="flex items-center gap-4 py-5">
                                <div className="grid h-12 w-12 place-items-center rounded-lg border border-gray-200 bg-white">
                                    <BarChart />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">
                                        シーズン通算
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Season statistics
                                    </div>
                                </div>
                                <div className="text-gray-400">→</div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="mt-6 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                        {isStaff ? "Staff Mode" : "Viewer Mode"}
                    </span>
                    <span className="ml-2">
                        {isStaff
                            ? "試合作成、選手管理、スタッツ編集が可能です"
                            : "スタッツの閲覧のみ可能です"}
                    </span>
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
