import { createBrowserClient } from "@supabase/ssr";

// クライアントコンポーネント用のSupabaseクライアント（ブラウザで実行）
// - NEXT_PUBLIC_* の環境変数はクライアントに公開される前提
// - Auth/DBの操作はRLSで権限を制御する
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}
