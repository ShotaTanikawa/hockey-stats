import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithTeam } from "@/lib/supabase/queries";
import DashboardShell from "@/components/layouts/DashboardShell";

// 認証情報に依存するため常に動的にレンダリングする
export const dynamic = "force-dynamic";

type Props = {
    children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
    // Server Component で Supabase を初期化（cookie連携あり）
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // 未ログインは保護エリアに入れない
        redirect("/login");
    }

    // チーム情報とロールを取得して共通ヘッダーに渡す
    // UI側の権限表示とメニューの状態管理に使用
    const { data: member } = await getMemberWithTeam(supabase, user.id);
    // team_members.team_id は1ユーザー1チーム前提
    const team = member?.team ?? null;
    const teamName = team?.name ?? "Unknown Team";
    const seasonLabel = team?.season_label ?? "-";
    const roleLabel = member?.role ?? "viewer";

    // 一時デバッグ: getMemberWithTeamの戻り値を確認
    console.log("[debug] getMemberWithTeam", {
        userId: user.id,
        member,
        teamName,
        seasonLabel,
        roleLabel,
    });

    return (
        <DashboardShell
            teamName={teamName}
            seasonLabel={seasonLabel}
            userEmail={user.email ?? ""}
            roleLabel={roleLabel}
        >
            {children}
        </DashboardShell>
    );
}
