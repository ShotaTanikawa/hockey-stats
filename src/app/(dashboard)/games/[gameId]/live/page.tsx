import { redirect } from "next/navigation";

export default function GameLiveRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    // 旧URLから新しいライブ入力ページへ誘導
    redirect(`/dashboard/games/${params.gameId}/live`);
}
