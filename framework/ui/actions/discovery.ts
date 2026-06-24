import type { Page } from "@playwright/test";
import { discoveryLocators } from "../locators";

/** Navigates to discovery and verifies the page loaded. */
export async function openDiscovery(page: Page): Promise<void> {
  await page.goto("/discovery");
  await page.waitForURL(/\/discovery/);
}

/** Opens the first feed card and waits for the articles/clusters route. */
export async function openFirstFeed(page: Page): Promise<void> {
  await discoveryLocators.firstFeedCard(page).click();
  await page.waitForURL(/\/discovery\/\d+(\/(articles|clusters))?$/);
}
