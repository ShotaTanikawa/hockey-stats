"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Skater, SkaterStat } from "@/lib/types/stats";

type Props = {
    skaters: Skater[];
    skaterState: Record<string, SkaterStat>;
    emptySkater: SkaterStat;
    canEdit: boolean;
    onIncrement: (playerId: string, field: keyof SkaterStat) => void;
};

export default function LiveSkatersCard({
    skaters,
    skaterState,
    emptySkater,
    canEdit,
    onIncrement,
}: Props) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base">Skaters</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* スケーターごとのスタッツ入力 */}
                <div className="space-y-4">
                    {skaters.map((player) => {
                        const stat = skaterState[player.id] ?? emptySkater;
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
                                            onIncrement(player.id, "goals")
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
                                            onIncrement(player.id, "assists")
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
                                            onIncrement(player.id, "shots")
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
                                            onIncrement(player.id, "blocks")
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
                                            onIncrement(player.id, "pim")
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
    );
}
