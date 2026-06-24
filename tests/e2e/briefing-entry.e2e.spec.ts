import { expect, test } from "@playwright/test";
import { openBriefing } from "../../framework/ui/actions/briefing";
import { briefingLocators } from "../../framework/ui/locators";

/** Briefing: the page loads with its "Get a briefing" entry point. */
test.describe("briefing entry", () => {
  test("briefing page exposes the Get a briefing entry point", { tag: ["@e2e"] }, async ({ page }) => {
    await openBriefing(page);

    await expect(briefingLocators.getBriefingCta(page)).toBeVisible();
  });
});
