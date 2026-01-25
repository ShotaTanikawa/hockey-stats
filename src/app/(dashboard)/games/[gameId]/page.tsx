import { redirect } from "next/navigation";

export default function GameRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    // 旧URLから新しい詳細ページへ誘導
    redirect(`/dashboard/games/${params.gameId}`);
}
