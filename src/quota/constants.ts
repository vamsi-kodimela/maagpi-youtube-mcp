export const QUOTA_COSTS: Record<string, number> = {
  // Videos
  "videos.list": 1,
  "videos.insert": 1600,
  "videos.update": 50,
  "videos.delete": 50,
  "videos.rate": 50,
  "thumbnails.set": 50,

  // Playlists
  "playlists.list": 1,
  "playlists.insert": 50,
  "playlists.update": 50,
  "playlists.delete": 50,
  "playlistItems.list": 1,
  "playlistItems.insert": 50,
  "playlistItems.update": 50,
  "playlistItems.delete": 50,

  // Comments
  "commentThreads.list": 1,
  "commentThreads.insert": 50,
  "comments.list": 1,
  "comments.insert": 50,
  "comments.update": 50,
  "comments.delete": 50,
  "comments.setModerationStatus": 50,

  // Channels
  "channels.list": 1,
  "channels.update": 50,
  "channelSections.list": 1,
  "channelSections.insert": 50,
  "channelSections.update": 50,
  "channelSections.delete": 50,
  "watermarks.set": 50,
  "watermarks.unset": 50,

  // Analytics (separate quota pool, very cheap)
  "youtubeAnalytics.reports.query": 1,
};

export const CACHE_TTL_MS: Record<string, number> = {
  "videos.list": 60_000,
  "videos.get": 120_000,
  "playlists.list": 60_000,
  "playlists.get": 120_000,
  "playlistItems.list": 30_000,
  "channels.list": 300_000,
  "commentThreads.list": 15_000,
  "youtubeAnalytics.reports.query": 300_000,
};
