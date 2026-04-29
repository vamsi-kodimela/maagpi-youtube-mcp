import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockStoredTokens, expiredTokens } from "../../fixtures/auth.js";

vi.mock("conf", () => {
  let store: Record<string, unknown> = {};
  const MockConf = vi.fn().mockImplementation(() => ({
    get: (key: string) => store[key],
    set: (key: string, value: unknown) => { store[key] = value; },
    delete: (key: string) => { delete store[key]; },
    get path() { return "/mock/config.json"; },
  }));
  return { default: MockConf };
});

const { tokenStore } = await import("../../../src/auth/token-store.js");

describe("tokenStore", () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it("returns undefined when no tokens stored", () => {
    expect(tokenStore.get()).toBeUndefined();
  });

  it("persists and retrieves tokens", () => {
    const tokens = mockStoredTokens();
    tokenStore.set(tokens);
    expect(tokenStore.get()).toEqual(tokens);
  });

  it("clears tokens", () => {
    tokenStore.set(mockStoredTokens());
    tokenStore.clear();
    expect(tokenStore.get()).toBeUndefined();
  });

  it("isExpired returns false for valid token", () => {
    const tokens = mockStoredTokens();
    expect(tokenStore.isExpired(tokens)).toBe(false);
  });

  it("isExpired returns true for expired token", () => {
    expect(tokenStore.isExpired(expiredTokens())).toBe(true);
  });

  it("hasRefreshToken returns true when refresh token exists", () => {
    tokenStore.set(mockStoredTokens());
    expect(tokenStore.hasRefreshToken()).toBe(true);
  });

  it("hasRefreshToken returns false when no tokens", () => {
    expect(tokenStore.hasRefreshToken()).toBe(false);
  });

  it("configPath returns a string", () => {
    expect(typeof tokenStore.configPath()).toBe("string");
  });
});
