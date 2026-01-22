import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    joinCode: z.string().min(1),
});

type SignupPayload = z.infer<typeof signupSchema>;

// join_code を使ったサインアップを実行する
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    const { email, password, joinCode } = parsed.data as SignupPayload;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: "サーバー設定が不足しています。" },
            { status: 500 }
        );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: team, error: teamError } = await admin
        .from("teams")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();

    if (teamError) {
        return NextResponse.json(
            { error: "チームコードの確認に失敗しました。" },
            { status: 500 }
        );
    }

    if (!team) {
        return NextResponse.json(
            { error: "チームコードが正しくありません。" },
            { status: 400 }
        );
    }

    const { data: userData, error: userError } =
        await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

    if (userError || !userData.user) {
        return NextResponse.json(
            { error: userError?.message ?? "ユーザー作成に失敗しました。" },
            { status: 400 }
        );
    }

    const { error: memberError } = await admin.from("team_members").insert({
        team_id: team.id,
        user_id: userData.user.id,
        role: "viewer",
        is_active: true,
    });

    if (memberError) {
        await admin.auth.admin.deleteUser(userData.user.id);
        return NextResponse.json(
            { error: "チームへの登録に失敗しました。" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
