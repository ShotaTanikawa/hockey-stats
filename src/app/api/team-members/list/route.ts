import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { TeamMemberSummary } from "@/lib/types/members";

// teamId をクエリで受け取る
const listSchema = z.object({
    teamId: z.string().uuid(),
});

type MemberRow = {
    user_id: string;
    role: "staff" | "viewer";
    is_active: boolean;
    created_at: string | null;
};

// チームメンバー一覧を取得する（staff 専用）
// - Auth は RLS で確認し、メール取得は service role で補完
export async function GET(request: Request) {
    const url = new URL(request.url);
    const parsed = listSchema.safeParse({
        teamId: url.searchParams.get("teamId"),
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    const { teamId } = parsed.data;
    // 通常クライアントでログイン状態と権限を確認
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "未ログインです。" }, { status: 401 });
    }

    // staff 以外は閲覧不可
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

    // service role でユーザー情報（メール）まで取得する
    const admin = createAdminClient(supabaseUrl, serviceRoleKey);

    const { data: members, error } = await admin
        .from("team_members")
        .select("user_id, role, is_active, created_at")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json(
            { error: "メンバー取得に失敗しました。" },
            { status: 500 }
        );
    }

    const rows = (members ?? []) as MemberRow[];
    const enriched = await Promise.all(
        rows.map(async (row) => {
            // auth.users は管理APIから取得する必要がある
            const { data } = await admin.auth.admin.getUserById(row.user_id);
            return {
                userId: row.user_id,
                role: row.role,
                email: data.user?.email ?? null,
            } satisfies TeamMemberSummary;
        })
    );

    return NextResponse.json({ members: enriched });
}
