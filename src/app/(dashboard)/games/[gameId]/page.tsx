import { redirect } from "next/navigation";

export default function GameRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    redirect(`/dashboard/games/${params.gameId}`);
}
