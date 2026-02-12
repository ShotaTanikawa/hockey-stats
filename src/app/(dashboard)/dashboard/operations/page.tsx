import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithTeam } from "@/lib/supabase/queries";

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
