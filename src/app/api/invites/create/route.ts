import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createInviteSchema = z.object({
    teamId: z.string().uuid(),
});

type CreateInvitePayload = z.infer<typeof createInviteSchema>;

function generateInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(
        { length: 8 },
        () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = createInviteSchema.safeParse(body);

    if (!parsed.success) {
        console.error("[invites/create] invalid payload");
        return NextResponse.json(
            { error: "入力内容を確認してください。" },
            { status: 400 }
        );
    }

    const { teamId } = parsed.data as CreateInvitePayload;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        console.error("[invites/create] unauthenticated");
        return NextResponse.json(
            { error: "認証が必要です。" },
            { status: 401 }
        );
    }

    const { data: staffCheck, error: staffError } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (staffError || staffCheck?.role !== "staff") {
        console.error("[invites/create] forbidden", {
            userId: user.id,
            teamId,
            error: staffError?.message,
        });
        return NextResponse.json(
            { error: "権限がありません。" },
            { status: 403 }
        );
    }

    let inviteCode = "";
    for (let i = 0; i < 5; i += 1) {
        const candidate = generateInviteCode();
        const { data: existing } = await supabase
            .from("invite_codes")
            .select("id")
            .eq("code", candidate)
            .maybeSingle();
        if (!existing) {
            inviteCode = candidate;
            break;
        }
    }

    if (!inviteCode) {
        console.error("[invites/create] code generation failed");
        return NextResponse.json(
            { error: "招待コードの生成に失敗しました。" },
            { status: 500 }
        );
    }

    const { error: insertError } = await supabase.from("invite_codes").insert({
        team_id: teamId,
        code: inviteCode,
        created_by: user.id,
    });

    if (insertError) {
        console.error("[invites/create] insert failed", {
            teamId,
            userId: user.id,
            error: insertError.message,
        });
        return NextResponse.json(
            { error: "招待コードの発行に失敗しました。" },
            { status: 500 }
        );
    }

    console.info("[invites/create] success", {
        teamId,
        userId: user.id,
    });
    return NextResponse.json({ ok: true, inviteCode });
}
