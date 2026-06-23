import { test, expect } from "@playwright/test";
import { openDiscovery, openFirstFeed } from "../../framework/ui/actions";
import { discoveryLocators, keyTopicLocators } from "../../framework/ui/locators";

// Authenticated via seeded storageState (smoke project).
test("discovery shows the narrative clusters view", { tag: ["@smoke"] }, async ({ page }) => {
  await page.goto("/discovery");
  await expect(discoveryLocators.narrativeClustersTab(page)).toBeVisible({ timeout: 30_000 });
  await expect(discoveryLocators.search(page)).toBeVisible();
});

test("authenticated user lands on discovery", { tag: ["@smoke"] }, async ({ page }) => {
  await openDiscovery(page);
  await expect(discoveryLocators.firstFeedCard(page)).toBeVisible();
});

test("opening a feed lands on its articles view", { tag: ["@smoke"] }, async ({ page }) => {
  await page.goto("/discovery");
  await openFirstFeed(page);
  await expect(discoveryLocators.articleRow(page).first()).toBeVisible();
});

test(
  "selecting a Key Topic filters the feed via URL search params",
  { tag: ["@smoke"] },
  async ({ page }) => {
    await page.goto("/discovery");
    await discoveryLocators.firstFeedCard(page).click();
    await page.waitForURL(/\/discovery\/\d+/);

    await keyTopicLocators.accordionTrigger(page).click();
    await keyTopicLocators.firstItem(page).click();

    await expect(page).toHaveURL(/selected=.*KEY_MESSAGE/);
    await expect(page).toHaveURL(/%22KEY_MESSAGE%22/);
  },
);
