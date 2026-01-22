"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

type GameCreateDialogProps = {
    teamId?: string | null;
    seasonLabel?: string | null;
};

type CreateGamePayload = {
    game_date: string;
    opponent: string;
    venue: string | null;
    period_minutes: number;
    has_overtime: boolean;
    team_id: string;
    season: string | null;
};

const PERIOD_MINUTES_OPTIONS = [15, 20] as const;
type PeriodMinutes = (typeof PERIOD_MINUTES_OPTIONS)[number];

export default function GameCreateDialog({
    teamId,
    seasonLabel,
}: GameCreateDialogProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [gameDate, setGameDate] = useState("");
    const [opponent, setOpponent] = useState("");
    const [venue, setVenue] = useState("");
    const [periodMinutes, setPeriodMinutes] = useState<PeriodMinutes>(15);
    const [hasOvertime, setHasOvertime] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 入力内容を初期化する
    function resetForm() {
        setGameDate("");
        setOpponent("");
        setVenue("");
        setPeriodMinutes(15);
        setHasOvertime(false);
        setErrorMessage(null);
    }

    // 試合作成処理（バリデーションを含む）
    async function handleSubmit() {
        setErrorMessage(null);

        if (!teamId) {
            const message = "チーム情報が取得できません。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            return;
        }

        if (!gameDate || !opponent.trim()) {
            const message = "試合日と対戦相手は必須です。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: message,
            });
            return;
        }

        if (!PERIOD_MINUTES_OPTIONS.includes(periodMinutes)) {
            const message = "ピリオド時間は15分または20分のみ対応です。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: message,
            });
            return;
        }

        setIsSaving(true);

        const payload: CreateGamePayload = {
            game_date: gameDate,
            opponent: opponent.trim(),
            venue: venue.trim() ? venue.trim() : null,
            period_minutes: periodMinutes,
            has_overtime: hasOvertime,
            team_id: teamId,
            season: seasonLabel ?? null,
        };

        const { data, error } = await supabase
            .from("games")
            .insert(payload)
            .select("id")
            .maybeSingle();

        setIsSaving(false);

        if (error) {
            setErrorMessage(error.message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: error.message,
            });
            return;
        }

        setIsOpen(false);
        resetForm();
        toast({ title: "試合を作成しました" });

        // 一覧を最新化する
        router.refresh();

        // 作成直後にライブ入力へ移動したい場合は下記を有効化する
        // if (data?.id) {
        //     router.push(`/dashboard/games/${data.id}/live`);
        // }
    }

    return (
        <>
            <Button
                className="h-10 rounded-xl bg-black px-4 text-white hover:bg-black/90"
                onClick={() => setIsOpen(true)}
                disabled={!teamId}
            >
                ＋ 新規作成
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <Card className="w-full max-w-lg rounded-2xl border border-gray-200 shadow-lg">
                        <CardHeader className="border-b border-gray-200 px-6 py-4">
                            <div className="text-sm font-semibold">
                                試合作成
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 px-6 py-5">
                            <div className="space-y-2">
                                <Label htmlFor="game-date" className="text-sm">
                                    試合日
                                </Label>
                                <Input
                                    id="game-date"
                                    type="date"
                                    className="h-11 rounded-xl bg-gray-50"
                                    value={gameDate}
                                    onChange={(event) =>
                                        setGameDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="opponent" className="text-sm">
                                    対戦相手
                                </Label>
                                <Input
                                    id="opponent"
                                    type="text"
                                    placeholder="Tigers"
                                    className="h-11 rounded-xl bg-gray-50"
                                    value={opponent}
                                    onChange={(event) =>
                                        setOpponent(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="venue" className="text-sm">
                                    会場（任意）
                                </Label>
                                <Input
                                    id="venue"
                                    type="text"
                                    placeholder="Tokyo Ice Arena"
                                    className="h-11 rounded-xl bg-gray-50"
                                    value={venue}
                                    onChange={(event) =>
                                        setVenue(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period" className="text-sm">
                                    ピリオド時間
                                </Label>
                                <select
                                    id="period"
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                                    value={periodMinutes}
                                    onChange={(event) =>
                                        setPeriodMinutes(
                                            Number(event.target.value) as PeriodMinutes
                                        )
                                    }
                                >
                                    {PERIOD_MINUTES_OPTIONS.map((minutes) => (
                                        <option key={minutes} value={minutes}>
                                            {minutes} 分
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={hasOvertime}
                                    onChange={(event) =>
                                        setHasOvertime(event.target.checked)
                                    }
                                />
                                延長戦があった
                            </label>

                            {errorMessage && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                    {errorMessage}
                                </div>
                            )}


                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 rounded-lg border-gray-200"
                                    onClick={() => {
                                        setIsOpen(false);
                                        resetForm();
                                    }}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    type="button"
                                    className="h-9 rounded-lg bg-black px-4 text-white hover:bg-black/90"
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "作成中..." : "作成"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
