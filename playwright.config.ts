import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "tests/e2e",
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: true,
    reporter: "list",
    use: {
        baseURL: "http://localhost:3001",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "pnpm dev --port 3001",
        url: "http://localhost:3001",
        reuseExistingServer: false,
        timeout: 60_000,
    },
});
