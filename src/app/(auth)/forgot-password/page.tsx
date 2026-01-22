"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // リセットメール送信（Supabase標準機能）
    // 成否はトーストでフィードバックする
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!email.trim()) {
            toast({
                variant: "destructive",
                title: "入力エラー",
                description: "メールアドレスを入力してください。",
            });
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim()
        );
        setIsSubmitting(false);

        if (error) {
            toast({
                variant: "destructive",
                title: "送信に失敗しました",
                description: error.message,
            });
            return;
        }

        toast({
            title: "メールを送信しました",
            description:
                "パスワードリセット用のメールをご確認ください。",
        });
    }

    return (
        <div className="min-h-screen w-full bg-muted px-4 py-10">
            <div className="mx-auto w-full max-w-md pt-10">
                <Card className="rounded-2xl border-2 border-border shadow-sm">
                    <CardHeader className="space-y-4 border-b-2 border-border p-6">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-border bg-white">
                                <span className="text-lg">🏒</span>
                            </div>
                            <div className="text-xl font-semibold tracking-tight">
                                Hockey Stats
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-base font-semibold">
                                パスワード再設定
                            </div>
                            <div className="text-sm text-gray-500">
                                登録済みのメールアドレスを入力してください
                            </div>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="h-12 rounded-xl border-2"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-black text-white hover:bg-black/90"
                            >
                                {isSubmitting ? "送信中..." : "リセットメール送信"}
                            </Button>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 border-t-2 border-border p-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-white"
                                asChild
                            >
                                <Link href="/login">ログインへ戻る</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
