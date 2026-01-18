import { redirect } from "next/navigation";

export default function StatsPlayersRedirectPage() {
    redirect("/dashboard/stats/players");
}
