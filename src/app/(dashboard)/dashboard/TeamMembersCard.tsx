"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { TeamMemberSummary } from "@/lib/types/members";

type Props = {
    teamId: string;
    currentUserId: string;
    canManage: boolean;
};

export default function TeamMembersCard({
    teamId,
    currentUserId,
    canManage,
}: Props) {
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMemberSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canManage) return;
        let cancelled = false;

        // staff のみメンバー一覧を取得する
        async function loadMembers() {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/team-members/list?teamId=${teamId}`);
            const result = (await response.json()) as {
                members?: MemberRow[];
                error?: string;
            };

            if (cancelled) return;
            setLoading(false);

            if (!response.ok || !result.members) {
                setError(result.error ?? "メンバー取得に失敗しました。");
                return;
            }

            setMembers(result.members);
        }

        loadMembers();

        return () => {
            cancelled = true;
        };
    }, [teamId, canManage]);

    // viewer を staff に昇格させる
    async function handlePromote(userId: string) {
        if (!canManage) return;
        const response = await fetch("/api/team-members/promote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId, userId }),
        });

        const result = (await response.json()) as { ok?: boolean; error?: string };

        if (!response.ok || !result.ok) {
            toast({
                variant: "destructive",
                title: "権限更新エラー",
                description: result.error ?? "昇格に失敗しました。",
            });
            return;
        }

        setMembers((prev) =>
            prev.map((member) =>
                member.userId === userId ? { ...member, role: "staff" } : member
            )
        );

        toast({ title: "スタッフ権限に昇格しました。" });
    }

    // viewer はカード自体を非表示
    if (!canManage) {
        return null;
    }

    return (
        <Card className="mb-8 border-2 border-border">
            <CardHeader className="border-b-2 border-border">
                <CardTitle className="text-base">チームメンバー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
                {loading && (
                    <div className="text-xs text-muted-foreground">
                        読み込み中...
                    </div>
                )}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                        {error}
                    </div>
                )}
                {!loading && !error && members.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                        メンバーが見つかりません。
                    </div>
                )}
                {!loading && !error && members.length > 0 && (
                    <div className="space-y-3">
                        {members.map((member) => {
                            const isSelf = member.userId === currentUserId;
                            return (
                                <div
                                    key={member.userId}
                                    className="flex flex-col gap-3 rounded-lg border-2 border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="font-semibold text-gray-700">
                                            {member.email ?? member.userId}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {member.role.toUpperCase()}
                                            {isSelf ? "（自分）" : ""}
                                        </div>
                                    </div>
                                    <div>
                                        {member.role === "viewer" && !isSelf && (
                                            <Button
                                                size="sm"
                                                className="h-8 rounded-lg border-2 border-foreground bg-black px-3 text-white hover:bg-black/90"
                                                onClick={() =>
                                                    handlePromote(member.userId)
                                                }
                                            >
                                                昇格
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
