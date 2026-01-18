import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
    return (
        <div className="min-h-svh w-full bg-white px-4 py-10">
            <div className="mx-auto w-full max-w-[420px] pt-10">
                <Card className="rounded-2xl border border-gray-200 shadow-sm">
                    <CardHeader className="space-y-4 border-b border-gray-200 p-6">
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white">
                                <span className="text-lg">🏒</span>
                            </div>
                            <div className="text-xl font-semibold tracking-tight">
                                Hockey Stats
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-base font-semibold">サインアップ</div>
                            <div className="text-sm text-gray-500">
                                新しいアカウントを作成
                            </div>
                        </div>
                    </CardHeader>

                    <form>
                        <CardContent className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    className="h-12 rounded-xl bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="h-12 rounded-xl bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="team-code" className="text-sm">
                                    Team Code
                                </Label>
                                <Input
                                    id="team-code"
                                    type="text"
                                    placeholder="LEAFS2025"
                                    className="h-12 rounded-xl bg-gray-50"
                                />
                                <p className="text-xs text-gray-500">
                                    （チームから提供されたコード）
                                </p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                                ※ 新規ユーザーは自動的に Viewer として登録されます
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-black text-white hover:bg-black/90"
                            >
                                アカウント作成
                            </Button>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t border-gray-200 p-6">
                            <div className="text-sm text-gray-500">
                                既にアカウントをお持ちですか？
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl border-gray-200 bg-white"
                                asChild
                            >
                                <Link href="/login">ログイン</Link>
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
