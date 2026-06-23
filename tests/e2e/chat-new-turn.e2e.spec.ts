import { expect, test } from "@playwright/test";
import { startNewChat } from "../../framework/ui/actions/chat";
import { chatLocators } from "../../framework/ui/locators";

/** New chat: the route loads an empty, usable composer without submitting to the live LLM. */
test.describe("new chat", () => {
  test("new-chat route exposes an empty, usable composer", { tag: ["@e2e"] }, async ({ page }) => {
    await startNewChat(page);

    const composer = chatLocators.composer(page);
    await expect(composer).toBeVisible();
    await composer.fill("Summarize today's top stories about our brand.");
    await expect(composer).toHaveValue(/top stories/i);
  });
});
