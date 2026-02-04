"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import CreateTeamForm from "./CreateTeamForm";
import JoinSignupForm from "./JoinSignupForm";

export default function SignupPage() {
    const [activeTab, setActiveTab] = useState("join");

    return (
        <div className="min-h-screen w-full px-4 py-12">
            <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div className="flex flex-col justify-center rounded-3xl border border-border/60 bg-white/70 p-8 shadow-xl backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Team Setup
                    </div>
                    <div className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                        <span className="font-display">Start</span> your season
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                        新規チームの作成か、既存チームへの参加をここで完了。
                        作成者は staff 権限、参加者は viewer 権限として
                        すぐに運用を開始できます。
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Join code
                        </div>
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Staff control
                        </div>
                        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2">
                            Ready today
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <Card className="w-full rounded-3xl border border-border/60 shadow-xl">
                        <CardHeader className="space-y-4 border-b border-border/60 p-6">
                            {/* サインアップ画面の共通ヘッダー */}
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border/70 bg-white/80">
                                    <span className="text-lg">🏒</span>
                                </div>
                                <div className="text-xl font-semibold tracking-tight">
                                    Hockey Stats
                                </div>
                            </div>

                            <div className="space-y-1">
                            <h1 className="text-base font-semibold">
                                サインアップ
                            </h1>
                                <div className="text-sm text-muted-foreground">
                                    新しいアカウントを作成
                                </div>
                            </div>
                        </CardHeader>

                        {/* 参加とチーム作成を同一画面で切り替える */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <CardContent className="space-y-5 p-6">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="join">
                                        参加（join_code）
                                    </TabsTrigger>
                                    <TabsTrigger value="create">
                                        チーム作成
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="join">
                                    <JoinSignupForm />
                                </TabsContent>

                                <TabsContent value="create">
                                    <CreateTeamForm />
                                </TabsContent>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 border-t border-border/60 p-6">
                                <div className="text-sm text-muted-foreground">
                                    既にアカウントをお持ちですか？
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 w-full rounded-xl border border-foreground bg-white"
                                    asChild
                                >
                                    <Link href="/login">ログイン</Link>
                                </Button>
                            </CardFooter>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}
