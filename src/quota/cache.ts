import { LRUCache } from "lru-cache";
import { config } from "../config.js";
import { CACHE_TTL_MS } from "./constants.js";

const cache = new LRUCache<string, object>({
  max: 500,
  ttl: 60_000,
  allowStale: false,
});

function buildKey(method: string, params: Record<string, unknown>): string {
  const sorted = Object.fromEntries(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  );
  return `${method}:${JSON.stringify(sorted)}`;
}

export function getCached<T>(
  method: string,
  params: Record<string, unknown>
): T | undefined {
  const key = buildKey(method, params);
  return cache.get(key) as T | undefined;
}

export function setCached(
  method: string,
  params: Record<string, unknown>,
  value: object
): void {
  const ttl = config.cacheTtlOverride ?? CACHE_TTL_MS[method] ?? 60_000;
  const key = buildKey(method, params);
  cache.set(key, value, { ttl });
}

export function invalidateMethod(method: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${method}:`)) {
      cache.delete(key);
    }
  }
}

export function invalidateRelated(mutatedMethod: string): void {
  const relatedPrefixes: Record<string, string[]> = {
    "playlists.insert": ["playlists.list"],
    "playlists.update": ["playlists.list", "playlists.get"],
    "playlists.delete": ["playlists.list", "playlists.get", "playlistItems.list"],
    "playlistItems.insert": ["playlistItems.list"],
    "playlistItems.update": ["playlistItems.list"],
    "playlistItems.delete": ["playlistItems.list"],
    "videos.insert": ["videos.list"],
    "videos.update": ["videos.list", "videos.get"],
    "videos.delete": ["videos.list", "videos.get"],
    "channels.update": ["channels.list"],
    "channelSections.insert": ["channelSections.list"],
    "channelSections.update": ["channelSections.list"],
    "channelSections.delete": ["channelSections.list"],
    "commentThreads.insert": ["commentThreads.list"],
    "comments.insert": ["comments.list", "commentThreads.list"],
    "comments.delete": ["comments.list", "commentThreads.list"],
    "comments.setModerationStatus": ["commentThreads.list"],
  };

  const prefixes = relatedPrefixes[mutatedMethod] ?? [];
  for (const prefix of prefixes) {
    invalidateMethod(prefix);
  }
}

export function clearAllCache(): void {
  cache.clear();
}
