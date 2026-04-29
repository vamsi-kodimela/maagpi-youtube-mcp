import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, invalidateMethod, clearAllCache } from "../../../src/quota/cache.js";

describe("quota cache", () => {
  beforeEach(() => {
    clearAllCache();
  });

  it("returns undefined for cache miss", () => {
    expect(getCached("videos.get", { videoId: "abc" })).toBeUndefined();
  });

  it("returns cached value on hit", () => {
    const value = { id: "abc", title: "Test" };
    setCached("videos.get", { videoId: "abc" }, value);
    expect(getCached("videos.get", { videoId: "abc" })).toEqual(value);
  });

  it("treats equivalent params with different key order as the same cache key", () => {
    const value = { result: true };
    setCached("videos.list", { b: 2, a: 1 }, value);
    expect(getCached("videos.list", { a: 1, b: 2 })).toEqual(value);
  });

  it("separates cache entries by method", () => {
    setCached("videos.get", { videoId: "x" }, { method: "videos.get" });
    setCached("playlists.get", { videoId: "x" }, { method: "playlists.get" });
    expect((getCached<{ method: string }>("videos.get", { videoId: "x" }))?.method).toBe("videos.get");
    expect((getCached<{ method: string }>("playlists.get", { videoId: "x" }))?.method).toBe("playlists.get");
  });

  it("invalidates by method prefix", () => {
    setCached("videos.list", { q: "test" }, { items: [] });
    setCached("videos.get", { videoId: "x" }, { id: "x" });
    invalidateMethod("videos.list");
    expect(getCached("videos.list", { q: "test" })).toBeUndefined();
    expect(getCached("videos.get", { videoId: "x" })).toBeDefined();
  });
});
