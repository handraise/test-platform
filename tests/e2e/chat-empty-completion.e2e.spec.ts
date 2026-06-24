import { expect, test } from "@playwright/test";
import {
  EMPTY_ASSISTANT_PLACEHOLDER,
  EMPTY_COMPLETION_CONVERSATION_ID,
  emptyCompletionConversation,
} from "../../framework/data/graphqlFixtures";
import { mockChatResumeNoActiveStream } from "../../framework/mocks/chatStreamMock";
import { mockGraphQL } from "../../framework/mocks/graphqlMock";
import { openConversation } from "../../framework/ui/actions/chat";
import { chatLocators } from "../../framework/ui/locators";

/** Reload of a conversation whose last assistant turn completed but emitted no renderable content. */
test.describe("chat empty-completion reload", () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphQL(page, {
      operationName: "getConversationMessages",
      response: emptyCompletionConversation,
    });
    await mockChatResumeNoActiveStream(page);
  });

  test(
    "reloaded empty-completion turn renders the placeholder without a retry control",
    { tag: ["@e2e"] },
    async ({ page }) => {
      await openConversation(page, EMPTY_COMPLETION_CONVERSATION_ID);

      await expect(chatLocators.assistantResponse(page)).toContainText(EMPTY_ASSISTANT_PLACEHOLDER);
      await expect(chatLocators.retryButton(page)).toHaveCount(0);
    },
  );

  test.fixme(
    "reloaded empty-completion turn offers a retry affordance",
    { tag: ["@e2e"] },
    async ({ page }) => {
      await openConversation(page, EMPTY_COMPLETION_CONVERSATION_ID);

      await expect(chatLocators.retryButton(page)).toBeVisible();
    },
  );
});
