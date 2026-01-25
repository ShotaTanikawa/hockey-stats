import { redirect } from "next/navigation";

export default function StatsGlossaryRedirectPage() {
    // 旧ルートから新しいダッシュボード配下へリダイレクト
    redirect("/dashboard/stats/glossary");
}
