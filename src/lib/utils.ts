import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwindのクラス結合を安全に行うユーティリティ
// - clsxで条件付きクラスを構築
// - twMergeで競合するTailwindクラスを解決
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
