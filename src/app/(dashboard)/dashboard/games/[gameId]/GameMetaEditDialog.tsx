"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { GameRow } from "@/lib/types/stats";

type Props = {
    game: GameRow;
    canEdit: boolean;
    isLocked: boolean;
};

const PERIOD_MINUTES_OPTIONS = [15, 20] as const;
type PeriodMinutes = (typeof PERIOD_MINUTES_OPTIONS)[number];

export default function GameMetaEditDialog({ game, canEdit, isLocked }: Props) {
    const router = useRouter();
    // クライアント側の Supabase で games を更新/削除する
    const supabase = createClient();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [gameDate, setGameDate] = useState(game.game_date);
    const [opponent, setOpponent] = useState(game.opponent);
    const [venue, setVenue] = useState(game.venue ?? "");
    const [periodMinutes, setPeriodMinutes] = useState<PeriodMinutes>(
        (game.period_minutes as PeriodMinutes) ?? 15
    );
    const [hasOvertime, setHasOvertime] = useState(game.has_overtime);
    const [season, setSeason] = useState(game.season ?? "");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    function openDialog() {
        setGameDate(game.game_date);
        setOpponent(game.opponent);
        setVenue(game.venue ?? "");
        setPeriodMinutes((game.period_minutes as PeriodMinutes) ?? 15);
        setHasOvertime(game.has_overtime);
        setSeason(game.season ?? "");
        setErrorMessage(null);
        setIsOpen(true);
    }

    // メタ情報の更新
    async function handleSave() {
        if (!canEdit) return;
        setErrorMessage(null);

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

        const { error } = await supabase
            .from("games")
            .update({
                game_date: gameDate,
                opponent: opponent.trim(),
                venue: venue.trim() ? venue.trim() : null,
                period_minutes: periodMinutes,
                has_overtime: hasOvertime,
                season: season.trim() ? season.trim() : null,
            })
            .eq("id", game.id);

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

        // モーダルを閉じて一覧を最新化
        setIsOpen(false);
        toast({ title: "試合情報を更新しました" });
        router.refresh();
    }

    // 試合削除（関連スタッツも消えるため確認あり）
    async function handleDelete() {
        if (!canEdit) return;
        const confirmed = window.confirm(
            "この試合を削除しますか？関連スタッツも削除されます。"
        );
        if (!confirmed) return;

        setIsSaving(true);
        const { error } = await supabase
            .from("games")
            .delete()
            .eq("id", game.id);
        setIsSaving(false);

        if (error) {
            setErrorMessage(error.message);
            toast({
                variant: "destructive",
                title: "削除エラー",
                description: error.message,
            });
            return;
        }

        toast({ title: "試合を削除しました" });
        router.push("/dashboard/games");
        router.refresh();
    }

    return (
        <>
            {/* 試合メタ情報編集ボタン */}
            <Button
                variant="outline"
                size="sm"
                className="border border-border/70"
                onClick={openDialog}
                disabled={!canEdit || isLocked}
                title={isLocked ? "確定済みのため編集できません" : undefined}
            >
                試合編集
            </Button>

            {/* 簡易モーダルで編集フォームを表示 */}
            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/45 p-4 sm:p-6">
                        <div className="mx-auto w-full max-w-lg py-6">
                            <Card className="w-full rounded-2xl border border-border/70 shadow-xl">
                                <CardHeader className="border-b border-border/70 px-6 py-4">
                                    <div className="text-sm font-semibold">
                                        試合編集
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 px-6 py-5">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="edit-game-date"
                                            className="text-sm"
                                        >
                                            試合日
                                        </Label>
                                        <Input
                                            id="edit-game-date"
                                            type="date"
                                            className="h-11 rounded-xl bg-white/80"
                                            value={gameDate}
                                            onChange={(event) =>
                                                setGameDate(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="edit-opponent"
                                            className="text-sm"
                                        >
                                            対戦相手
                                        </Label>
                                        <Input
                                            id="edit-opponent"
                                            type="text"
                                            className="h-11 rounded-xl bg-white/80"
                                            value={opponent}
                                            onChange={(event) =>
                                                setOpponent(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="edit-venue"
                                            className="text-sm"
                                        >
                                            会場（任意）
                                        </Label>
                                        <Input
                                            id="edit-venue"
                                            type="text"
                                            className="h-11 rounded-xl bg-white/80"
                                            value={venue}
                                            onChange={(event) =>
                                                setVenue(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="edit-season"
                                            className="text-sm"
                                        >
                                            シーズン
                                        </Label>
                                        <Input
                                            id="edit-season"
                                            type="text"
                                            className="h-11 rounded-xl bg-white/80"
                                            value={season}
                                            onChange={(event) =>
                                                setSeason(event.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="edit-period"
                                            className="text-sm"
                                        >
                                            ピリオド時間
                                        </Label>
                                        <select
                                            id="edit-period"
                                            className="h-11 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                            value={periodMinutes}
                                            onChange={(event) =>
                                                setPeriodMinutes(
                                                    Number(
                                                        event.target.value
                                                    ) as PeriodMinutes
                                                )
                                            }
                                        >
                                            {PERIOD_MINUTES_OPTIONS.map(
                                                (minutes) => (
                                                    <option
                                                        key={minutes}
                                                        value={minutes}
                                                    >
                                                        {minutes} 分
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300"
                                            checked={hasOvertime}
                                            onChange={(event) =>
                                                setHasOvertime(
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        延長戦（OT/SO）あり
                                    </label>

                                    {errorMessage && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 rounded-lg border-border/70"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            キャンセル
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={handleDelete}
                                            disabled={isSaving}
                                        >
                                            削除
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-9 rounded-lg border border-foreground bg-foreground px-4 text-background hover:bg-foreground/90"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? "保存中..." : "保存する"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
