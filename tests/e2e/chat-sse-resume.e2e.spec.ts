import { expect, test } from "@playwright/test";
import {
  RECOVERED_ASSISTANT_TEXT,
  RECOVERED_TURN_CONVERSATION_ID,
  recoveredTurnConversation,
} from "../../framework/data/graphqlFixtures";
import { mockChatResumeNoActiveStream } from "../../framework/mocks/chatStreamMock";
import { mockGraphQL } from "../../framework/mocks/graphqlMock";
import { openConversation } from "../../framework/ui/actions/chat";
import { chatLocators } from "../../framework/ui/locators";

/** Mid-stream SSE drop recovery: user-visible reload outcome. */
test.describe("chat mid-stream SSE recovery", () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphQL(page, {
      operationName: "getConversationMessages",
      response: recoveredTurnConversation,
    });
    await mockChatResumeNoActiveStream(page);
  });

  test(
    "reloaded conversation shows the recovered answer without a retry control",
    { tag: ["@e2e"] },
    async ({ page }) => {
      await openConversation(page, RECOVERED_TURN_CONVERSATION_ID);

      await expect(chatLocators.assistantResponse(page)).toContainText(RECOVERED_ASSISTANT_TEXT);
      await expect(chatLocators.retryButton(page)).toHaveCount(0);
    },
  );
});
