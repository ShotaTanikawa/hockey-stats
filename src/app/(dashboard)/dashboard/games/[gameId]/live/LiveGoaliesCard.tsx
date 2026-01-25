"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Goalie, GoalieStat } from "@/lib/types/stats";

type Props = {
    goalies: Goalie[];
    goalieState: Record<string, GoalieStat>;
    emptyGoalie: GoalieStat;
    canEdit: boolean;
    onIncrement: (playerId: string, field: "shots_against" | "goals_against") => void;
};

export default function LiveGoaliesCard({
    goalies,
    goalieState,
    emptyGoalie,
    canEdit,
    onIncrement,
}: Props) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base">Goalies</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* ゴーリーのライブ入力（SA/GAのみ） */}
                <div className="space-y-4">
                    {goalies.map((player) => {
                        const stat = goalieState[player.id] ?? emptyGoalie;
                        return (
                            <div
                                key={player.id}
                                className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="text-sm font-semibold text-gray-700">
                                    #{player.number} {player.name}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                    <span>SA {stat.shots_against}</span>
                                    <span>GA {stat.goals_against}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg px-2"
                                        disabled={!canEdit}
                                        onClick={() =>
                                            onIncrement(player.id, "shots_against")
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
                                            onIncrement(player.id, "goals_against")
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
    );
}
