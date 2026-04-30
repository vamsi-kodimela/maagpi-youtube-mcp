# maagpi-youtube-mcp

![MCP](https://img.shields.io/badge/MCP-compatible-green)
![npm](https://img.shields.io/npm/v/maagpi-youtube-mcp)
![node](https://img.shields.io/badge/node-%3E%3D18-blue)

**maagpi-youtube-mcp** is a full YouTube channel-management MCP server: upload videos, schedule publishing, query analytics, moderate comments, manage playlists, update channel branding, and operate **multiple YouTube channels simultaneously** — all from any MCP-compatible AI client.

Wraps the official YouTube Data API v3 + YouTube Analytics API behind a single MCP surface with built-in OAuth, quota tracking, response caching, and structured error handling.

## Transport

- **Default:** stdio (local process, spawned by your MCP client)
- **Optional:** Streamable HTTP (`YOUTUBE_MCP_TRANSPORT=http`) for multi-client / remote access
- **Distribution:** `npx maagpi-youtube-mcp` — no global install required
- **Full docs:** see [Tool Reference](#tool-reference) below

## Authentication

This server uses **Google OAuth 2.0** (Desktop app credentials). You provide a Client ID + Client Secret as environment variables; the server handles the browser consent flow and stores refresh tokens to your OS config directory under named **profiles** (one per channel).

### One-time Google Cloud setup

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Library** → enable:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
2. **APIs & Services → OAuth consent screen** → External → fill app name + your email → add your Google account as a **Test user**.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type **Desktop app** → copy the **Client ID** and **Client Secret**.

> Keep your Client Secret out of source control. The server never transmits it anywhere except `accounts.google.com`.

**First call:** the server opens a browser window for OAuth consent. Approve once, and tokens are saved automatically under the `"default"` profile and auto-refreshed thereafter. Add more channels with `youtube_account_add`.

## Quick Connect

Pick your client and drop the snippet into the corresponding config file. Replace `your_client_id` / `your_client_secret` with your Google OAuth credentials.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Claude Code

`~/.claude/settings.json`

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Or via the Claude Code CLI:

```bash
claude mcp add youtube -- npx -y maagpi-youtube-mcp \
  -e YOUTUBE_CLIENT_ID=your_client_id \
  -e YOUTUBE_CLIENT_SECRET=your_client_secret
```

### Cursor

`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### VS Code (MCP-compatible extensions)

`.vscode/mcp.json` (workspace) or User Settings:

```json
{
  "servers": {
    "youtube": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "maagpi-youtube-mcp"],
      "env": {
        "YOUTUBE_CLIENT_ID": "your_client_id",
        "YOUTUBE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Zed

`~/.config/zed/settings.json`

```json
{
  "context_servers": {
    "youtube": {
      "command": {
        "path": "npx",
        "args": ["-y", "maagpi-youtube-mcp"],
        "env": {
          "YOUTUBE_CLIENT_ID": "your_client_id",
          "YOUTUBE_CLIENT_SECRET": "your_client_secret"
        }
      }
    }
  }
}
```

### mcporter

```bash
mcporter add youtube --command "npx -y maagpi-youtube-mcp" \
  --env YOUTUBE_CLIENT_ID=your_client_id \
  --env YOUTUBE_CLIENT_SECRET=your_client_secret

mcporter call youtube youtube_account_list '{}'
```

### Streamable HTTP (remote / multi-client)

Run the server as an HTTP service:

```bash
YOUTUBE_MCP_TRANSPORT=http \
YOUTUBE_MCP_HTTP_PORT=3000 \
YOUTUBE_CLIENT_ID=your_client_id \
YOUTUBE_CLIENT_SECRET=your_client_secret \
npx -y maagpi-youtube-mcp
# MCP endpoint: POST http://127.0.0.1:3000/mcp
# Health check: GET  http://127.0.0.1:3000/health
```

Then point any HTTP-capable MCP client at `http://127.0.0.1:3000/mcp`.

## Tool Reference

> All tools accept an optional `channel` parameter (profile name). Omit it to use the active profile.

### Account Management

| Tool | Parameters | Description |
|---|---|---|
| `youtube_account_add` | `name` | Connect a new channel via OAuth, save as a named profile |
| `youtube_account_list` | _none_ | List all connected profiles with IDs and active status |
| `youtube_account_switch` | `name` | Set the default active profile |
| `youtube_account_current` | _none_ | Show the currently active profile |
| `youtube_account_remove` | `name`, `confirm: true` | Disconnect and remove a profile |

### Videos

| Tool | Parameters | Quota |
|---|---|---|
| `youtube_video_upload` | `filePath`, `title`, `privacyStatus`, `channel?` | 1600 |
| `youtube_video_get` | `videoId`, `parts?`, `channel?` | 1 |
| `youtube_video_list` | `channelId?`, `query?`, `order?`, `maxResults?`, `channel?` | 1 |
| `youtube_video_update` | `videoId`, `title?`, `description?`, `tags?`, `channel?` | 50 |
| `youtube_video_delete` | `videoId`, `confirm: true`, `channel?` | 50 |
| `youtube_video_rate` | `videoId`, `rating` (`like`/`dislike`/`none`), `channel?` | 50 |
| `youtube_video_set_thumbnail` | `videoId`, `thumbnailPath`, `channel?` | 50 |

### Scheduling & Publishing

| Tool | Parameters | Quota |
|---|---|---|
| `youtube_video_set_privacy` | `videoId`, `privacyStatus`, `channel?` | 50 |
| `youtube_video_schedule_publish` | `videoId`, `publishAt` (future ISO 8601), `channel?` | 50 |
| `youtube_video_set_premiere` | `videoId`, `premiereAt` (future ISO 8601), `channel?` | 50 |

### Analytics

| Tool | Parameters | Quota |
|---|---|---|
| `youtube_analytics_video_metrics` | `videoId`, `startDate`, `endDate`, `metrics[]`, `channel?` | 1 |
| `youtube_analytics_channel_metrics` | `startDate`, `endDate`, `metrics[]`, `channel?` | 1 |
| `youtube_analytics_top_videos` | `startDate`, `endDate`, `metric`, `maxResults?`, `channel?` | 1 |
| `youtube_analytics_audience_retention` | `videoId`, `startDate`, `endDate`, `channel?` | 1 |
| `youtube_analytics_revenue_report` | `startDate`, `endDate`, `dimensions?`, `channel?` | 1 |

Dates use `YYYY-MM-DD`. Common video metrics: `views`, `watchTime`, `averageViewDuration`, `averageViewPercentage`, `likes`, `shares`, `subscribersGained`, `subscribersLost`. Channel metrics add `estimatedRevenue`, `estimatedAdRevenue`, `grossRevenue`, `monetizedPlaybacks`, `cpm`, `adImpressions`.

### Comments

| Tool | Parameters | Quota |
|---|---|---|
| `youtube_comment_list` | `videoId`, `maxResults?`, `order?`, `searchTerms?`, `channel?` | 1 |
| `youtube_comment_thread_get` | `commentThreadId`, `maxReplies?`, `channel?` | 1 |
| `youtube_comment_reply` | `parentCommentId`, `text`, `channel?` | 50 |
| `youtube_comment_delete` | `commentId`, `channel?` | 50 |
| `youtube_comment_moderate` | `commentId`, `moderationStatus` (`published`/`heldForReview`/`rejected`), `banAuthor?`, `channel?` | 50 |

### Playlists

| Tool | Parameters | Quota |
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

| Tool | Parameters | Quota |
|---|---|---|
| `youtube_channel_get` | `parts?`, `channel?` | 1 |
| `youtube_channel_update` | `title?`, `description?`, `keywords?`, `country?`, `channel?` | 50 |
| `youtube_channel_branding_update` | `showRelatedChannels?`, `featuredChannelsTitle?`, `channel?` | 50 |
| `youtube_channel_watermark_set` | `channelId`, `imagePath`, `position`, `timing`, `channel?` | 50 |
| `youtube_channel_watermark_unset` | `channelId`, `channel?` | 50 |
| `youtube_channel_section_list` | `channelId?`, `channel?` | 1 |
| `youtube_channel_section_create` | `type`, `title?`, `playlistIds?`, `channel?` | 50 |
| `youtube_channel_section_delete` | `sectionId`, `channel?` | 50 |

## Example Prompts

Once connected, send these to your AI client as natural language:

```
Upload /videos/tutorial.mp4 with title "Getting Started with TypeScript",
description "A beginner's guide", tags ["typescript","programming"], unlisted.
```

```
Schedule video dQw4w9WgXcQ to go public on January 20 2026 at 3pm UTC.
```

```
Get top 5 videos by views in Q1 2025 for my "main" channel,
and also for my "gaming" channel.
```

```
Show me revenue breakdown for 2025-01-01 to 2025-01-31, split by day.
```

```
Reply to comment Ugxxxxx with "Thanks for the feedback! Fixed in v2."
```

> Tools that delete data require `confirm: true` — your AI client will ask before proceeding.

## Multiple Channels

Connect any number of YouTube accounts and target any of them from any tool via the optional `channel` parameter — no switching required.

```
Add a new YouTube channel profile named "gaming"
List all my connected YouTube channel profiles
Switch my active YouTube profile to "gaming"
Upload /videos/clip.mp4 to my "gaming" channel, title "EP1", public
```

CLI auth for a named profile (handy for headless setups):

```bash
npm run auth -- --channel gaming
```

## Quota

YouTube Data API v3 grants **10,000 units/day** by default. Every tool response includes a `quota` field:

```json
{
  "quota": {
    "used": 151,
    "budget": 9000,
    "remaining": 8849,
    "resetAt": "2026-01-15T08:00:00.000Z",
    "warningLevel": "ok",
    "costOfThisCall": 1
  }
}
```

`warningLevel`: `"ok"` → `"warn"` at 80% → `"critical"` at 95%.

**Built-in protections**

- GET responses are cached (videos 60s, channels 5min, analytics 5min) — repeat reads cost 0 quota
- Writes auto-retry on 429/5xx with exponential backoff (up to 3×)
- Set `YOUTUBE_MCP_QUOTA_LIMIT` below 10,000 to leave headroom

## Error Format

All errors are returned as structured tool content — agents can read and act on them without crashing:

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
  "quota": { "used": 9001, "warningLevel": "critical" }
}
```

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

## Development

```bash
npm install
npm run dev          # run with tsx (requires .env)
npm run auth         # authenticate the default channel profile
npm run auth -- --channel gaming   # authenticate a named profile
npm run typecheck    # tsc --noEmit
npm test             # vitest unit tests
npm run build        # production bundle → dist/index.js
npm pack --dry-run   # verify publish artifact
```

## Why maagpi-youtube-mcp 🎯

- **Operate YouTube from any AI client** — Claude, Cursor, Windsurf, Zed, VS Code, mcporter
- **Manage multiple channels at once** — no context switching, target any channel per call
- **Production-grade plumbing** — OAuth, refresh tokens, quota tracking, retries, structured errors
- **Full surface coverage** — videos, scheduling, analytics, comments, playlists, branding

## Links

- npm: https://www.npmjs.com/package/maagpi-youtube-mcp
- YouTube Data API: https://developers.google.com/youtube/v3
- YouTube Analytics API: https://developers.google.com/youtube/analytics
- Model Context Protocol: https://modelcontextprotocol.io
