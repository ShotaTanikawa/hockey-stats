import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// セッション更新を担当するProxy（middlewareから呼ばれる）
// - 未ログイン時は保護ページから/loginへ誘導
// - Cookieを同期してAuth状態を正しく保つ
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // リクエストごとにクライアントを作成（グローバル共有は避ける）
    // - SSR環境でセッション不整合が起きやすいため都度生成
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                // リクエストのCookieを読み取り
                getAll() {
                    return request.cookies.getAll();
                },
                // 更新されたセッションCookieをレスポンスへ反映
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // ここからgetClaims()までは処理を挟まない（セッション更新の不整合を防ぐ）

    // getClaims()はJWT検証付きのため、サーバー側の認証判定に使う
    const { data } = await supabase.auth.getClaims();

    const user = data?.claims;

    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth")
    ) {
        // 未ログインならログイン画面へ誘導
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // ※ここでsupabaseResponseをそのまま返すこと（Cookie同期のため）

    return supabaseResponse;
}
