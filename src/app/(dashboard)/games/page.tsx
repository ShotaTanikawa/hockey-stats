import { redirect } from "next/navigation";

export default function GamesRedirectPage() {
    // 旧ルートから新しいダッシュボード配下へ誘導
    redirect("/dashboard/games");
}
