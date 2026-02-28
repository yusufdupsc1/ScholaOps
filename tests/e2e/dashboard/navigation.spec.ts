import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "admin@school.edu");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30000 });
}

test.describe.skip("Dashboard responsive navigation", () => {
  test.setTimeout(180000);

  test("shows primary sidebar nav on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);

    await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeHidden();
  });

  test("shows mobile bottom nav on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeVisible();
  });
});
