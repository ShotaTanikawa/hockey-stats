"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinSignupForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 既存チームへ参加するサインアップ
    // - join_code を使って team_members に viewer 登録する
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

        const result = (await response.json()) as {
            ok?: boolean;
            error?: string;
        };

        setIsSubmitting(false);

        if (!response.ok || !result.ok) {
            setErrorMessage(result.error ?? "サインアップに失敗しました。");
            return;
        }

        // 作成後はログイン画面へ誘導（自動ログインは行わない）
        setSuccessMessage("アカウントを作成しました。ログインしてください。");
        router.push("/login");
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                    onChange={(event) => setEmail(event.target.value)}
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
                    onChange={(event) => setPassword(event.target.value)}
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
                className="h-12 w-full rounded-xl border border-foreground bg-foreground text-background hover:bg-foreground/90"
                disabled={isSubmitting}
            >
                {isSubmitting ? "作成中..." : "アカウント作成"}
            </Button>
        </form>
    );
}
