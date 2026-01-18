"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
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
        router.push("/games");
        router.refresh();
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                    <CardAction>
                        <Button variant="link">Sign Up</Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            {/* 入力値はstateで管理 */}
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                {/* TODO: Add forgot password functionality */}
                                {/* <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password? */}
                                {/* </a> */}
                            </div>
                            {/* 入力値はstateで管理 */}
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
                {error && (
                    <CardFooter className="flex-col gap-2">
                        {/* 認証エラーを表示 */}
                        <p className="text-sm text-red-600">{error}</p>
                    </CardFooter>
                )}
            </Card>
        </main>
    );
}
