"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        router.push("/games");
        router.refresh();
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
            <div className="w-full space-y-6 rounded-lg border p-6">
                <h1 className="text-xl font-semibold">Login</h1>

                <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            className="w-full rounded-md border px-3 py-2"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            className="w-full rounded-md border px-3 py-2"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        {loading ? "Loading..." : "Login"}
                    </button>
                </form>
            </div>
        </main>
    );
}
