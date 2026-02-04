import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 認証チェックがあるため動的レンダリング
export const dynamic = "force-dynamic";

// スタッツ用語の簡易辞書（MVPは静的に保持）
const GLOSSARY = [
    {
        term: "G (Goals)",
        description: "ゴール数。得点として記録された回数。",
    },
    {
        term: "A (Assists)",
        description: "アシスト数。得点に直接関与した回数。",
    },
    {
        term: "P (Points)",
        description: "ポイント数。G + A。",
    },
    {
        term: "SOG (Shots on Goal)",
        description: "枠内シュート数。ゴール方向に有効だったシュート。",
    },
    {
        term: "SH% (Shooting%)",
        description: "ゴール率。G / SOG。",
    },
    {
        term: "BLK (Blocked Shots)",
        description: "ブロックショット数。味方がシュートを体で止めた回数。",
    },
    {
        term: "PIM (Penalty Minutes)",
        description: "ペナルティ合計分（分単位）。",
    },
    {
        term: "SA (Shots Against)",
        description: "被シュート数。ゴーリーが受けたシュート数。",
    },
    {
        term: "GA (Goals Against)",
        description: "失点数。ゴーリーが許した失点数。",
    },
    {
        term: "Saves",
        description: "セーブ数。MVPでは試合後に確定。",
    },
    {
        term: "SV% (Save%)",
        description: "セーブ率。Saves / SA。",
    },
    {
        term: "GAA",
        description: "平均失点。GA / 出場試合数。",
    },
];

export default async function StatsGlossaryPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // 未ログインはログイン画面へ
        redirect("/login");
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    <span className="font-display">Glossary</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                    スタッツ用語と計算式の確認
                </div>
            </div>

            <Card className="border border-border/60">
                <CardHeader className="border-b border-border/60">
                    <CardTitle className="text-base">
                        用語と計算式
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6 text-sm">
                    {GLOSSARY.map((item) => (
                        <div
                            key={item.term}
                            className="rounded-2xl border border-border/70 bg-white/70 px-4 py-3"
                        >
                            <div className="font-semibold text-gray-700">
                                {item.term}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {item.description}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
