import type { Page } from "@playwright/test";
import { analysisLocators } from "../locators";

/** Navigates to the analysis page and waits for its in-page assistant composer. */
export async function openAnalysis(page: Page): Promise<void> {
  await page.goto("/analysis");
  await page.waitForURL(/\/analysis/);
  await analysisLocators.askComposer(page).waitFor({ state: "visible" });
}
