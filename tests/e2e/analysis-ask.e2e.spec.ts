import { expect, test } from "@playwright/test";
import { openAnalysis } from "../../framework/ui/actions/analysis";
import { analysisLocators } from "../../framework/ui/locators";

/** Analysis journey: authenticated user reaches the page and its in-page composer is editable. */
test.describe("analysis page", () => {
  test(
    "authenticated user lands on analysis with a usable ask composer",
    { tag: ["@e2e"] },
    async ({ page }) => {
      await openAnalysis(page);

      const composer = analysisLocators.askComposer(page);
      await expect(composer).toBeVisible();
      await composer.fill("What changed in coverage this week?");
      await expect(composer).toHaveValue(/coverage/i);
    },
  );
});
