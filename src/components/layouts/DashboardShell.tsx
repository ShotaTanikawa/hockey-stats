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
        <div className="min-h-svh text-foreground">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    {/* クリックでダッシュボードへ戻るタイトル */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-white/80 shadow-sm">
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
                            className="h-9 w-9 border-border/70 bg-white/70 shadow-sm"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((prev) => !prev)}
                        >
                            ☰
                        </Button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border/70 bg-white/90 p-2 text-xs shadow-xl backdrop-blur">
                                <div className="px-2 py-1 text-muted-foreground">
                                    {userEmail}
                                </div>
                                <div className="px-2 py-2">
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                            roleLabel === "staff"
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border bg-muted text-foreground"
                                        }`}
                                    >
                                        {roleLabel.toUpperCase()}
                                    </span>
                                </div>
                                <div className="my-1 h-px bg-border/70" />
                                <Link
                                    href="/dashboard"
                                    className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    ダッシュボード
                                </Link>
                                <Link
                                    href="/dashboard/games"
                                    className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    試合一覧
                                </Link>
                                <Link
                                    href="/dashboard/stats/players"
                                    className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    シーズン通算
                                </Link>
                                {roleLabel === "staff" && (
                                    <Link
                                        href="/dashboard/audit"
                                        className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        監査ログ
                                    </Link>
                                )}
                                {roleLabel === "staff" && (
                                    <Link
                                        href="/dashboard/operations"
                                        className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        運用ルール
                                    </Link>
                                )}
                                <div className="my-1 h-px bg-border/70" />
                                <Link
                                    href="/dashboard/players"
                                    className="block rounded-lg px-2 py-2 hover:bg-muted/60"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    選手一覧
                                </Link>
                                <div className="my-1 h-px bg-border/70" />
                                <button
                                    type="button"
                                    className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8">
                {children}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 backdrop-blur">
                <div className="mx-auto grid w-full max-w-6xl grid-cols-4 text-center text-xs text-muted-foreground">
                    <Link
                        href="/dashboard"
                        className={`py-3 ${
                            isActive("/dashboard") &&
                            !isActive("/dashboard/games") &&
                            !isActive("/dashboard/players") &&
                            !isActive("/dashboard/stats")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted/60"
                        }`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/dashboard/games"
                        className={`py-3 ${
                            isActive("/dashboard/games")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted/60"
                        }`}
                    >
                        Games
                    </Link>
                    <Link
                        href="/dashboard/players"
                        className={`py-3 ${
                            isActive("/dashboard/players")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted/60"
                        }`}
                    >
                        Players
                    </Link>
                    <Link
                        href="/dashboard/stats/players"
                        className={`py-3 ${
                            isActive("/dashboard/stats")
                                ? "bg-foreground text-background"
                                : "hover:bg-muted/60"
                        }`}
                    >
                        Stats
                    </Link>
                </div>
            </nav>
        </div>
    );
}
