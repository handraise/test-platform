import { test, expect } from "@playwright/test";

const BASE = "https://naapp-stage2.handraise.site";

test("User can log in (Playwright)", async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);

  await page
    .getByRole("textbox", { name: "Email" })
    .fill(process.env.HANDRAISE_EMAIL!);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(process.env.HANDRAISE_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/discovery/, { timeout: 30_000 });
  await expect(
    page.getByRole("link", { name: "Narrative Clusters" }),
  ).toBeVisible();
});

test("Chat lists available feeds (Playwright)", async ({ page }) => {
  await page.goto(`${BASE}/auth/login`);
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(process.env.HANDRAISE_EMAIL!);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(process.env.HANDRAISE_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/discovery/, { timeout: 30_000 });

  await page.getByRole("button", { name: "Chat" }).click();
  await expect(page).toHaveURL(/chat/, { timeout: 30_000 });

  await page
    .getByRole("textbox", { name: /Ask anything/i })
    .fill("List all of available feeds");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("Datadog")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("WP Engine")).toBeVisible();
});
