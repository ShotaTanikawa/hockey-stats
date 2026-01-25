import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバー側で使うSupabaseクライアント（Cookie連携あり）
// - Server Components / Route Handlers から使用
// - Cookie同期によってログイン状態を維持する
export async function createClient() {
    // リクエストに紐づくCookieストアを取得
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                // サーバーコンポーネントからCookieを参照
                getAll() {
                    return cookieStore.getAll();
                },
                // セッション更新時のCookie書き込み
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Componentからの呼び出し時は書き込み不可のため無視
                        // （middlewareでセッション更新していれば問題なし）
                    }
                },
            },
        }
    );
}
