"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

type Props = {
    children: React.ReactNode;
};

// アプリ全体で必要な Provider をまとめる
// TooltipProvider と Toaster をここに集約して利用側をシンプルにする
export default function AppProviders({ children }: Props) {
    return (
        <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
        </TooltipProvider>
    );
}
