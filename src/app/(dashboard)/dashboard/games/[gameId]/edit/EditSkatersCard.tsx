"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Skater, SkaterStat } from "@/lib/types/stats";
import EditStatHelp from "./EditStatHelp";

type Props = {
    skaters: Skater[];
    skaterState: Record<string, SkaterStat>;
    emptySkater: SkaterStat;
    canEdit: boolean;
    onChange: (playerId: string, field: keyof SkaterStat, value: string) => void;
};

export default function EditSkatersCard({
    skaters,
    skaterState,
    emptySkater,
    canEdit,
    onChange,
}: Props) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base">Skaters</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="overflow-x-auto">
                    <div className="min-w-[740px]">
                        {/* 見出し行にスタッツの説明ツールチップを表示 */}
                        <div className="grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr] gap-x-4 gap-y-3 text-xs text-gray-500">
                            <div>Name</div>
                            <div>
                                <EditStatHelp label="G" description="Goals（ゴール数）" />
                            </div>
                            <div>
                                <EditStatHelp label="A" description="Assists（アシスト数）" />
                            </div>
                            <div>
                                <EditStatHelp
                                    label="SOG"
                                    description="Shots on Goal（枠内シュート数）"
                                />
                            </div>
                            <div>
                                <EditStatHelp
                                    label="BLK"
                                    description="Blocked Shots（ブロックショット数）"
                                />
                            </div>
                            <div>
                                <EditStatHelp
                                    label="PIM"
                                    description="Penalty Minutes（ペナルティ合計分）"
                                />
                            </div>
                        </div>
                        <div className="mt-3 space-y-3">
                            {skaters.map((player) => {
                                const stat = skaterState[player.id] ?? emptySkater;
                                return (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[140px_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 px-4 py-3 text-sm"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.goals}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "goals",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.assists}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "assists",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.shots}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "shots",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.blocks}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "blocks",
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={stat.pim}
                                            disabled={!canEdit}
                                            onChange={(event) =>
                                                onChange(
                                                    player.id,
                                                    "pim",
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
