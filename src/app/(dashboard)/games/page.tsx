import { redirect } from "next/navigation";

export default function GamesRedirectPage() {
    redirect("/dashboard/games");
}
