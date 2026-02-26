import { Page, expect } from "@playwright/test";

/**
 * Type a value into a cell at the given column and row.
 * Column is 0-indexed (A=0, B=1, etc), row is 0-indexed.
 */
export async function typeInCell(
  page: Page,
  col: number,
  row: number,
  value: string,
): Promise<void> {
  const cell = page.locator(`[data-testid="cell-${col}-${row}"]`);
  await cell.dblclick();
  await page.keyboard.type(value);
  await page.keyboard.press("Enter");
}

/**
 * Assert that a cell displays the expected value.
 */
export async function expectCellValue(
  page: Page,
  col: number,
  row: number,
  expected: string,
): Promise<void> {
  const cell = page.locator(`[data-testid="cell-${col}-${row}"]`);
  await expect(cell).toHaveText(expected);
}

/**
 * Login as the default test user.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill('[data-testid="email-input"]', "test@gridspace.dev");
  await page.fill('[data-testid="password-input"]', "testpassword123");
  await page.click('[data-testid="login-button"]');
  await page.waitForURL("/dashboard");
}
