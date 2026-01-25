"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
    label: string;
    description: string;
};

export default function EditStatHelp({ label, description }: Props) {
    return (
        <span className="inline-flex items-center gap-1">
            {label}
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="grid h-4 w-4 place-items-center rounded-full border border-border text-[10px] text-muted-foreground"
                        aria-label={`${label} の定義`}
                    >
                        ?
                    </button>
                </TooltipTrigger>
                {/* スタッツの短い定義を表示 */}
                <TooltipContent>{description}</TooltipContent>
            </Tooltip>
        </span>
    );
}
