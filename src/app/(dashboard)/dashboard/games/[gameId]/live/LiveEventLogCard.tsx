"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
    log: string[];
};

export default function LiveEventLogCard({ log }: Props) {
    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base">Event Log</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* 最新の操作ログを上から表示 */}
                {log.length === 0 ? (
                    <div className="text-xs text-gray-500">
                        直近の操作が表示されます
                    </div>
                ) : (
                    <div className="space-y-2 text-xs text-gray-600">
                        {log.map((item, index) => (
                            <div key={`${item}-${index}`}>{item}</div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
