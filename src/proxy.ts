import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

// 全リクエストでセッション更新を実行（保護ページの判定も含む）
export async function proxy(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    // 静的アセットなどは除外してmiddlewareの負荷を下げる
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
