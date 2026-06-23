import { expect, test } from "@playwright/test";
import { openDiscovery, openFirstFeed } from "../../framework/ui/actions/discovery";
import { keyTopicLocators } from "../../framework/ui/locators";

/** Key Message creation: open the form gate from a feed's Key Topics area. */
test.describe("key message management", () => {
  test("creating a key message surfaces the name input form", { tag: ["@e2e"] }, async ({ page }) => {
    await openDiscovery(page);
    await openFirstFeed(page);

    await keyTopicLocators.accordionTrigger(page).click();
    await keyTopicLocators.newKeyMessageButton(page).click();

    await expect(keyTopicLocators.keyMessageNameInput(page)).toBeVisible();
  });
});
