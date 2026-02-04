"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateTeamForm() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [teamName, setTeamName] = useState("");
    const [seasonLabel, setSeasonLabel] = useState(() => {
        const year = new Date().getFullYear();
        const options = [year - 1, year, year + 1].map(
            (start) => `${start}-${String(start + 1).slice(2)}`
        );
        return options[1] ?? options[0] ?? "";
    });
    const [createEmail, setCreateEmail] = useState("");
    const [createPassword, setCreatePassword] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [createdJoinCode, setCreatedJoinCode] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    // 直近のシーズン候補を3年分だけ表示する
    const seasonOptions = useMemo(() => {
        const year = new Date().getFullYear();
        return [year - 1, year, year + 1].map(
            (start) => `${start}-${String(start + 1).slice(2)}`
        );
    }, []);

    // seasonLabel は初期値で当年シーズンをセットする

    // 初回ユーザーがチームを作成するフロー
    // - チーム作成後に join_code を表示
    // - 成功後に自動ログインを試行する
    async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreateError(null);
        setCreateSuccess(null);
        setCreatedJoinCode(null);
        setCopyMessage(null);

        if (!teamName.trim() || !seasonLabel || !createEmail || !createPassword) {
            setCreateError("入力項目をすべて埋めてください。");
            return;
        }

        setIsCreating(true);

        const response = await fetch("/api/team/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: createEmail,
                password: createPassword,
                teamName: teamName.trim(),
                seasonLabel,
            }),
        });

        const result = (await response.json()) as {
            ok?: boolean;
            joinCode?: string;
            error?: string;
        };

        setIsCreating(false);

        if (!response.ok || !result.ok) {
            setCreateError(result.error ?? "チーム作成に失敗しました。");
            return;
        }

        if (result.joinCode) {
            setCreatedJoinCode(result.joinCode);
        }

        setCreateSuccess("チームを作成しました。");

        // 作成後は同じ認証情報でログインを試みる
        const { error } = await supabase.auth.signInWithPassword({
            email: createEmail,
            password: createPassword,
        });

        if (error) {
            setCreateError(
                "アカウントは作成されました。ログインしてください。"
            );
            return;
        }
    }

    // 生成された join_code をクリップボードにコピー
    async function handleCopyJoinCode() {
        if (!createdJoinCode) return;
        try {
            await navigator.clipboard.writeText(createdJoinCode);
            setCopyMessage("コピーしました");
        } catch {
            setCopyMessage("コピーに失敗しました");
        }
    }

    return (
        <form onSubmit={handleCreateTeam} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="team-name" className="text-sm">
                    チーム名
                </Label>
                <Input
                    id="team-name"
                    type="text"
                    placeholder="Hockey Stats Club"
                    className="h-12 rounded-xl border-2"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="season-label" className="text-sm">
                    シーズン
                </Label>
                <select
                    id="season-label"
                    className="h-12 w-full rounded-xl border-2 border-border bg-white px-3 text-sm"
                    value={seasonLabel}
                    onChange={(event) => setSeasonLabel(event.target.value)}
                >
                    <option value="">シーズンを選択</option>
                    {seasonOptions.map((season) => (
                        <option key={season} value={season}>
                            {season}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="create-email" className="text-sm">
                    Email
                </Label>
                <Input
                    id="create-email"
                    type="email"
                    placeholder="email@example.com"
                    className="h-12 rounded-xl border-2"
                    value={createEmail}
                    onChange={(event) => setCreateEmail(event.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="create-password" className="text-sm">
                    Password
                </Label>
                <Input
                    id="create-password"
                    type="password"
                    className="h-12 rounded-xl border-2"
                    value={createPassword}
                    onChange={(event) => setCreatePassword(event.target.value)}
                />
            </div>

            {createdJoinCode && (
                <div className="space-y-3 rounded-lg border-2 border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                    <div className="text-sm font-semibold text-foreground">
                        チームコード
                    </div>
                    <div className="font-mono text-base text-foreground">
                        {createdJoinCode}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 rounded-lg border-2 px-3 text-xs"
                            onClick={handleCopyJoinCode}
                        >
                            コピー
                        </Button>
                        {copyMessage && <span>{copyMessage}</span>}
                    </div>
                    <div>このコードをチームに共有してください</div>
                </div>
            )}

            {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {createError}
                </div>
            )}

            {createSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    {createSuccess}
                </div>
            )}

            <Button
                type="submit"
                className="h-12 w-full rounded-xl border border-foreground bg-foreground text-background hover:bg-foreground/90"
                disabled={isCreating}
            >
                {isCreating ? "作成中..." : "チーム作成"}
            </Button>

            {createdJoinCode && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-2 border-foreground bg-white"
                    onClick={() => router.push("/dashboard")}
                >
                    ダッシュボードへ
                </Button>
            )}
        </form>
    );
}
