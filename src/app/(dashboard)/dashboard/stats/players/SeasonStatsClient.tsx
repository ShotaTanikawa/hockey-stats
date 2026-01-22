"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GoalieSummaryRow, SkaterSummaryRow } from "@/lib/types/stats";

type Props = {
    seasonLabel: string;
    seasons: string[];
    skaterRows: SkaterSummaryRow[];
    goalieRows: GoalieSummaryRow[];
};

// ヘッダーに表示するスタッツ定義のツールチップ
// 見出しに「?」を付けて定義を短く表示する
function StatHelp({ label, description }: { label: string; description: string }) {
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

function formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`;
}

// タブ切替とシーズン選択はクライアント側で制御する
// season はクエリパラメータに反映して Server で再集計させる
export default function SeasonStatsClient({
    seasonLabel,
    seasons,
    skaterRows,
    goalieRows,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const seasonOptions = useMemo(() => {
        const list = seasons.length > 0 ? seasons : [seasonLabel];
        return Array.from(new Set([seasonLabel, ...list]));
    }, [seasonLabel, seasons]);

    function handleSeasonChange(nextSeason: string) {
        const params = new URLSearchParams(searchParams?.toString());
        params.set("season", nextSeason);
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold">シーズン通算</div>
                    <div className="mt-1 h-0.5 w-12 rounded-full bg-gray-900" />
                </div>
                <select
                    className="h-9 rounded-lg border-2 border-border bg-white px-3 text-xs text-muted-foreground"
                    value={seasonLabel}
                    onChange={(event) => handleSeasonChange(event.target.value)}
                >
                    {seasonOptions.map((season) => (
                        <option key={season} value={season}>
                            {season}
                        </option>
                    ))}
                </select>
            </div>

            <Card className="mb-6 border-2 border-dashed border-border bg-muted/20">
                <CardContent className="p-4 text-xs text-muted-foreground">
                    ℹ {seasonLabel} の全試合スタッツを集計しています
                </CardContent>
            </Card>

            <Tabs defaultValue="skaters">
                <TabsList>
                    <TabsTrigger value="skaters">Skaters</TabsTrigger>
                    <TabsTrigger value="goalies">Goalies</TabsTrigger>
                </TabsList>

                <TabsContent value="skaters">
                    <Card className="border-2 border-border">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[160px_80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>POS</div>
                                <div>GP</div>
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
                                <div>P</div>
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
                                <div>
                                    <StatHelp
                                        label="SH%"
                                        description="Shooting% = Goals / Shots"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {skaterRows.map((player) => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border-2 border-border px-4 py-3 text-sm sm:grid-cols-[160px_80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr]"
                                    >
                                        <div className="font-semibold text-gray-700">
                                            #{player.number} {player.name}
                                        </div>
                                        <div>{player.position}</div>
                                        <div>{player.gp}</div>
                                        <div>{player.goals}</div>
                                        <div>{player.assists}</div>
                                        <div>{player.goals + player.assists}</div>
                                        <div>{player.shots}</div>
                                        <div>{player.blocks}</div>
                                        <div>{player.pim}</div>
                                        <div>
                                            {player.shots === 0
                                                ? "-"
                                                : formatPercent(
                                                    player.goals / player.shots
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="goalies">
                    <Card className="border-2 border-border">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[160px_1fr_1fr_1fr_1fr_1fr_1fr]">
                                <div>Name</div>
                                <div>GP</div>
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
                                <div>
                                    <StatHelp
                                        label="SV%"
                                        description="Save% = Saves / Shots Against"
                                    />
                                </div>
                                <div>
                                    <StatHelp
                                        label="GAA"
                                        description="Goals Against Average（1試合あたり失点）"
                                    />
                                </div>
                            </div>
                            <div className="mt-3 space-y-3">
                                {goalieRows.map((player) => {
                                    const gaa =
                                        player.gp === 0
                                            ? null
                                            : player.goals_against / player.gp;
                                    return (
                                        <div
                                            key={player.id}
                                            className="grid grid-cols-[160px_1fr] items-center gap-x-4 gap-y-2 rounded-lg border-2 border-border px-4 py-3 text-sm sm:grid-cols-[160px_1fr_1fr_1fr_1fr_1fr_1fr]"
                                        >
                                            <div className="font-semibold text-gray-700">
                                                #{player.number} {player.name}
                                            </div>
                                            <div>{player.gp}</div>
                                            <div>{player.shots_against}</div>
                                            <div>{player.saves}</div>
                                            <div>{player.goals_against}</div>
                                            <div>
                                                {player.shots_against === 0
                                                    ? "-"
                                                    : formatPercent(
                                                        player.saves /
                                                        player.shots_against
                                                    )}
                                            </div>
                                            <div>{gaa === null ? "-" : gaa.toFixed(2)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
