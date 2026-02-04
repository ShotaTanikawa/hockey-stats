import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Authenticated dashboard", () => {
    test("login and reach dashboard", async ({ page }) => {
        test.skip(!email || !password, "E2E user credentials not provided");

        await page.goto("/login");
        await page.getByLabel("Email").fill(email!);
        await page.getByLabel("Password").fill(password!);
        await page.getByRole("button", { name: "ログイン" }).click();

        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText("Dashboard")).toBeVisible();
    });
});
