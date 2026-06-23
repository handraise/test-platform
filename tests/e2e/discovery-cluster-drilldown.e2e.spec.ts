import { expect, test } from "@playwright/test";
import { openDiscovery, openFirstFeed } from "../../framework/ui/actions/discovery";
import { discoveryLocators } from "../../framework/ui/locators";

/** Discovery drilldown: discovery -> open a feed -> land on content. */
test.describe("discovery cluster drilldown", () => {
  test(
    "opening a feed lands on its clusters/articles view with content",
    { tag: ["@e2e"] },
    async ({ page }) => {
      await openDiscovery(page);
      await expect(discoveryLocators.firstFeedCard(page)).toBeVisible();

      await openFirstFeed(page);

      await expect(page).toHaveURL(/\/discovery\/\d+(\/(articles|clusters))?/);
      await expect(discoveryLocators.articleRow(page).first()).toBeVisible();
    },
  );
});
