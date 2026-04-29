import { youtube } from "@googleapis/youtube";
import { youtubeAnalytics } from "@googleapis/youtubeanalytics";
import type { OAuth2Client } from "google-auth-library";
import type { youtube_v3 } from "@googleapis/youtube";
import type { youtubeAnalytics_v2 } from "@googleapis/youtubeanalytics";

export type YouTubeClient = youtube_v3.Youtube;
export type YouTubeAnalyticsClient = youtubeAnalytics_v2.Youtubeanalytics;

export function buildYouTubeClient(auth: OAuth2Client): YouTubeClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return youtube({ version: "v3", auth: auth as any });
}

export function buildAnalyticsClient(auth: OAuth2Client): YouTubeAnalyticsClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return youtubeAnalytics({ version: "v2", auth: auth as any });
}
