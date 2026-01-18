import { createBrowserClient } from "@supabase/ssr";

// クライアントコンポーネント用のSupabaseクライアント（ブラウザで実行）
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}
