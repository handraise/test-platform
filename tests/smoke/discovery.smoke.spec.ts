import { test, expect } from "@playwright/test";
import { discoveryLocators } from "../../framework/ui/locators";

// Authenticated via seeded storageState (smoke project).
test("discovery shows the narrative clusters view", { tag: ["@smoke"] }, async ({ page }) => {
  await page.goto("/discovery");
  await expect(discoveryLocators.narrativeClustersTab(page)).toBeVisible({ timeout: 30_000 });
  await expect(discoveryLocators.search(page)).toBeVisible();
});
