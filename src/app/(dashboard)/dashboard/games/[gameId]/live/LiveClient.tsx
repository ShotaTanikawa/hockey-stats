"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
    Goalie,
    GoalieStat,
    GoalieStatRow,
    Skater,
    SkaterStat,
    SkaterStatRow,
} from "@/lib/types/stats";



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

export default function LiveClient({
    gameId,
    opponent,
    canEdit,
    skaters,
    goalies,
    skaterStats,
    goalieStats,
}: Props) {
    const supabase = createClient();
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

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

    function pushLog(message: string) {
        setLog((prev) => [message, ...prev].slice(0, 6));
    }

    async function updateSkater(
        playerId: string,
        field: keyof SkaterStat
    ) {
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
            setError("保存に失敗しました。もう一度お試しください。");
            return;
        }

        pushLog(`#${playerId} ${field.toUpperCase()} +1`);
    }

    async function updateGoalie(
        playerId: string,
        field: "shots_against" | "goals_against"
    ) {
        if (!canEdit) return;
        setError(null);

        const previous = goalieState[playerId] ?? EMPTY_GOALIE;
        const next: GoalieStat = {
            ...previous,
            shots_against:
                previous.shots_against + (field === "shots_against" ? 1 : 1),
            goals_against:
                previous.goals_against + (field === "goals_against" ? 1 : 0),
            saves:
                previous.saves + (field === "shots_against" ? 1 : 0),
        };

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
            setError("保存に失敗しました。もう一度お試しください。");
            return;
        }

        pushLog(
            `#${playerId} ${field === "shots_against" ? "SA" : "GA"} +1`
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="mb-6">
                <div className="text-sm font-semibold">ライブ入力</div>
                <div className="text-xs text-gray-500">
                    vs {opponent}
                </div>
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

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-base">
                                Skaters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {skaters.map((player) => {
                                    const stat =
                                        skaterState[player.id] ??
                                        EMPTY_SKATER;
                                    return (
                                        <div
                                            key={player.id}
                                            className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="text-sm font-semibold text-gray-700">
                                                #{player.number} {player.name}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                <span>G {stat.goals}</span>
                                                <span>A {stat.assists}</span>
                                                <span>S {stat.shots}</span>
                                                <span>BLK {stat.blocks}</span>
                                                <span>PIM {stat.pim}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateSkater(
                                                            player.id,
                                                            "goals"
                                                        )
                                                    }
                                                >
                                                    G＋
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateSkater(
                                                            player.id,
                                                            "assists"
                                                        )
                                                    }
                                                >
                                                    A＋
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateSkater(
                                                            player.id,
                                                            "shots"
                                                        )
                                                    }
                                                >
                                                    SOG＋
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateSkater(
                                                            player.id,
                                                            "blocks"
                                                        )
                                                    }
                                                >
                                                    BLK＋
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateSkater(
                                                            player.id,
                                                            "pim"
                                                        )
                                                    }
                                                >
                                                    PIM＋
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <CardTitle className="text-base">
                                Goalies
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {goalies.map((player) => {
                                    const stat =
                                        goalieState[player.id] ??
                                        EMPTY_GOALIE;
                                    return (
                                        <div
                                            key={player.id}
                                            className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="text-sm font-semibold text-gray-700">
                                                #{player.number} {player.name}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                <span>
                                                    SA {stat.shots_against}
                                                </span>
                                                <span>SV {stat.saves}</span>
                                                <span>
                                                    GA {stat.goals_against}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateGoalie(
                                                            player.id,
                                                            "shots_against"
                                                        )
                                                    }
                                                >
                                                    SA＋
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg px-2"
                                                    disabled={!canEdit}
                                                    onClick={() =>
                                                        updateGoalie(
                                                            player.id,
                                                            "goals_against"
                                                        )
                                                    }
                                                >
                                                    GA＋
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-base">
                            Event Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {log.length === 0 ? (
                            <div className="text-xs text-gray-500">
                                直近の操作が表示されます
                            </div>
                        ) : (
                            <div className="space-y-2 text-xs text-gray-600">
                                {log.map((item, index) => (
                                    <div key={`${item}-${index}`}>{item}</div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
