import { redirect } from "next/navigation";

export default function GameLiveRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    redirect(`/dashboard/games/${params.gameId}/live`);
}
