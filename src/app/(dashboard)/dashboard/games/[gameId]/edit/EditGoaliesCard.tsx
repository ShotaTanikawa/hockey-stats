"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Goalie, GoalieStat } from "@/lib/types/stats";
import EditStatHelp from "./EditStatHelp";

type GoalieField = "shots_against" | "saves" | "goals_against";

type Props = {
    goalies: Goalie[];
    goalieState: Record<string, GoalieStat>;
    emptyGoalie: GoalieStat;
    canEdit: boolean;
    onChange: (playerId: string, field: GoalieField, value: string) => void;
};

export default function EditGoaliesCard({
    goalies,
    goalieState,
    emptyGoalie,
    canEdit,
    onChange,
}: Props) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base">Goalies</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="overflow-x-auto">
                    <div className="min-w-[620px]">
                        {/* 見出し行にスタッツの説明ツールチップを表示 */}
                        <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-x-4 gap-y-3 text-xs text-gray-500">
                            <div>Name</div>
                            <div>
                                <EditStatHelp
                                    label="SA"
                                    description="Shots Against（被シュート数）"
                                />
                            </div>
                            <div>
                                <EditStatHelp
                                    label="Saves"
                                    description="セーブ数（試合後に確定）"
                                />
                            </div>
                            <div>
                                <EditStatHelp
                                    label="GA"
                                    description="Goals Against（失点数）"
                                />
                            </div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {goalies.map((player) => {
                                const stat = goalieState[player.id] ?? emptyGoalie;
                                return (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.shots_against}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "shots_against",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.saves}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "saves",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.goals_against}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "goals_against",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
