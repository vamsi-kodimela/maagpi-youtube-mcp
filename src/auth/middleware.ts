import type { OAuth2Client } from "google-auth-library";
import { createAuthenticatedClient } from "./oauth.js";

let _client: OAuth2Client | null = null;

export async function getAuthClient(): Promise<OAuth2Client> {
  if (!_client) {
    _client = await createAuthenticatedClient();
  }
  return _client;
}

export function resetAuthClient(): void {
  _client = null;
}
