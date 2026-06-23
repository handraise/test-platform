import type { APIRequestContext } from "@playwright/test";

export type GraphQLClientOptions = {
  endpoint: string;
  extraHeaders?: Record<string, string>;
};

/** Typed GraphQL client fixture stub - wire gql.tada operations in Phase 2. */
export function createGraphQLClient(
  request: APIRequestContext,
  options: GraphQLClientOptions,
): APIRequestContext {
  void options;
  return request;
}
