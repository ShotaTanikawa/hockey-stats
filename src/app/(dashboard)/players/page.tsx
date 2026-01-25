import { redirect } from "next/navigation";
export default function PlayersRedirectPage() {
    // 旧ルートから新しいダッシュボード配下へ誘導
    redirect("/dashboard/players");
}
