import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads and routes to login or dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(login|dashboard)$/);
    await expect(
      page.locator('[data-testid="login-title"], [data-testid="dashboard-page"]'),
    ).toHaveCount(1);
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GridSpace/);
  });
});
