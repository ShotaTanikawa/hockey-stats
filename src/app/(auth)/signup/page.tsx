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
        <div className="min-h-screen w-full bg-muted px-4 py-10">
            <div className="mx-auto w-full max-w-md pt-10">
                <Card className="rounded-2xl border-2 border-border shadow-sm">
                    <CardHeader className="space-y-4 border-b-2 border-border p-6">
                        {/* サインアップ画面の共通ヘッダー */}
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-border bg-white">
                                <span className="text-lg">🏒</span>
                            </div>
                            <div className="text-xl font-semibold tracking-tight">
                                Hockey Stats
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-base font-semibold">
                                サインアップ
                            </div>
                            <div className="text-sm text-gray-500">
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

                        <CardFooter className="flex flex-col gap-4 border-t-2 border-border p-6">
                            <div className="text-sm text-muted-foreground">
                                既にアカウントをお持ちですか？
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border-2 border-foreground bg-white"
                                asChild
                            >
                                <Link href="/login">ログイン</Link>
                            </Button>
                        </CardFooter>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
