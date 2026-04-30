# maagpi-youtube-mcp

YouTube Data API v3 + Analytics API MCP server. Full channel management for AI agents and developers — upload videos, schedule publishing, query analytics, moderate comments, manage playlists, update channel branding, and manage **multiple YouTube channels simultaneously**.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
  - [Multiple Channels](#multiple-channels)
  - [Videos](#videos)
  - [Scheduling & Publishing](#scheduling--publishing)
  - [Analytics](#analytics)
  - [Comments](#comments)
  - [Playlists](#playlists)
  - [Channel Management](#channel-management)
- [Tools Reference](#tools-reference)
- [Transport](#transport)
- [Quota](#quota)
- [Error Format](#error-format)
- [Development](#development)
- [Environment Variables](#environment-variables)

---

## Quick Start

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Library** — enable:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
2. Go to **APIs & Services → OAuth consent screen** → External → fill in app name + your email → add your Google account as a **Test user**
3. Go to **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
   - Application type: **Desktop app**
   - Copy the **Client ID** and **Client Secret**

### 2. Configure

```bash
cp .env.example .env
# Edit .env — set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET
```

### 3. Add to Claude Code

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**First run:** When you call any tool for the first time, a browser window opens for Google OAuth consent. Approve it, and tokens are saved automatically to your OS config directory under the `"default"` profile. All subsequent calls reuse the stored tokens and auto-refresh them.

**Adding more channels:** Use `youtube_account_add` at any time to connect additional YouTube accounts — see [Multiple Channels](#multiple-channels) below.

---

## Usage Guide

All examples below are natural language prompts you can send to Claude once the MCP server is connected.

---

### Multiple Channels

You can connect multiple YouTube accounts and target any of them from any tool using the optional `channel` parameter. No switching required — all channels are usable simultaneously.

**Connect a second channel**
```
Add a new YouTube channel profile named "gaming"
```
> A browser window opens for the second account's OAuth consent. Tokens are saved under the `"gaming"` profile.

**List all connected channels**
```
List all my connected YouTube channel profiles
```

**Use a specific channel in any tool**
```
Get channel details for my "gaming" profile
```
```
Upload /videos/clip.mp4 to my "gaming" channel with title "Let's Play Episode 1", set to unlisted
```
```
Get top 5 videos by views in Q1 2025 for my "main" channel,
and also get the top 5 for my "gaming" channel
```

**Switch the default channel**
```
Switch my active YouTube profile to "gaming"
```
> After switching, all tools without an explicit `channel` parameter use the new active profile.

**Show current active channel**
```
Which YouTube channel am I currently working with?
```

**Remove a channel**
```
Remove the "old-channel" profile (confirmed)
```

**CLI: authenticate a named profile**
```bash
npm run auth -- --channel gaming
```

---

### Videos

**Upload a video**
```
Upload /Users/me/videos/tutorial.mp4 with title "Getting Started with TypeScript",
description "A beginner's guide", tags ["typescript", "programming"], set it to unlisted.
```

**Upload to a specific channel**
```
Upload /Users/me/videos/clip.mp4 to my "gaming" channel, title "Let's Play EP1", public
```

**Get video details**
```
Get the details for video dQw4w9WgXcQ
```

**Search your channel**
```
List my last 10 videos ordered by date
```

**Update metadata**
```
Update video dQw4w9WgXcQ — change the title to "TypeScript Tutorial 2025"
and add the tag "tutorial"
```

**Set a thumbnail**
```
Set the thumbnail for video dQw4w9WgXcQ to /Users/me/thumbnails/thumb.jpg
```

**Delete a video**
```
Delete video dQw4w9WgXcQ (I confirm this is intentional)
```
> Tools that delete data require `confirm: true` — Claude will ask before proceeding.

---

### Scheduling & Publishing

**Publish immediately**
```
Make video dQw4w9WgXcQ public
```

**Schedule for later**
```
Schedule video dQw4w9WgXcQ to go public on January 20 2026 at 3pm UTC
```

**Set as Premiere**
```
Set video dQw4w9WgXcQ as a YouTube Premiere on February 1 2026 at 6pm UTC
with a countdown
```

**Change to unlisted**
```
Set video dQw4w9WgXcQ to unlisted
```

---

### Analytics

Analytics uses the **YouTube Analytics API** (separate from the Data API) and returns raw tabular data. Dates must be in `YYYY-MM-DD` format.

**Video performance**
```
Get views, watchTime, and averageViewDuration for video dQw4w9WgXcQ
from 2025-01-01 to 2025-01-31
```

**Channel summary**
```
Show me channel views, subscribersGained, and estimatedRevenue
for the last 30 days (2025-01-01 to 2025-01-31)
```

**Compare two channels**
```
Get views and subscribersGained for Jan 2025 on my "main" channel,
and also for my "gaming" channel
```

**Top performing videos**
```
What were my top 5 videos by views in Q4 2024?
(use youtube_analytics_top_videos with startDate 2024-10-01, endDate 2024-12-31,
metric "views", maxResults 5)
```

**Audience retention**
```
Get audience retention curve for video dQw4w9WgXcQ for January 2025
```

**Revenue report**
```
Show me my revenue breakdown for 2025-01-01 to 2025-01-31, split by day
```

**Available video metrics:** `views`, `watchTime`, `averageViewDuration`, `averageViewPercentage`, `likes`, `shares`, `subscribersGained`, `subscribersLost`, `annotationClickThroughRate`, `cardClickRate`, and more.

**Available channel metrics:** All video metrics plus `estimatedRevenue`, `estimatedAdRevenue`, `grossRevenue`, `monetizedPlaybacks`, `cpm`, `adImpressions`.

---

### Comments

**List comments**
```
Show me the top 20 comments on video dQw4w9WgXcQ ordered by relevance
```

**Search comments**
```
Find comments mentioning "bug" on video dQw4w9WgXcQ
```

**Reply to a comment**
```
Reply to comment Ugxxxxx with "Thanks for the feedback! Fixed in v2."
```

**Moderate comments**
```
Hold comment Ugxxxxx for review
```

```
Reject comment Ugxxxxx and ban the author from commenting on my channel
```

**Moderation statuses:** `published` (approve), `heldForReview`, `rejected` (removes from public view).

---

### Playlists

**Create a playlist**
```
Create a public playlist called "TypeScript Tutorials 2025"
with description "All my TypeScript content"
```

**Add videos**
```
Add video dQw4w9WgXcQ to playlist PLxxxxx at position 0
```

**List playlist contents**
```
Show all videos in playlist PLxxxxx
```

**Reorder a video**
```
Move playlist item PLItemxxxxx to position 2 in playlist PLxxxxx
```
> Note: `youtube_playlist_item_reorder` takes the **playlistItem ID** (returned by `youtube_playlist_items_list`), not the video ID.

**Remove a video**
```
Remove playlist item PLItemxxxxx from its playlist
```

**Delete a playlist**
```
Delete playlist PLxxxxx (confirmed)
```

---

### Channel Management

**View your channel**
```
Get my channel details including statistics and branding settings
```

**Update channel info**
```
Update my channel description to "Weekly TypeScript and Node.js tutorials"
and set keywords to ["typescript", "nodejs", "programming"]
```

**Update branding**
```
Update my channel branding — set featuredChannelsTitle to "Related Channels"
and enable showRelatedChannels
```

**Set a watermark**
```
Set watermark from /Users/me/watermark.png on channel UCxxxxx,
position bottom-right corner, show from 10 seconds until end of video
(offsetMs: 10000, durationMs: 0 means show until end)
```

**Channel sections**
```
List all sections on my channel homepage
```

```
Create a new "singlePlaylist" section titled "Featured Series"
featuring playlist PLxxxxx
```

---

## Tools Reference

> All tools accept an optional `channel` parameter (profile name). Omit it to use the active profile.

### Account Management
| Tool | Key Parameters | Description |
|---|---|---|
| `youtube_account_add` | `name` | Connect a new YouTube channel via OAuth, saved as a named profile |
| `youtube_account_list` | — | List all connected channel profiles with their IDs and active status |
| `youtube_account_switch` | `name` | Set the default active profile (used when `channel` is omitted) |
| `youtube_account_current` | — | Show the currently active profile |
| `youtube_account_remove` | `name`, `confirm: true` | Disconnect and remove a channel profile |

### Video Management
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_video_upload` | `filePath`, `title`, `privacyStatus`, `channel?` | 1600 |
| `youtube_video_get` | `videoId`, `parts?`, `channel?` | 1 |
| `youtube_video_list` | `channelId?`, `query?`, `order?`, `maxResults?`, `channel?` | 1 |
| `youtube_video_update` | `videoId`, `title?`, `description?`, `tags?`, `channel?` | 50 |
| `youtube_video_delete` | `videoId`, `confirm: true`, `channel?` | 50 |
| `youtube_video_rate` | `videoId`, `rating` (like/dislike/none), `channel?` | 50 |
| `youtube_video_set_thumbnail` | `videoId`, `thumbnailPath`, `channel?` | 50 |

### Scheduling & Publishing
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_video_set_privacy` | `videoId`, `privacyStatus`, `channel?` | 50 |
| `youtube_video_schedule_publish` | `videoId`, `publishAt` (ISO8601 future), `channel?` | 50 |
| `youtube_video_set_premiere` | `videoId`, `premiereAt` (ISO8601 future), `channel?` | 50 |

### Analytics
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_analytics_video_metrics` | `videoId`, `startDate`, `endDate`, `metrics[]`, `channel?` | 1 |
| `youtube_analytics_channel_metrics` | `startDate`, `endDate`, `metrics[]`, `channel?` | 1 |
| `youtube_analytics_top_videos` | `startDate`, `endDate`, `metric`, `maxResults?`, `channel?` | 1 |
| `youtube_analytics_audience_retention` | `videoId`, `startDate`, `endDate`, `channel?` | 1 |
| `youtube_analytics_revenue_report` | `startDate`, `endDate`, `dimensions?`, `channel?` | 1 |

### Comments
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_comment_list` | `videoId`, `maxResults?`, `order?`, `searchTerms?`, `channel?` | 1 |
| `youtube_comment_thread_get` | `commentThreadId`, `maxReplies?`, `channel?` | 1 |
| `youtube_comment_reply` | `parentCommentId`, `text`, `channel?` | 50 |
| `youtube_comment_delete` | `commentId`, `channel?` | 50 |
| `youtube_comment_moderate` | `commentId`, `moderationStatus`, `banAuthor?`, `channel?` | 50 |

### Playlists
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_playlist_create` | `title`, `privacyStatus`, `channel?` | 50 |
| `youtube_playlist_update` | `playlistId`, `title?`, `description?`, `channel?` | 50 |
| `youtube_playlist_delete` | `playlistId`, `confirm: true`, `channel?` | 50 |
| `youtube_playlist_get` | `playlistId`, `channel?` | 1 |
| `youtube_playlist_list` | `channelId?`, `maxResults?`, `channel?` | 1 |
| `youtube_playlist_item_add` | `playlistId`, `videoId`, `position?`, `channel?` | 50 |
| `youtube_playlist_item_remove` | `playlistItemId`, `channel?` | 50 |
| `youtube_playlist_item_reorder` | `playlistItemId`, `playlistId`, `newPosition`, `channel?` | 50 |
| `youtube_playlist_items_list` | `playlistId`, `maxResults?`, `channel?` | 1 |

### Channel Management
| Tool | Key Parameters | Quota Cost |
|---|---|---|
| `youtube_channel_get` | `parts?`, `channel?` | 1 |
| `youtube_channel_update` | `title?`, `description?`, `keywords?`, `country?`, `channel?` | 50 |
| `youtube_channel_branding_update` | `showRelatedChannels?`, `featuredChannelsTitle?`, `channel?` | 50 |
| `youtube_channel_watermark_set` | `channelId`, `imagePath`, `position`, `timing`, `channel?` | 50 |
| `youtube_channel_watermark_unset` | `channelId`, `channel?` | 50 |
| `youtube_channel_section_list` | `channelId?`, `channel?` | 1 |
| `youtube_channel_section_create` | `type`, `title?`, `playlistIds?`, `channel?` | 50 |
| `youtube_channel_section_delete` | `sectionId`, `channel?` | 50 |

---

## Transport

```bash
# stdio (default — for Claude Code / Claude Desktop)
YOUTUBE_MCP_TRANSPORT=stdio npx maagpi-youtube-mcp

# HTTP (for multi-client or remote access)
YOUTUBE_MCP_TRANSPORT=http YOUTUBE_MCP_HTTP_PORT=3000 npx maagpi-youtube-mcp
# MCP endpoint: POST http://127.0.0.1:3000/mcp
# Health check:  GET  http://127.0.0.1:3000/health
```

---

## Quota

The YouTube Data API v3 gives you **10,000 units/day** by default. Every tool response includes a `quota` field so you always know where you stand:

```json
{
  "quota": {
    "used": 151,
    "budget": 9000,
    "remaining": 8849,
    "resetAt": "2025-01-15T08:00:00.000Z",
    "warningLevel": "ok",
    "costOfThisCall": 1
  }
}
```

`warningLevel` transitions: `"ok"` → `"warn"` at 80% → `"critical"` at 95%.

**Quota costs at a glance:**
- `videos.insert` (upload): **1,600 units** — by far the most expensive
- Most writes (update/delete/insert): **50 units**
- All reads (list/get): **1 unit**
- Analytics queries: **1 unit** (separate quota pool)

**Built-in protections:**
- GET responses are cached (videos 60s, channels 5min, analytics 5min) — repeat reads cost 0 quota
- All writes automatically retry on 429/5xx with exponential backoff (up to 3×)
- Set `YOUTUBE_MCP_QUOTA_LIMIT` lower than 10,000 to leave headroom for other API consumers

---

## Error Format

All errors are returned as structured tool content — AI agents can read and act on them without crashing:

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "YouTube API daily quota has been exceeded.",
    "suggestedFix": "Wait for quota reset at midnight Pacific Time, or increase your quota in Google Cloud Console.",
    "retryable": false,
    "docsUrl": "https://developers.google.com/youtube/v3/getting-started#quota"
  },
  "quota": { "used": 9001, "warningLevel": "critical", ... }
}
```

**Error codes:**

| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | No stored tokens — OAuth flow needed |
| `AUTH_TOKEN_EXPIRED` | Token expired and refresh failed — re-authenticate |
| `AUTH_INSUFFICIENT_SCOPE` | Missing OAuth scope — delete tokens and re-auth |
| `QUOTA_EXCEEDED` | Daily quota exhausted — wait for midnight PT reset |
| `PERMISSION_DENIED` | Resource not owned by authenticated account |
| `VIDEO_NOT_FOUND` | Video ID doesn't exist or isn't accessible |
| `PLAYLIST_NOT_FOUND` | Playlist ID not found |
| `RATE_LIMITED` | Temporary rate limit — server retries automatically |
| `INVALID_PARAMS` | Zod validation failed — check parameter types |
| `PUBLISH_DATE_IN_PAST` | `publishAt` / `premiereAt` must be a future datetime |

---

## Development

```bash
npm install
npm run dev          # run with tsx (requires .env)
npm run auth         # authenticate the default channel profile
npm run auth -- --channel gaming   # authenticate a named channel profile
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests (41 tests, no network)
npm run build        # production bundle → dist/index.js
npm pack --dry-run   # verify publish artifact
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `YOUTUBE_CLIENT_ID` | ✓ | — | Google OAuth2 client ID |
| `YOUTUBE_CLIENT_SECRET` | ✓ | — | Google OAuth2 client secret |
| `YOUTUBE_MCP_TRANSPORT` | | `stdio` | `stdio` or `http` |
| `YOUTUBE_MCP_HTTP_PORT` | | `3000` | HTTP server port |
| `YOUTUBE_MCP_HTTP_HOST` | | `127.0.0.1` | HTTP bind address |
| `YOUTUBE_MCP_QUOTA_LIMIT` | | `9000` | Daily quota warning threshold |
| `YOUTUBE_MCP_CACHE_TTL` | | per-resource | Override all cache TTLs (ms) |
| `YOUTUBE_MCP_LOG_LEVEL` | | `info` | `error` \| `warn` \| `info` \| `debug` |
