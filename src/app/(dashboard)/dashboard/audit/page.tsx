import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMemberWithTeam } from "@/lib/supabase/queries";
import type { Json } from "../../../../../database.types";

export const dynamic = "force-dynamic";

type AuditLogRow = {
    id: string;
    created_at: string;
    actor_user_id: string | null;
    team_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    before_data: Json | null;
    after_data: Json | null;
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

const ACTION_OPTIONS = ["all", "insert", "update", "delete"] as const;
const ENTITY_OPTIONS = [
    "all",
    "teams",
    "team_members",
    "players",
    "games",
    "player_stats",
    "goalie_stats",
    "invite_codes",
] as const;

function formatJson(data: Json | null) {
    if (data === null || data === undefined) return "-";
    return JSON.stringify(data, null, 2);
}

function getChangedKeys(before: Json | null, after: Json | null) {
    if (!before || !after || typeof before !== "object" || typeof after !== "object") {
        return [] as string[];
    }

    if (Array.isArray(before) || Array.isArray(after)) {
        return [] as string[];
    }

    const beforeObject = before as Record<string, Json>;
    const afterObject = after as Record<string, Json>;
    const keys = Array.from(
        new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)])
    );

    return keys.filter(
        (key) =>
            JSON.stringify(beforeObject[key] ?? null) !==
            JSON.stringify(afterObject[key] ?? null)
    );
}

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        action?: string;
        entity?: string;
        from?: string;
        to?: string;
    }>;
}) {
    const supabase = await createClient();
    const resolvedSearchParams = await searchParams;
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

    const actionFilter =
        resolvedSearchParams?.action &&
        ACTION_OPTIONS.includes(
            resolvedSearchParams.action as (typeof ACTION_OPTIONS)[number]
        )
            ? resolvedSearchParams.action
            : "all";
    const entityFilter =
        resolvedSearchParams?.entity &&
        ENTITY_OPTIONS.includes(
            resolvedSearchParams.entity as (typeof ENTITY_OPTIONS)[number]
        )
            ? resolvedSearchParams.entity
            : "all";
    const fromDate = resolvedSearchParams?.from ?? "";
    const toDate = resolvedSearchParams?.to ?? "";

    let query = supabase
        .from("audit_logs")
        .select(
            "id, created_at, actor_user_id, team_id, action, entity_type, entity_id, before_data, after_data"
        )
        .order("created_at", { ascending: false })
        .limit(200);

    if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
    }

    if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
    }

    if (fromDate) {
        query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    }

    if (toDate) {
        query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    }

    const { data: logs, error } = await query;

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

            <Card className="mb-6 border border-border/60">
                <CardContent className="p-5">
                    <form method="GET" className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="action" className="text-xs">
                                    操作
                                </Label>
                                <select
                                    id="action"
                                    name="action"
                                    defaultValue={actionFilter}
                                    className="h-10 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                >
                                    <option value="all">すべて</option>
                                    <option value="insert">作成</option>
                                    <option value="update">更新</option>
                                    <option value="delete">削除</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="entity" className="text-xs">
                                    対象
                                </Label>
                                <select
                                    id="entity"
                                    name="entity"
                                    defaultValue={entityFilter}
                                    className="h-10 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                >
                                    <option value="all">すべて</option>
                                    <option value="teams">チーム</option>
                                    <option value="team_members">メンバー</option>
                                    <option value="players">選手</option>
                                    <option value="games">試合</option>
                                    <option value="player_stats">
                                        スケータースタッツ
                                    </option>
                                    <option value="goalie_stats">
                                        ゴーリースタッツ
                                    </option>
                                    <option value="invite_codes">招待コード</option>
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
                                    defaultValue={fromDate}
                                    className="h-10 rounded-xl border-2"
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
                                    defaultValue={toDate}
                                    className="h-10 rounded-xl border-2"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                                {rows.length} 件
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
                                    <Link href="/dashboard/audit">リセット</Link>
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
                                        <th className="px-4 py-3 text-left">差分</th>
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
                                        const changedKeys = getChangedKeys(
                                            row.before_data,
                                            row.after_data
                                        );
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
                                                <td className="px-4 py-3 text-xs">
                                                    <details>
                                                        <summary className="cursor-pointer text-muted-foreground">
                                                            {changedKeys.length > 0
                                                                ? `変更: ${changedKeys.slice(0, 3).join(", ")}`
                                                                : "詳細"}
                                                        </summary>
                                                        <div className="mt-2 grid gap-2">
                                                            {row.before_data && (
                                                                <div>
                                                                    <div className="mb-1 text-[11px] text-muted-foreground">
                                                                        Before
                                                                    </div>
                                                                    <pre className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-2 font-mono text-[11px] leading-4">
                                                                        {formatJson(
                                                                            row.before_data
                                                                        )}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {row.after_data && (
                                                                <div>
                                                                    <div className="mb-1 text-[11px] text-muted-foreground">
                                                                        After
                                                                    </div>
                                                                    <pre className="max-h-40 overflow-auto rounded-lg border border-border/60 bg-muted/20 p-2 font-mono text-[11px] leading-4">
                                                                        {formatJson(
                                                                            row.after_data
                                                                        )}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </details>
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
