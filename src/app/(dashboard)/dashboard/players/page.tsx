import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import type { PlayerRow } from "@/lib/types/stats";
import { getMemberWithTeam, getPlayersByTeam } from "@/lib/supabase/queries";
import PlayerCreateDialog from "./PlayerCreateDialog";
import PlayerEditDialog from "./PlayerEditDialog";

export const dynamic = "force-dynamic";

// ポジションごとの色分け定義
const positionStyle: Record<
    PlayerRow["position"],
    { border: string; bg: string; label: string }
> = {
    F: {
        border: "border-blue-500",
        bg: "bg-blue-50",
        label: "F",
    },
    D: {
        border: "border-green-500",
        bg: "bg-green-50",
        label: "D",
    },
    G: {
        border: "border-orange-500",
        bg: "bg-orange-50",
        label: "G",
    },
};

export default async function DashboardPlayersPage({
    searchParams,
}: {
    searchParams?: Promise<{
        q?: string;
        position?: string;
        status?: string;
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
    // staffのみ追加・編集を許可
    const isStaff = member?.role === "staff";

    // アクティブな選手を背番号順で取得
    const { data: players } = await getPlayersByTeam(
        supabase,
        team?.id ?? null,
        { includeInactive: true }
    );

    const playerRows = (players ?? []) as PlayerRow[];
    const searchQuery = resolvedSearchParams?.q?.trim() ?? "";
    const positionFilter = resolvedSearchParams?.position ?? "all";
    const statusFilter = resolvedSearchParams?.status ?? "active";

    const filteredPlayers = playerRows.filter((player) => {
        if (statusFilter === "active" && !player.is_active) return false;
        if (statusFilter === "inactive" && player.is_active) return false;
        if (positionFilter !== "all" && player.position !== positionFilter)
            return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatches = player.name.toLowerCase().includes(query);
            const numberMatches = String(player.number).includes(query);
            if (!nameMatches && !numberMatches) return false;
        }
        return true;
    });

    return (
        <div className="mx-auto w-full max-w-6xl">
            {/* staff のみ選手追加ボタンを表示 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        <span className="font-display">Players</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        登録選手の管理とポジションの確認
                    </div>
                </div>
                {isStaff && (
                    <PlayerCreateDialog teamId={team?.id} role={member?.role} />
                )}
            </div>

            <Card className="mb-6 border border-border/60">
                <CardContent className="space-y-4 p-5">
                    <form method="GET" className="grid gap-4">
                        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-xs">
                                    検索（名前/背番号）
                                </Label>
                                <Input
                                    id="search"
                                    name="q"
                                    placeholder="Suzuki / 24"
                                    className="h-11 rounded-xl border-2"
                                    defaultValue={searchQuery}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position" className="text-xs">
                                    ポジション
                                </Label>
                                <select
                                    id="position"
                                    name="position"
                                    className="h-11 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                    defaultValue={positionFilter}
                                >
                                    <option value="all">すべて</option>
                                    <option value="F">Forward</option>
                                    <option value="D">Defense</option>
                                    <option value="G">Goalie</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs">
                                    ステータス
                                </Label>
                                <select
                                    id="status"
                                    name="status"
                                    className="h-11 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                    defaultValue={statusFilter}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div>{filteredPlayers.length} players</div>
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
                                    <Link href="/dashboard/players">
                                        リセット
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ポジションの凡例 */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-blue-500" />
                    Forward
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-green-500" />
                    Defense
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border border-orange-500" />
                    Goalie
                </div>
            </div>

            <div className="mb-3 text-xs text-muted-foreground">
                Players
            </div>

            {/* PC幅のみテーブル風のヘッダー行を表示 */}
            <div className="mb-3 hidden items-center px-4 text-xs text-muted-foreground sm:grid sm:grid-cols-[100px_1fr_140px_140px_140px]">
                <div>#</div>
                <div>NAME</div>
                <div>POSITION</div>
                <div>STATUS</div>
                <div className="text-right">ACTIONS</div>
            </div>

            <div className="space-y-4">
                {filteredPlayers.length === 0 && (
                    <Card className="border border-dashed border-border/70 bg-muted/20">
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            該当する選手がいません。
                            {isStaff
                                ? " 右上の「選手追加」から登録できます。"
                                : " staff に登録を依頼してください。"}
                        </CardContent>
                    </Card>
                )}
                {filteredPlayers.map((player) => {
                    const style = positionStyle[player.position];
                    return (
                        <Card
                            key={player.id}
                            className={`border ${style.border} ${style.bg} transition hover:-translate-y-0.5 hover:shadow-lg`}
                        >
                            <CardContent className="flex flex-col gap-4 p-5 sm:grid sm:grid-cols-[100px_1fr_140px_140px_140px] sm:items-center">
                                <div className="text-sm font-semibold text-gray-700">
                                    #{player.number}
                                </div>
                                <div className="text-sm font-semibold">
                                    {player.name}
                                </div>
                                <div>
                                    <span className="rounded-full border border-border/70 bg-white/80 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                        {style.label}
                                    </span>
                                </div>
                                <div>
                                    {player.is_active ? (
                                        <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-border/70 bg-white/80 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    {/* staff のみ編集アクションを表示 */}
                                    {isStaff && (
                                        <>
                                            <PlayerEditDialog
                                                role={member?.role}
                                                player={player}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg border-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
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
