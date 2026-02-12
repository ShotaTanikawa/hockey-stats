import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
    test("login page renders", async ({ page }) => {
        await page.goto("/login");
        await expect(
            page.getByRole("heading", { name: "ログイン" })
        ).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
    });

    test("signup page renders", async ({ page }) => {
        await page.goto("/signup");
        await expect(
            page.getByRole("heading", { name: "サインアップ" })
        ).toBeVisible();
        await expect(
            page.getByRole("tab", { name: "参加（招待コード）" })
        ).toBeVisible();
        await expect(page.getByRole("tab", { name: "チーム作成" })).toBeVisible();
    });

    test("forgot password page renders", async ({ page }) => {
        await page.goto("/forgot-password");
        await expect(
            page.getByRole("heading", { name: "パスワード再設定" })
        ).toBeVisible();
        await expect(page.getByLabel("Email")).toBeVisible();
    });
});
