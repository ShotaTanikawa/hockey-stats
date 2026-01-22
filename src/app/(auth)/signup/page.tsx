"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // サインアップ処理（Route Handlerへ送信）
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email || !password || !joinCode) {
            setErrorMessage("入力項目をすべて埋めてください。");
            return;
        }

        setIsSubmitting(true);

        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, joinCode }),
        });

        const result = (await response.json()) as { ok?: boolean; error?: string };

        setIsSubmitting(false);

        if (!response.ok || !result.ok) {
            setErrorMessage(result.error ?? "サインアップに失敗しました。");
            return;
        }

        setSuccessMessage("アカウントを作成しました。ログインしてください。");
        router.push("/login");
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
                            <div className="text-base font-semibold">サインアップ</div>
                            <div className="text-sm text-gray-500">
                                新しいアカウントを作成
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
                                    className="h-12 rounded-xl border-2"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="h-12 rounded-xl border-2"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="team-code" className="text-sm">
                                    Team Code
                                </Label>
                                <Input
                                    id="team-code"
                                    type="text"
                                    placeholder="LEAFS2025"
                                    className="h-12 rounded-xl border-2"
                                    value={joinCode}
                                    onChange={(event) =>
                                        setJoinCode(event.target.value.toUpperCase())
                                    }
                                />
                                <p className="text-xs text-gray-500">
                                    （チームから提供されたコード）
                                </p>
                            </div>

                            <div className="rounded-lg border-2 border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                                ※ 新規ユーザーは自動的に Viewer として登録されます
                            </div>

                            {errorMessage && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                                    {errorMessage}
                                </div>
                            )}

                            {successMessage && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                                    {successMessage}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-black text-white hover:bg-black/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "作成中..." : "アカウント作成"}
                            </Button>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t-2 border-border p-6">
                            <div className="text-sm text-muted-foreground">
                                既にアカウントをお持ちですか？
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-white"
                                asChild
                            >
                                <Link href="/login">ログイン</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="fixed bottom-4 right-4 rounded-lg border-2 border-border bg-white px-4 py-3 text-xs text-muted-foreground shadow-sm">
                <div className="font-mono font-semibold text-foreground">
                    デモ用チームコード
                </div>
                <div className="font-mono">LEAFS2025</div>
            </div>
        </div>
    );
}
