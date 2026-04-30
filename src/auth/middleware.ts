import type { OAuth2Client } from "google-auth-library";
import { createAuthenticatedClient } from "./oauth.js";
import { tokenStore } from "./token-store.js";
import { YouTubeMcpError } from "../errors/types.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";

const _clients = new Map<string, OAuth2Client>();

export async function getAuthClient(channel?: string): Promise<OAuth2Client> {
  const profileName = channel ?? tokenStore.getActiveProfileName();
  const stored = tokenStore.get(profileName);
  if (_clients.has(profileName) && stored && tokenStore.isExpired(stored)) {
    _clients.delete(profileName);
  }
  if (!_clients.has(profileName)) {
    const client = await createAuthenticatedClient(profileName);
    _clients.set(profileName, client);
  }
  return _clients.get(profileName)!;
}

export function resetAuthClient(channel?: string): void {
  if (channel) {
    _clients.delete(channel);
  } else {
    _clients.delete(tokenStore.getActiveProfileName());
  }
}

export function resetAllAuthClients(): void {
  _clients.clear();
}

export async function withAuthRetry<T>(fn: (auth: OAuth2Client) => Promise<T>, channel?: string): Promise<T> {
  const auth = await getAuthClient(channel);
  try {
    return await fn(auth);
  } catch (err) {
    if (
      err instanceof YouTubeMcpError &&
      (err.code === YouTubeMcpErrorCode.AUTH_TOKEN_EXPIRED ||
        err.code === YouTubeMcpErrorCode.AUTH_REQUIRED)
    ) {
      resetAuthClient(channel);
      const freshAuth = await getAuthClient(channel);
      return fn(freshAuth);
    }
    throw err;
  }
}
