import { test, expect } from "@playwright/test";
import { login } from "../../framework/ui/actions";
import { chatLocators } from "../../framework/ui/locators";

// UI login is tested directly here, exactly once. Start from a clean context
// (ignore the seeded storageState) so this exercises the real login flow.
test.use({ storageState: { cookies: [], origins: [] } });

test("user logs in and lands on chat", { tag: ["@smoke"] }, async ({ page }) => {
  await login(page, {
    email: process.env.HANDRAISE_EMAIL!,
    password: process.env.HANDRAISE_PASSWORD!,
  });
  await expect(page).toHaveURL(/\/chat\//);
  await expect(chatLocators.composer(page)).toBeVisible();
});
