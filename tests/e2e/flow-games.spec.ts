import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Game management", () => {
    test("create and delete a game", async ({ page }) => {
        test.skip(!email || !password, "E2E user credentials not provided");

        const today = new Date();
        const dateString = today.toISOString().slice(0, 10);
        const opponent = `E2E Opponent ${Date.now()}`;

        await page.goto("/login");
        await page.getByLabel("Email").fill(email!);
        await page.getByLabel("Password").fill(password!);
        await page.getByRole("button", { name: "ログイン" }).click();
        await expect(page).toHaveURL(/\/dashboard/);

        await page.goto("/dashboard/games");
        await page.getByRole("button", { name: "＋ 新規作成" }).click();
        await page.getByLabel("試合日").fill(dateString);
        await page.getByLabel("対戦相手").fill(opponent);
        await page.getByRole("button", { name: "作成" }).click();

        const row = page.getByText(`vs ${opponent}`).first();
        await expect(row).toBeVisible();

        const card = row.locator("xpath=ancestor::div[@data-slot='card']");
        await card.getByRole("link", { name: "詳細" }).click();

        await page.getByRole("button", { name: "試合編集" }).click();
        page.on("dialog", (dialog) => dialog.accept());
        await page.getByRole("button", { name: "削除" }).click();

        await expect(page).toHaveURL(/\/dashboard\/games/);
        await expect(page.getByText(`vs ${opponent}`)).toHaveCount(0);
    });
});
