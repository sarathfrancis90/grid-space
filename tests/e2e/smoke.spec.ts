import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads and shows GridSpace", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("GridSpace");
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GridSpace/);
  });
});
