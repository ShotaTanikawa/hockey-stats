import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// チーム作成の入力検証
const createTeamSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    teamName: z.string().min(1),
    seasonLabel: z.string().min(1),
});

type CreateTeamPayload = z.infer<typeof createTeamSchema>;

// 人が読みやすい join_code を生成（紛らわしい文字は除外）
function generateJoinCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// 初回ユーザーがチームを作成するエンドポイント
// - Auth ユーザー作成 → teams 作成 → team_members 登録
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    const { email, password, teamName, seasonLabel } =
        parsed.data as CreateTeamPayload;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: "サーバー設定が不足しています。" },
            { status: 500 }
        );
    }

    // RLS を迂回できる管理クライアント
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // join_code は衝突がないか最大 5 回まで再生成する
    let joinCode = "";
    for (let i = 0; i < 5; i += 1) {
        const candidate = generateJoinCode();
        const { data: existing } = await admin
            .from("teams")
            .select("id")
            .eq("join_code", candidate)
            .maybeSingle();
        if (!existing) {
            joinCode = candidate;
            break;
        }
    }

    if (!joinCode) {
        return NextResponse.json(
            { error: "チームコードの生成に失敗しました。" },
            { status: 500 }
        );
    }

    // チーム作成者の Auth ユーザーを作成
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

    // teams を作成（初期シーズン表示名も同時に保存）
    const { data: team, error: teamError } = await admin
        .from("teams")
        .insert({
            name: teamName,
            join_code: joinCode,
            season_label: seasonLabel,
        })
        .select("id")
        .maybeSingle();

    if (teamError || !team) {
        await admin.auth.admin.deleteUser(userData.user.id);
        return NextResponse.json(
            { error: "チーム作成に失敗しました。" },
            { status: 500 }
        );
    }

    // 作成者は staff として登録
    const { error: memberError } = await admin.from("team_members").insert({
        team_id: team.id,
        user_id: userData.user.id,
        role: "staff",
        is_active: true,
    });

    if (memberError) {
        // 途中失敗時は作成済みのデータをロールバック
        await admin.auth.admin.deleteUser(userData.user.id);
        await admin.from("teams").delete().eq("id", team.id);
        return NextResponse.json(
            { error: "チームへの登録に失敗しました。" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, joinCode });
}
