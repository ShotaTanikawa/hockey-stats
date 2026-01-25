import { redirect } from "next/navigation";

export default function GameEditRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    // 旧URLから新しい試合修正ページへ誘導
    redirect(`/dashboard/games/${params.gameId}/edit`);
}
