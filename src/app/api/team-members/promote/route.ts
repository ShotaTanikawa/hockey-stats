import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";

// 昇格対象の teamId / userId を検証する
const promoteSchema = z.object({
    teamId: z.string().uuid(),
    userId: z.string().uuid(),
});

// staff が viewer を staff に昇格させる Route Handler
// - 実際の更新は service role で行い、RLS を迂回して実行する
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = promoteSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    // 通常クライアントでログイン状態と権限を確認
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "未ログインです。" },
            { status: 401 }
        );
    }

    const { teamId, userId } = parsed.data;

    // リクエストユーザーが staff であることを確認
    const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (member?.role !== "staff") {
        return NextResponse.json(
            { error: "スタッフ権限が必要です。" },
            { status: 403 }
        );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: "サーバー設定が不足しています。" },
            { status: 500 }
        );
    }

    // service role で役割を更新
    const admin = createAdminClient(supabaseUrl, serviceRoleKey);

    const { error } = await admin
        .from("team_members")
        .update({ role: "staff", is_active: true })
        .eq("team_id", teamId)
        .eq("user_id", userId);

    if (error) {
        return NextResponse.json(
            { error: "権限更新に失敗しました。" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
