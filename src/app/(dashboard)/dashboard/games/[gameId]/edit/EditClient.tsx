"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
    Goalie,
    GoalieStat,
    GoalieStatRow,
    Skater,
    SkaterStat,
    SkaterStatRow,
} from "@/lib/types/stats";
import { useToast } from "@/hooks/use-toast";

type Props = {
    gameId: string;
    opponent: string;
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

// テーブル見出しにスタッツ定義を表示するツールチップ
function StatHelp({
    label,
    description,
}: {
    label: string;
    description: string;
}) {
    return (
        <span className="inline-flex items-center gap-1">
            {label}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="grid h-4 w-4 place-items-center rounded-full border border-border text-[10px] text-muted-foreground"
                        aria-label={`${label} の定義`}
                    >
                        ?
                    </button>
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
            </Tooltip>
        </span>
    );
}

// フォーム入力を安全な整数に丸める（負数は0扱い）
function toNumber(value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
}

export default function EditClient({
    gameId,
    opponent,
    canEdit,
    skaters,
    goalies,
    skaterStats,
    goalieStats,
}: Props) {
    const supabase = createClient();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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

    // すべての選手分をまとめて upsert し、試合後の最終値として保存する
    async function handleSave() {
        if (!canEdit) return;
        setError(null);
        setSaving(true);

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
            const message = "ゴーリースタッツの保存に失敗しました。";
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

    return (
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold">試合後修正</div>
                    <div className="text-xs text-gray-500">vs {opponent}</div>
                </div>
                {canEdit && (
                    <Button
                        className="h-9 rounded-lg bg-black px-4 text-white hover:bg-black/90"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "保存中..." : "保存する"}
                    </Button>
                )}
            </div>

            {!canEdit && (
                <div className="mb-6 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-500">
                    viewer 権限のため編集できません
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-base">Skaters</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]">
                            <div>Name</div>
                            <div>
                                <StatHelp
                                    label="G"
                                    description="Goals（ゴール数）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="A"
                                    description="Assists（アシスト数）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="SOG"
                                    description="Shots on Goal（枠内シュート数）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="BLK"
                                    description="Blocked Shots（ブロックショット数）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="PIM"
                                    description="Penalty Minutes（ペナルティ合計分）"
                                />
                            </div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {skaters.map((player) => {
                                const stat =
                                    skaterState[player.id] ?? EMPTY_SKATER;
                                return (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.goals}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setSkaterState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        goals: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.assists}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setSkaterState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        assists: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.shots}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setSkaterState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        shots: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.blocks}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setSkaterState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        blocks: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.pim}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setSkaterState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        pim: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-base">Goalies</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-xs text-gray-500 sm:grid-cols-[140px_1fr_1fr_1fr]">
                            <div>Name</div>
                            <div>
                                <StatHelp
                                    label="SA"
                                    description="Shots Against（被シュート数）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="Saves"
                                    description="セーブ数（試合後に確定）"
                                />
                            </div>
                            <div>
                                <StatHelp
                                    label="GA"
                                    description="Goals Against（失点数）"
                                />
                            </div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {goalies.map((player) => {
                                const stat =
                                    goalieState[player.id] ?? EMPTY_GOALIE;
                                return (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.shots_against}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setGoalieState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        shots_against: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.saves}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setGoalieState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        saves: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.goals_against}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                setGoalieState((prev) => ({
                                                    ...prev,
                                                    [player.id]: {
                                                        ...stat,
                                                        goals_against: toNumber(
                                                            e.target.value
                                                        ),
                                                    },
                                                }))
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
