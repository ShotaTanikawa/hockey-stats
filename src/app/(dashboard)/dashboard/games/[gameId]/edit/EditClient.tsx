"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type {
    Goalie,
    GoalieStat,
    GoalieStatRow,
    Skater,
    SkaterStat,
    SkaterStatRow,
} from "@/lib/types/stats";
import { useToast } from "@/hooks/use-toast";
import EditSkatersCard from "./EditSkatersCard";
import EditGoaliesCard from "./EditGoaliesCard";

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

// フォーム入力を安全な整数に丸める（負数は0扱い）
function toNumber(value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
}

function validateGoalieState(
    goalies: Goalie[],
    goalieState: Record<string, GoalieStat>
) {
    for (const goalie of goalies) {
        const row = goalieState[goalie.id] ?? EMPTY_GOALIE;
        const label = `#${goalie.number} ${goalie.name}`;

        if (row.goals_against > row.shots_against) {
            return `${label}: GA は SA を超えられません。`;
        }

        if (row.saves > row.shots_against) {
            return `${label}: Saves は SA を超えられません。`;
        }

        if (row.saves + row.goals_against > row.shots_against) {
            return `${label}: Saves + GA は SA 以下にしてください。`;
        }
    }

    return null;
}

export default function EditClient({
    gameId,
    opponent,
    workflowStatus,
    canEdit,
    skaters,
    goalies,
    skaterStats,
    goalieStats,
}: Props) {
    // クライアント側で試合後の最終スタッツを保存する
    const supabase = createClient();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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

    // すべての選手分をまとめて upsert し、試合後の最終値として保存する
    async function handleSave() {
        if (!canEdit) return;
        setError(null);

        const goalieValidationError = validateGoalieState(goalies, goalieState);
        if (goalieValidationError) {
            setError(goalieValidationError);
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: goalieValidationError,
            });
            return;
        }

        setSaving(true);

        // スケーター / ゴーリーそれぞれの payload を作る
        const skaterPayload = skaters.map((player) => ({
            game_id: gameId,
            player_id: player.id,
            ...skaterState[player.id],
        }));

        const goaliePayload = goalies.map((player) => ({
            game_id: gameId,
            player_id: player.id,
            ...goalieState[player.id],
        }));

        const { error: skaterError } = await supabase
            .from("player_stats")
            .upsert(skaterPayload, { onConflict: "game_id,player_id" });

        if (skaterError) {
            const message = "スケータースタッツの保存に失敗しました。";
            setError(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            setSaving(false);
            return;
        }

        const { error: goalieError } = await supabase
            .from("goalie_stats")
            .upsert(goaliePayload, { onConflict: "game_id,player_id" });

        if (goalieError) {
            const message =
                goalieError.code === "23514"
                    ? "ゴーリー値の整合性エラーです（SA / Saves / GA の関係を確認してください）。"
                    : "ゴーリースタッツの保存に失敗しました。";
            setError(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            setSaving(false);
            return;
        }

        setSaving(false);
        toast({ title: "スタッツを保存しました" });
    }

    // 数値入力を state に反映（負数は0に丸める）
    function handleSkaterChange(
        playerId: string,
        field: keyof SkaterStat,
        value: string
    ) {
        const nextValue = toNumber(value);
        setSkaterState((prev) => {
            const current = prev[playerId] ?? EMPTY_SKATER;
            return {
                ...prev,
                [playerId]: {
                    ...current,
                    [field]: nextValue,
                },
            };
        });
    }

    function handleGoalieChange(
        playerId: string,
        field: "shots_against" | "saves" | "goals_against",
        value: string
    ) {
        const nextValue = toNumber(value);
        setGoalieState((prev) => {
            const current = prev[playerId] ?? EMPTY_GOALIE;
            return {
                ...prev,
                [playerId]: {
                    ...current,
                    [field]: nextValue,
                },
            };
        });
    }

    return (
        <div className="w-full py-4">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-lg font-semibold tracking-tight">
                        <span className="font-display">試合後修正</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        vs {opponent}
                    </div>
                </div>
                {canEdit && (
                    <Button
                        className="h-9 rounded-lg border border-foreground bg-foreground px-4 text-background hover:bg-foreground/90"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "保存中..." : "保存する"}
                    </Button>
                )}
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

            <div className="grid gap-6">
                <EditSkatersCard
                    skaters={skaters}
                    skaterState={skaterState}
                    emptySkater={EMPTY_SKATER}
                    canEdit={canEdit}
                    onChange={handleSkaterChange}
                />
                <EditGoaliesCard
                    goalies={goalies}
                    goalieState={goalieState}
                    emptyGoalie={EMPTY_GOALIE}
                    canEdit={canEdit}
                    onChange={handleGoalieChange}
                />
            </div>
        </div>
    );
}
