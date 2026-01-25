"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
    teamName: string;
    seasonLabel: string;
    userEmail: string;
    roleLabel: "staff" | "viewer";
    children: React.ReactNode;
};

export default function DashboardShell({
    teamName,
    seasonLabel,
    userEmail,
    roleLabel,
    children,
}: Props) {
    // 現在のパスでアクティブタブを判定する
    const pathname = usePathname();
    const router = useRouter();
    // クライアント側でログアウトを実行する
    const supabase = createClient();
    const [menuOpen, setMenuOpen] = useState(false);

    // ナビのアクティブ判定（サブページも含める）
    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(`${path}/`);

    // ログアウト処理（クライアント側でセッションを破棄）
    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    // ヘッダー / コンテンツ / 下部ナビを共通化する
    return (
        <div className="min-h-svh bg-white">
            <header className="border-b-2 border-border bg-card">
                <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    {/* クリックでダッシュボードへ戻るタイトル */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <div className="grid h-9 w-9 place-items-center rounded-lg border-2 border-foreground bg-white">
                            <span>🏒</span>
                        </div>
                        <div>
                            <div className="text-sm font-semibold">
                                {teamName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {seasonLabel}
                            </div>
                        </div>
                    </Link>

                    {/* ユーザーメニュー（メール / ロール / ログアウト） */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-2"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((prev) => !prev)}
                        >
                            ☰
                        </Button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-lg border-2 border-border bg-white p-2 text-xs shadow-sm">
                                <div className="px-2 py-1 text-muted-foreground">
                                    {userEmail}
                                </div>
                                <div className="px-2 py-2">
                                    <span
                                        className={`rounded-full border-2 px-2 py-0.5 text-[10px] font-semibold ${
                                            roleLabel === "staff"
                                                ? "bg-foreground text-background"
                                                : "bg-muted text-foreground"
                                        }`}
                                    >
                                        {roleLabel.toUpperCase()}
                                    </span>
                                </div>
                                <div className="my-1 h-px bg-border" />
                                <Link
                                    href="/dashboard"
                                    className="block rounded-md px-2 py-2 hover:bg-muted"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Team Info
                                </Link>
                                <div className="my-1 h-px bg-border" />
                                <button
                                    type="button"
                                    className="w-full rounded-md px-2 py-2 text-left hover:bg-muted"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl px-6 py-8">
                {children}
            </main>

            <nav className="border-t-2 border-border bg-card">
                <div className="mx-auto grid w-full grid-cols-3 text-center text-xs text-muted-foreground">
                    <Link
                        href="/dashboard/games"
                        className={`py-3 ${
                            isActive("/dashboard/games")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted"
                        }`}
                    >
                        Games
                    </Link>
                    <Link
                        href="/dashboard/players"
                        className={`py-3 ${
                            isActive("/dashboard/players")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted"
                        }`}
                    >
                        Players
                    </Link>
                    <Link
                        href="/dashboard/stats/players"
                        className={`py-3 ${
                            isActive("/dashboard/stats")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted"
                        }`}
                    >
                        Stats
                    </Link>
                </div>
            </nav>
        </div>
    );
}
