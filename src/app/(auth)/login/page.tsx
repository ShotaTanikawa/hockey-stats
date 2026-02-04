"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const router = useRouter();
    // ブラウザ側で利用するSupabaseクライアント
    // - Authのサインイン/セッション管理に使う
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // フォーム送信を一箇所で扱う（Enter送信も対応）
    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        // エラーをリセットして送信中状態にする
        setError(null);
        setLoading(true);

        // Supabaseのメール/パスワード認証
        // - エラーは画面内に表示して再入力を促す
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            // 認証失敗時はエラー表示
            setError(error.message);
            return;
        }

        // 認証成功後は保護ページへ遷移
        // - Server Componentの再評価のためrefreshも実行
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="min-h-screen w-full px-4 py-12">
            <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div className="flex flex-col justify-center rounded-3xl border border-border/60 bg-white/70 p-8 shadow-xl backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Game Day Operations
                    </div>
                    <div className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                        <span className="font-display">Hockey</span> Stats
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        試合中の入力とシーズン通算を一つの画面で。スタッフの
                        記録負荷を減らし、選手が自分の成績をすぐ確認できる
                        運用を支えます。
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Live input
                        </div>
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Post-game edit
                        </div>
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Season stats
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <Card className="w-full rounded-3xl border border-border/60 shadow-xl">
                        <CardHeader className="space-y-3 border-b border-border/60 p-6">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                    <span className="text-lg">🏒</span>
                                </div>
                                <div className="text-xl font-semibold tracking-tight">
                                    Welcome back
                                </div>
                            </div>

                            <div className="space-y-1">
                            <h1 className="text-base font-semibold">
                                ログイン
                            </h1>
                                <div className="text-sm text-muted-foreground">
                                    アカウント情報を入力してください
                                </div>
                            </div>
                        </CardHeader>

                        <form onSubmit={onSubmit}>
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

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm"
                                    >
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="h-12 rounded-xl border-2"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-12 w-full rounded-xl border border-foreground bg-foreground text-background hover:bg-foreground/90"
                                >
                                    {loading ? "ログイン中..." : "ログイン"}
                                </Button>
                                {error && (
                                    <p className="text-sm text-red-600">
                                        {error}
                                    </p>
                                )}

                                <Link
                                    href="/forgot-password"
                                    className="text-left text-sm text-muted-foreground hover:text-foreground"
                                >
                                    パスワードをお忘れですか？
                                </Link>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 border-t border-border/60 p-6">
                                <div className="text-sm text-muted-foreground">
                                    アカウントをお持ちでないですか？
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 w-full rounded-xl border border-foreground bg-white"
                                    asChild
                                >
                                    <Link href="/signup">サインアップ</Link>
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
