import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// 招待コードでのサインアップ入力を検証する
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    joinCode: z.string().min(1),
});

type SignupPayload = z.infer<typeof signupSchema>;

// 招待コードを使ったサインアップを実行する
// - service role で Auth ユーザー作成と team_members 登録を行う
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
        console.error("[auth/signup] invalid payload");
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    const { email, password, joinCode } = parsed.data as SignupPayload;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("[auth/signup] missing server config");
        return NextResponse.json(
            { error: "サーバー設定が不足しています。" },
            { status: 500 }
        );
    }

    // RLS を迂回できる管理クライアント
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 招待コードに紐づくチームを確認（未使用のみ）
    const { data: invite, error: inviteError } = await admin
        .from("invite_codes")
        .select("id, team_id, used_at")
        .eq("code", joinCode)
        .maybeSingle();

    if (inviteError) {
        console.error("[auth/signup] invite lookup failed", {
            joinCode,
            error: inviteError.message,
        });
        return NextResponse.json(
            { error: "招待コードの確認に失敗しました。" },
            { status: 500 }
        );
    }

    if (!invite) {
        console.info("[auth/signup] invalid invite code", { joinCode });
        return NextResponse.json(
            { error: "招待コードが正しくありません。" },
            { status: 400 }
        );
    }

    if (invite.used_at) {
        console.info("[auth/signup] invite code already used", { joinCode });
        return NextResponse.json(
            { error: "招待コードは既に使用されています。" },
            { status: 400 }
        );
    }

    // Auth ユーザーを作成（メール確認は即時完了）
    const { data: userData, error: userError } =
        await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

    if (userError || !userData.user) {
        console.error("[auth/signup] user create failed", {
            error: userError?.message,
        });
        return NextResponse.json(
            { error: userError?.message ?? "ユーザー作成に失敗しました。" },
            { status: 400 }
        );
    }

    // 新規ユーザーを viewer として紐づける
    const { error: memberError } = await admin.from("team_members").insert({
        team_id: invite.team_id,
        user_id: userData.user.id,
        role: "viewer",
        is_active: true,
    });

    if (memberError) {
        console.error("[auth/signup] member insert failed", {
            userId: userData.user.id,
            teamId: invite.team_id,
            error: memberError.message,
        });
        // 途中失敗時は作成済みユーザーをロールバック
        await admin.auth.admin.deleteUser(userData.user.id);
        return NextResponse.json(
            { error: "チームへの登録に失敗しました。" },
            { status: 500 }
        );
    }

    // 招待コードを使用済みにする
    const { error: inviteUpdateError, data: inviteUpdate } = await admin
        .from("invite_codes")
        .update({
            used_at: new Date().toISOString(),
            used_by: userData.user.id,
        })
        .eq("id", invite.id)
        .is("used_at", null)
        .select("id")
        .maybeSingle();

    if (inviteUpdateError || !inviteUpdate) {
        console.error("[auth/signup] invite update failed", {
            inviteId: invite.id,
            userId: userData.user.id,
            error: inviteUpdateError?.message,
        });
        // 招待コード更新に失敗した場合はユーザーをロールバック
        await admin.auth.admin.deleteUser(userData.user.id);
        await admin.from("team_members").delete().eq("user_id", userData.user.id);
        return NextResponse.json(
            { error: "招待コードの更新に失敗しました。" },
            { status: 500 }
        );
    }

    console.info("[auth/signup] success", {
        userId: userData.user.id,
        teamId: invite.team_id,
    });
    return NextResponse.json({ ok: true });
}
