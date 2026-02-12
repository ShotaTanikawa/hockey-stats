import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMemberWithTeam } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type AuditLogRow = {
    id: string;
    created_at: string;
    actor_user_id: string | null;
    team_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
};

const ACTION_LABEL: Record<string, string> = {
    insert: "作成",
    update: "更新",
    delete: "削除",
};

const ENTITY_LABEL: Record<string, string> = {
    teams: "チーム",
    team_members: "メンバー",
    players: "選手",
    games: "試合",
    player_stats: "スケータースタッツ",
    goalie_stats: "ゴーリースタッツ",
    invite_codes: "招待コード",
};

export default async function AuditLogsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await getMemberWithTeam(supabase, user.id);
    const roleLabel = member?.role ?? "viewer";
    const isStaff = roleLabel === "staff";

    if (!isStaff) {
        return (
            <div className="mx-auto w-full max-w-4xl">
                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">
                            監査ログ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 text-sm text-muted-foreground">
                        このページは staff のみ閲覧できます。
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, actor_user_id, team_id, action, entity_type, entity_id")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        return (
            <div className="mx-auto w-full max-w-4xl">
                <Card className="border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="text-base">
                            監査ログ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-8 text-sm text-red-600">
                        監査ログの取得に失敗しました。
                    </CardContent>
                </Card>
            </div>
        );
    }

    const rows = (logs ?? []) as AuditLogRow[];

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6">
                <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    <span className="font-display">Audit Logs</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                    直近の操作履歴を最大100件まで表示しています。
                </div>
            </div>

            <Card className="border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">監査ログ</CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                    {rows.length === 0 ? (
                        <div className="py-8 text-sm text-muted-foreground">
                            まだログがありません。
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left">日時</th>
                                        <th className="px-4 py-3 text-left">操作</th>
                                        <th className="px-4 py-3 text-left">対象</th>
                                        <th className="px-4 py-3 text-left">ID</th>
                                        <th className="px-4 py-3 text-left">実行者</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const actionLabel =
                                            ACTION_LABEL[row.action] ??
                                            row.action;
                                        const entityLabel =
                                            ENTITY_LABEL[row.entity_type] ??
                                            row.entity_type;
                                        return (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border/40"
                                            >
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(
                                                        row.created_at
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-foreground">
                                                    {actionLabel}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {entityLabel}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {row.entity_id ?? "-"}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">
                                                    {row.actor_user_id ?? "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
