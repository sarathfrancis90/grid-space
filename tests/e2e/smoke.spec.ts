import { test, expect } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://localhost:3001";

test.describe("Smoke tests", () => {
  test("backend API health endpoint is reachable", async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/health`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("homepage loads and routes to login or dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(login|dashboard)$/);
    await expect(
      page.locator(
        '[data-testid="login-title"], [data-testid="dashboard-page"]',
      ),
    ).toHaveCount(1);
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/GridSpace/);
  });
});
