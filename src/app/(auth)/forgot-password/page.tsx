"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
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
    // - 送信結果はトーストで通知する
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
            description: "パスワードリセット用のメールをご確認ください。",
        });
    }

    return (
        <div className="min-h-screen w-full px-4 py-12">
            <div className="mx-auto grid w-full max-w-4xl items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
                <div className="flex flex-col justify-center rounded-3xl border border-border/60 bg-white/70 p-8 shadow-xl backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Account Recovery
                    </div>
                    <div className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                        <span className="font-display">Reset</span> your access
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        登録済みのメールアドレスにリセット用リンクを送信します。
                        新しいパスワードで安全に再ログインできます。
                    </p>
                </div>

                <Card className="w-full rounded-3xl border border-border/60 shadow-xl">
                    <CardHeader className="space-y-4 border-b border-border/60 p-6">
                        <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                <span className="text-lg">🏒</span>
                            </div>
                            <div className="text-xl font-semibold tracking-tight">
                                Hockey Stats
                            </div>
                        </div>
                        <div className="space-y-1">
                        <h1 className="text-base font-semibold">
                            パスワード再設定
                        </h1>
                            <div className="text-sm text-muted-foreground">
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-xl border-2"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 w-full rounded-xl border border-foreground bg-foreground text-background hover:bg-foreground/90"
                            >
                                {isSubmitting
                                    ? "送信中..."
                                    : "リセットメール送信"}
                            </Button>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 border-t border-border/60 p-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border border-foreground bg-white"
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
