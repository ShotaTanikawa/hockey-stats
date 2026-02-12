import { cn } from "@/lib/utils";

type StepKey = "create" | "live" | "edit" | "review";

type Props = {
    current: StepKey;
    className?: string;
};

const STEPS: Array<{ key: StepKey; label: string }> = [
    { key: "create", label: "1. 試合登録" },
    { key: "live", label: "2. ライブ入力" },
    { key: "edit", label: "3. 試合後修正" },
    { key: "review", label: "4. 内容確認" },
];

export default function GameFlowSteps({ current, className }: Props) {
    const currentIndex = STEPS.findIndex((step) => step.key === current);

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {STEPS.map((step, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;

                return (
                    <span
                        key={step.key}
                        className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            done &&
                                "border-emerald-300 bg-emerald-50 text-emerald-700",
                            active &&
                                "border-foreground bg-foreground text-background",
                            !done &&
                                !active &&
                                "border-border/70 bg-white/70 text-muted-foreground"
                        )}
                    >
                        {step.label}
                    </span>
                );
            })}
        </div>
    );
}
