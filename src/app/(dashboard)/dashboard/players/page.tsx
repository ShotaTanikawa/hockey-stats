import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { PlayerRow } from "@/lib/types/stats";
import { getMemberWithTeam, getPlayersByTeam } from "@/lib/supabase/queries";
import PlayerCreateDialog from "./PlayerCreateDialog";
import PlayerEditDialog from "./PlayerEditDialog";

export const dynamic = "force-dynamic";

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

export default async function DashboardPlayersPage() {
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
    // staffのみ追加・編集を許可
    const isStaff = member?.role === "staff";

    // アクティブな選手を背番号順で取得
    const { data: players } = await getPlayersByTeam(
        supabase,
        team?.id ?? null
    );

    const playerRows = (players ?? []) as PlayerRow[];

    return (
        <div className="mx-auto w-full max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold">選手一覧</div>
                    <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                </div>
                {isStaff && (
                    <PlayerCreateDialog teamId={team?.id} role={member?.role} />
                )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border-2 border-blue-500" />
                    Forward
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border-2 border-green-500" />
                    Defense
                </div>
                <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm border-2 border-orange-500" />
                    Goalie
                </div>
            </div>

            <div className="mb-3 text-xs text-muted-foreground">
                Active Players
            </div>

            <div className="mb-3 hidden items-center px-4 text-xs text-muted-foreground sm:grid sm:grid-cols-[100px_1fr_140px_140px_140px]">
                <div>#</div>
                <div>NAME</div>
                <div>POSITION</div>
                <div>STATUS</div>
                <div className="text-right">ACTIONS</div>
            </div>

            <div className="space-y-4">
                {playerRows.map((player) => {
                    const style = positionStyle[player.position];
                    return (
                        <Card
                            key={player.id}
                            className={`border-2 ${style.border} ${style.bg}`}
                        >
                            <CardContent className="flex flex-col gap-4 p-5 sm:grid sm:grid-cols-[100px_1fr_140px_140px_140px] sm:items-center">
                                <div className="text-sm font-semibold text-gray-700">
                                    #{player.number}
                                </div>
                                <div className="text-sm font-semibold">
                                    {player.name}
                                </div>
                                <div>
                                    <span className="rounded-full border-2 border-border bg-white px-2 py-0.5 text-xs font-semibold text-gray-600">
                                        {style.label}
                                    </span>
                                </div>
                                <div>
                                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                                        Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2">
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
