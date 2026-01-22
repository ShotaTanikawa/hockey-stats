import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ルートはログイン状態に応じて遷移先を切り替える
// 認証は Server Component で行い、未ログインなら /login へ送る
export default async function Home() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    redirect("/dashboard");
}
