import { redirect } from "next/navigation";

export default function GameEditRedirectPage({
    params,
}: {
    params: { gameId: string };
}) {
    redirect(`/dashboard/games/${params.gameId}/edit`);
}
