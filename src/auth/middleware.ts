import type { OAuth2Client } from "google-auth-library";
import { createAuthenticatedClient } from "./oauth.js";
import { tokenStore } from "./token-store.js";
import { YouTubeMcpError } from "../errors/types.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";

let _client: OAuth2Client | null = null;

export async function getAuthClient(): Promise<OAuth2Client> {
  const stored = tokenStore.get();
  if (_client && stored && tokenStore.isExpired(stored)) {
    _client = null;
  }
  if (!_client) {
    _client = await createAuthenticatedClient();
  }
  return _client;
}

export function resetAuthClient(): void {
  _client = null;
}

export async function withAuthRetry<T>(fn: (auth: OAuth2Client) => Promise<T>): Promise<T> {
  const auth = await getAuthClient();
  try {
    return await fn(auth);
  } catch (err) {
    if (
      err instanceof YouTubeMcpError &&
      (err.code === YouTubeMcpErrorCode.AUTH_TOKEN_EXPIRED ||
        err.code === YouTubeMcpErrorCode.AUTH_REQUIRED)
    ) {
      resetAuthClient();
      const freshAuth = await getAuthClient();
      return fn(freshAuth);
    }
    throw err;
  }
}
