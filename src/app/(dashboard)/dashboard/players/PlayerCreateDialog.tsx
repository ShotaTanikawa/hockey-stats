"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PlayerCreateDialogProps = {
    teamId?: string | null;
    role?: "staff" | "viewer" | null;
};

const POSITION_OPTIONS = ["F", "D", "G"] as const;
type PlayerPosition = (typeof POSITION_OPTIONS)[number];

function mapPlayerSaveError(error: { code?: string; message: string }) {
    if (error.code === "23505" || /duplicate/i.test(error.message)) {
        return "同じ背番号の現役選手がすでに登録されています。";
    }

    if (error.code === "23514") {
        if (error.message.includes("players_number_positive_chk")) {
            return "背番号は1以上で入力してください。";
        }
        if (error.message.includes("players_position_valid_chk")) {
            return "ポジションは F / D / G から選択してください。";
        }
    }

    return error.message;
}

export default function PlayerCreateDialog({
    teamId,
    role,
}: PlayerCreateDialogProps) {
    const router = useRouter();
    // クライアント側の Supabase で players を追加する
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [position, setPosition] = useState<PlayerPosition>("F");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isStaff = role === "staff";

    // 入力内容を初期化する
    function resetForm() {
        setName("");
        setNumber("");
        setPosition("F");
        setErrorMessage(null);
    }

    // 選手追加処理（バリデーションを含む）
    // - staff 権限のみ許可し、viewer はエラー表示
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

        const { data: duplicated, error: duplicateError } = await supabase
            .from("players")
            .select("id")
            .eq("team_id", teamId)
            .eq("number", parsedNumber)
            .eq("is_active", true)
            .limit(1);

        if (duplicateError) {
            setIsSaving(false);
            const message = "背番号の重複チェックに失敗しました。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            return;
        }

        if ((duplicated ?? []).length > 0) {
            setIsSaving(false);
            const message = "同じ背番号の現役選手がすでに登録されています。";
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: message,
            });
            return;
        }

        const { error } = await supabase.from("players").insert({
            team_id: teamId,
            name: name.trim(),
            number: parsedNumber,
            position,
            is_active: true,
        });

        setIsSaving(false);

        if (error) {
            const message = mapPlayerSaveError(error);
            setErrorMessage(message);
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
            return;
        }

        // モーダルを閉じて一覧を更新
        setIsOpen(false);
        resetForm();
        router.refresh();
        toast({ title: "選手を追加しました" });
    }

    return (
        <>
            {/* ダイアログを開くトリガーボタン */}
            <Button
                className="h-10 rounded-xl border border-foreground bg-foreground px-4 text-background hover:bg-foreground/90"
                onClick={() => setIsOpen(true)}
                disabled={!teamId || !isStaff}
            >
                ＋ 選手追加
            </Button>

            {/* 簡易モーダルで入力フォームを表示 */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <Card className="w-full max-w-lg rounded-2xl border border-border/70 shadow-lg">
                        <CardHeader className="border-b border-border/70 px-6 py-4">
                            <div className="text-sm font-semibold">
                                選手追加
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 px-6 py-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="player-name"
                                    className="text-sm"
                                >
                                    選手名
                                </Label>
                                <Input
                                    id="player-name"
                                    type="text"
                                    placeholder="Taro Suzuki"
                                    className="h-11 rounded-xl bg-white/80"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="player-number"
                                    className="text-sm"
                                >
                                    背番号
                                </Label>
                                <Input
                                    id="player-number"
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
                                    htmlFor="player-position"
                                    className="text-sm"
                                >
                                    ポジション
                                </Label>
                                <select
                                    id="player-position"
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
