import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberWithTeam } from "@/lib/supabase/queries";
import DashboardShell from "@/components/layouts/DashboardShell";

export const dynamic = "force-dynamic";

type Props = {
    children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
    // ログイン中ユーザーを取得（未ログインは/loginへ）
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // チーム情報とロールを取得して共通ヘッダーに渡す
    const { data: member } = await getMemberWithTeam(supabase, user.id);
    // team_members.team_id は多対1なので配列の先頭を使う
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
