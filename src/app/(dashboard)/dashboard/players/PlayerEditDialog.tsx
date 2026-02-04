"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { PlayerRow } from "@/lib/types/stats";
import { useToast } from "@/hooks/use-toast";

type PlayerEditDialogProps = {
    role?: "staff" | "viewer" | null;
    player: PlayerRow;
};

const POSITION_OPTIONS = ["F", "D", "G"] as const;
type PlayerPosition = (typeof POSITION_OPTIONS)[number];

export default function PlayerEditDialog({
    role,
    player,
}: PlayerEditDialogProps) {
    const router = useRouter();
    // クライアント側の Supabase で players を更新する
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(player.name);
    const [number, setNumber] = useState(String(player.number));
    const [position, setPosition] = useState<PlayerPosition>(player.position);
    const [isActive, setIsActive] = useState(player.is_active);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isStaff = role === "staff";

    // 入力内容を初期値に戻す
    function resetForm() {
        setName(player.name);
        setNumber(String(player.number));
        setPosition(player.position);
        setIsActive(player.is_active);
        setErrorMessage(null);
    }

    // 選手情報を更新する
    // - is_active を切り替えて除籍/復帰を表現する
    async function handleSubmit() {
        setErrorMessage(null);

        if (!isStaff) {
            const message = "この操作はスタッフのみ可能です。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "権限エラー",
                description: message,
            });
            return;
        }

        if (!name.trim()) {
            const message = "選手名は必須です。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: message,
            });
            return;
        }

        const parsedNumber = Number(number);
        if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
            const message = "背番号は1以上の整数を入力してください。";
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
            .from("players")
            .update({
                name: name.trim(),
                number: parsedNumber,
                position,
                is_active: isActive,
            })
            .eq("id", player.id);

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

        // モーダルを閉じて一覧を更新
        setIsOpen(false);
        resetForm();
        router.refresh();
        toast({ title: "選手情報を更新しました" });
    }

    return (
        <>
            {/* 編集ダイアログを開くボタン */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setIsOpen(true)}
                disabled={!isStaff}
            >
                <Pencil className="h-4 w-4" />
            </Button>

            {/* 簡易モーダルで編集フォームを表示 */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <Card className="w-full max-w-lg rounded-2xl border border-border/70 shadow-lg">
                        <CardHeader className="border-b border-border/70 px-6 py-4">
                            <div className="text-sm font-semibold">
                                選手編集
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 px-6 py-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="edit-player-name"
                                    className="text-sm"
                                >
                                    選手名
                                </Label>
                                <Input
                                    id="edit-player-name"
                                    type="text"
                                    className="h-11 rounded-xl bg-white/80"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="edit-player-number"
                                    className="text-sm"
                                >
                                    背番号
                                </Label>
                                <Input
                                    id="edit-player-number"
                                    type="number"
                                    min={1}
                                    className="h-11 rounded-xl bg-white/80"
                                    value={number}
                                    onChange={(event) =>
                                        setNumber(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="edit-player-position"
                                    className="text-sm"
                                >
                                    ポジション
                                </Label>
                                <select
                                    id="edit-player-position"
                                    className="h-11 w-full rounded-xl border border-border/70 bg-white/80 px-3 text-sm"
                                    value={position}
                                    onChange={(event) =>
                                        setPosition(
                                            event.target.value as PlayerPosition
                                        )
                                    }
                                >
                                    {POSITION_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={isActive}
                                    onChange={(event) =>
                                        setIsActive(event.target.checked)
                                    }
                                />
                                現役として扱う
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
                                    className="h-9 rounded-lg border-border/70"
                                    onClick={() => {
                                        setIsOpen(false);
                                        resetForm();
                                    }}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    type="button"
                                    className="h-9 rounded-lg border border-foreground bg-foreground px-4 text-background hover:bg-foreground/90"
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "保存中..." : "保存"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}
