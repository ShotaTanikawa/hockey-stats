import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function GamesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold">Games</h1>
            <p className="mt-2 text-sm">Logged in as: {user.email}</p>
        </main>
    );
}
