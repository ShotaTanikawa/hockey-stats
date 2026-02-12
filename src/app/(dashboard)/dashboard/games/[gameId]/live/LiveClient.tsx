"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
    Goalie,
    GoalieStat,
    GoalieStatRow,
    Skater,
    SkaterStat,
    SkaterStatRow,
} from "@/lib/types/stats";
import { useToast } from "@/hooks/use-toast";
import LiveSkatersCard from "./LiveSkatersCard";
import LiveGoaliesCard from "./LiveGoaliesCard";
import LiveEventLogCard from "./LiveEventLogCard";

type Props = {
    gameId: string;
    opponent: string;
    workflowStatus: "draft" | "in_progress" | "finalized";
    canEdit: boolean;
    skaters: Skater[];
    goalies: Goalie[];
    skaterStats: SkaterStatRow[];
    goalieStats: GoalieStatRow[];
};

const EMPTY_SKATER: SkaterStat = {
    goals: 0,
    assists: 0,
    shots: 0,
    blocks: 0,
    pim: 0,
};

const EMPTY_GOALIE: GoalieStat = {
    shots_against: 0,
    saves: 0,
    goals_against: 0,
};

export default function LiveClient({
    gameId,
    opponent,
    workflowStatus,
    canEdit,
    skaters,
    goalies,
    skaterStats,
    goalieStats,
}: Props) {
    // クライアント側でリアルタイム入力を反映する
    const supabase = createClient();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    // 既存スタッツを初期状態に落とし込む（未登録は0で埋める）
    const initialSkaterState = useMemo(() => {
        const map: Record<string, SkaterStat> = {};
        skaters.forEach((player) => {
            map[player.id] = { ...EMPTY_SKATER };
        });
        skaterStats.forEach((stat) => {
            map[stat.player_id] = {
                goals: stat.goals,
                assists: stat.assists,
                shots: stat.shots,
                blocks: stat.blocks,
                pim: stat.pim,
            };
        });
        return map;
    }, [skaters, skaterStats]);

    // ゴーリーも同様に初期状態を作る
    const initialGoalieState = useMemo(() => {
        const map: Record<string, GoalieStat> = {};
        goalies.forEach((player) => {
            map[player.id] = { ...EMPTY_GOALIE };
        });
        goalieStats.forEach((stat) => {
            map[stat.player_id] = {
                shots_against: stat.shots_against,
                saves: stat.saves,
                goals_against: stat.goals_against,
            };
        });
        return map;
    }, [goalies, goalieStats]);

    const [skaterState, setSkaterState] =
        useState<Record<string, SkaterStat>>(initialSkaterState);
    const [goalieState, setGoalieState] =
        useState<Record<string, GoalieStat>>(initialGoalieState);

    useEffect(() => {
        setSkaterState(initialSkaterState);
    }, [initialSkaterState]);

    useEffect(() => {
        setGoalieState(initialGoalieState);
    }, [initialGoalieState]);

    useEffect(() => {
        if (!canEdit || workflowStatus !== "draft") return;
        void supabase
            .from("games")
            .update({ workflow_status: "in_progress" })
            .eq("id", gameId);
    }, [canEdit, workflowStatus, gameId, supabase]);

    // 直近のイベントを先頭に積む
    function pushLog(message: string) {
        setLog((prev) => [message, ...prev].slice(0, 6));
    }

    // プレイヤーID→表示名のマップを作る
    const playerLabelMap = useMemo(() => {
        const map: Record<string, string> = {};
        skaters.forEach((player) => {
            map[player.id] = `#${player.number} ${player.name}`;
        });
        goalies.forEach((player) => {
            map[player.id] = `#${player.number} ${player.name}`;
        });
        return map;
    }, [skaters, goalies]);

    // ログ用に分かりやすい表示名を返す
    function getPlayerLabel(playerId: string) {
        return playerLabelMap[playerId] ?? `#${playerId}`;
    }

    // スケーターの操作内容を短いラベルに変換
    function formatSkaterLog(field: keyof SkaterStat) {
        switch (field) {
            case "goals":
                return "GOAL";
            case "assists":
                return "ASSIST";
            case "shots":
                return "SHOT";
            case "blocks":
                return "BLOCK";
            case "pim":
                return "PIM";
            default:
                return field;
        }
    }

    // クリックで1加算し、その場でupsertする（オプティミスティック更新）
    async function updateSkater(playerId: string, field: keyof SkaterStat) {
        if (!canEdit) return;
        setError(null);

        const previous = skaterState[playerId] ?? EMPTY_SKATER;
        const next = { ...previous, [field]: previous[field] + 1 };

        setSkaterState((prev) => ({ ...prev, [playerId]: next }));

        const { error } = await supabase.from("player_stats").upsert(
            {
                game_id: gameId,
                player_id: playerId,
                ...next,
            },
            { onConflict: "game_id,player_id" }
        );

        if (error) {
            setSkaterState((prev) => ({ ...prev, [playerId]: previous }));
            const message = "保存に失敗しました。もう一度お試しください。";
            setError(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            return;
        }

        pushLog(`${getPlayerLabel(playerId)} ${formatSkaterLog(field)} +1`);
    }

    // MVPではSA/GAのみ更新し、Savesは試合後に確定する
    async function updateGoalie(
        playerId: string,
        field: "shots_against" | "goals_against"
    ) {
        if (!canEdit) return;
        setError(null);

        const previous = goalieState[playerId] ?? EMPTY_GOALIE;
        const next: GoalieStat = { ...previous };

        if (field === "shots_against") {
            next.shots_against += 1;
        } else {
            next.goals_against += 1;
            // GA は SA の部分集合なので、必要なら SA を自動で合わせる
            next.shots_against = Math.max(next.shots_against, next.goals_against);
        }

        // MVP方針: liveではsavesを更新しない（試合後に確定）
        next.saves = previous.saves;

        setGoalieState((prev) => ({ ...prev, [playerId]: next }));

        const { error } = await supabase.from("goalie_stats").upsert(
            {
                game_id: gameId,
                player_id: playerId,
                ...next,
            },
            { onConflict: "game_id,player_id" }
        );

        if (error) {
            setGoalieState((prev) => ({ ...prev, [playerId]: previous }));
            const message =
                error.code === "23514"
                    ? "SA / GA の整合性に問題があります。もう一度入力してください。"
                    : "保存に失敗しました。もう一度お試しください。";
            setError(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            return;
        }

        pushLog(
            `${getPlayerLabel(playerId)} ${field === "shots_against" ? "SA" : "GA"} +1`
        );
    }

    return (
        <div className="w-full py-4">
            <div className="mb-6">
                <div className="text-lg font-semibold tracking-tight">
                    <span className="font-display">ライブ入力</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    vs {opponent}
                </div>
            </div>

            {/* viewer 向けの説明 */}
            {!canEdit && (
                <div className="mb-6 rounded-2xl border border-dashed border-border/70 px-4 py-3 text-xs text-muted-foreground">
                    viewer 権限のため編集できません
                </div>
            )}

            {/* 保存エラーを表示 */}
            {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <LiveSkatersCard
                        skaters={skaters}
                        skaterState={skaterState}
                        emptySkater={EMPTY_SKATER}
                        canEdit={canEdit}
                        onIncrement={updateSkater}
                    />

                    <LiveGoaliesCard
                        goalies={goalies}
                        goalieState={goalieState}
                        emptyGoalie={EMPTY_GOALIE}
                        canEdit={canEdit}
                        onIncrement={updateGoalie}
                    />
                </div>

                <LiveEventLogCard log={log} />
            </div>
        </div>
    );
}
