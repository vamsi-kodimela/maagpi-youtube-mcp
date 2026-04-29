import type { StoredTokens } from "../../src/auth/types.js";

export function mockStoredTokens(overrides: Partial<StoredTokens> = {}): StoredTokens {
  return {
    access_token: "mock_access_token",
    refresh_token: "mock_refresh_token",
    expiry_date: Date.now() + 3600 * 1000,
    scope: "https://www.googleapis.com/auth/youtube",
    token_type: "Bearer",
    stored_at: Date.now(),
    ...overrides,
  };
}

export function expiredTokens(): StoredTokens {
  return mockStoredTokens({ expiry_date: Date.now() - 1000 });
}
