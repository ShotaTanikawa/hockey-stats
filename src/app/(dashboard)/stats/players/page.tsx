import { redirect } from "next/navigation";

export default function StatsPlayersRedirectPage() {
    // 旧ルートから新しいダッシュボード配下へ誘導
    redirect("/dashboard/stats/players");
}
