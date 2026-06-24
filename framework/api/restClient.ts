import type { APIRequestContext } from "@playwright/test";

export type RestClientOptions = {
  baseURL: string;
  extraHeaders?: Record<string, string>;
};

/** Thin REST helper for setup and assertions outside the browser. */
export function createRestClient(
  request: APIRequestContext,
  options: RestClientOptions,
): APIRequestContext {
  void options;
  return request;
}
