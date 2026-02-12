"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

type WorkflowStatus = "draft" | "in_progress" | "finalized";

type Props = {
    gameId: string;
    workflowStatus: WorkflowStatus;
    hasAnyStats: boolean;
    canEdit: boolean;
};

export default function GameWorkflowActions({
    gameId,
    workflowStatus,
    hasAnyStats,
    canEdit,
}: Props) {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    if (!canEdit) {
        return null;
    }

    async function updateWorkflowStatus(nextStatus: WorkflowStatus) {
        setIsSaving(true);
        const { error } = await supabase
            .from("games")
            .update({ workflow_status: nextStatus })
            .eq("id", gameId);

        setIsSaving(false);

        if (error) {
            toast({
                variant: "destructive",
                title: "更新エラー",
                description: error.message,
            });
            return;
        }

        toast({
            title:
                nextStatus === "finalized"
                    ? "試合を確定しました"
                    : "試合を再開封しました",
        });
        router.refresh();
    }

    if (workflowStatus === "finalized") {
        return (
            <Button
                variant="outline"
                size="sm"
                className="border border-amber-300 bg-amber-50 text-amber-800"
                onClick={() => updateWorkflowStatus("in_progress")}
                disabled={isSaving}
            >
                {isSaving ? "更新中..." : "再開封"}
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="border border-emerald-300 bg-emerald-50 text-emerald-800"
            onClick={() => updateWorkflowStatus("finalized")}
            disabled={isSaving || !hasAnyStats}
            title={!hasAnyStats ? "入力後に確定できます" : undefined}
        >
            {isSaving ? "更新中..." : "確定"}
        </Button>
    );
}
