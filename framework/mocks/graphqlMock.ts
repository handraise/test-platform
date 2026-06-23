import type { Page, Route } from "@playwright/test";

export type GraphQLMockOptions = {
  operationName: string;
  response: unknown;
};

/** Matches the GraphQL endpoint with or without a trailing slash and query string. */
const GRAPHQL_URL = /\/graphql\/?(\?|$)/;

/** Typed page.route wrapper for GraphQL stubbing. */
export async function mockGraphQL(page: Page, options: GraphQLMockOptions): Promise<void> {
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON() as { operationName?: string } | null;

    if (postData?.operationName === options.operationName) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: options.response }),
      });
      return;
    }

    await route.continue();
  });
}
