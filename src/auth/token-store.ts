import Conf from "conf";
import type { StoredTokens } from "./types.js";

const TOKEN_KEY = "tokens";
const EXPIRY_BUFFER_MS = 60_000;

const store = new Conf<{ tokens?: StoredTokens }>({
  projectName: "maagpi-youtube-mcp",
  projectVersion: "1",
});

export const tokenStore = {
  get(): StoredTokens | undefined {
    return store.get(TOKEN_KEY);
  },

  set(tokens: StoredTokens): void {
    store.set(TOKEN_KEY, tokens);
  },

  clear(): void {
    store.delete(TOKEN_KEY);
  },

  isExpired(tokens: StoredTokens): boolean {
    return tokens.expiry_date < Date.now() + EXPIRY_BUFFER_MS;
  },

  hasRefreshToken(): boolean {
    const tokens = store.get(TOKEN_KEY);
    return !!tokens?.refresh_token;
  },

  configPath(): string {
    return store.path;
  },
};
