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
        router.push("/dashboard");
        router.refresh();
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
                                ログイン
                            </div>
                            <div className="text-sm text-gray-500">
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-xl border-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm">
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
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-black text-white hover:bg-black/90"
                            >
                                {loading ? "ログイン中..." : "ログイン"}
                            </Button>
                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}

                            <Link
                                href="/forgot-password"
                                className="text-left text-sm text-muted-foreground hover:text-foreground"
                            >
                                パスワードをお忘れですか？
                            </Link>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t-2 border-border p-6">
                            <div className="text-sm text-muted-foreground">
                                アカウントをお持ちでないですか？
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-white"
                                asChild
                            >
                                <Link href="/signup">サインアップ</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="fixed bottom-4 right-4 rounded-lg border-2 border-border bg-white px-4 py-3 text-xs text-muted-foreground shadow-sm">
                <div className="font-semibold text-foreground">
                    デモアカウント情報
                </div>
                <div>Staff: staff@leafs.com</div>
                <div>Viewer: viewer@leafs.com</div>
                <div>パスワード: 任意</div>
            </div>
        </div>
    );
}
