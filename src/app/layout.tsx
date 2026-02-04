import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-body",
    subsets: ["latin"],
    display: "swap",
});

const fraunces = Fraunces({
    variable: "--font-display",
    subsets: ["latin"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-code",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Hockey Stats",
    description: "Game-day hockey stats tracking and season insights.",
};

// 全ページ共通のレイアウトと Provider を適用する
// ここで AppProviders を噛ませることでトースト/ツールチップを全体に展開する
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased`}
            >
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
