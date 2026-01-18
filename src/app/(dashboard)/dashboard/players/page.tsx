import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus } from "lucide-react";
import type { PlayerRow } from "@/lib/types/stats";

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
    const { data: member } = await supabase
        .from("team_members")
        .select("teams (id, name, season_label)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    const team = member?.teams?.[0];
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";

    // アクティブな選手を背番号順で取得
    const { data: players } = await supabase
        .from("players")
        .select("id, name, number, position, is_active")
        .eq("is_active", true)
        .order("number", { ascending: true });

    const playerRows = (players ?? []) as PlayerRow[];

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
                        <div className="text-sm font-semibold">選手一覧</div>
                        <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                    </div>
                    <Button className="h-10 rounded-xl bg-black px-4 text-white hover:bg-black/90">
                        ＋ 選手追加
                    </Button>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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

                <div className="mb-3 text-xs text-gray-500">Active Players</div>

                <div className="mb-3 hidden items-center px-4 text-xs text-gray-400 sm:grid sm:grid-cols-[100px_1fr_140px_140px_140px]">
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
                                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-600">
                                            {style.label}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
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
