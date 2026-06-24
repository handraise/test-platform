import type { Page } from "@playwright/test";
import { briefingLocators } from "../locators";

/** Navigates to the briefing page and waits for its "Get a briefing" entry point. */
export async function openBriefing(page: Page): Promise<void> {
  await page.goto("/briefing");
  await page.waitForURL(/\/briefing/);
  await briefingLocators.getBriefingCta(page).waitFor({ state: "visible" });
}
