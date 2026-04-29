import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeAnalyticsClient } from "./client.js";
import type { youtubeAnalytics_v2 } from "@googleapis/youtubeanalytics";

export interface AnalyticsResult {
  columnHeaders: Array<{ name: string; dataType: string; columnType: string }>;
  rows: Array<Array<string | number>>;
}

export async function queryVideoMetrics(
  analytics: YouTubeAnalyticsClient,
  videoId: string,
  startDate: string,
  endDate: string,
  metrics: string[],
  dimensions?: string[]
): Promise<AnalyticsResult> {
  return wrapApiCall("youtubeAnalytics.reports.query", () =>
    withBackoff(async () => {
      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: metrics.join(","),
        dimensions: dimensions?.join(","),
        filters: `video==${videoId}`,
      });
      return {
        columnHeaders: (response.data.columnHeaders ?? []).map((h) => ({
          name: h.name ?? "",
          dataType: h.dataType ?? "",
          columnType: h.columnType ?? "",
        })),
        rows: (response.data.rows ?? []) as Array<Array<string | number>>,
      };
    }, "youtubeAnalytics.reports.query")
  );
}

export async function queryChannelMetrics(
  analytics: YouTubeAnalyticsClient,
  startDate: string,
  endDate: string,
  metrics: string[],
  dimensions?: string[],
  filters?: string,
  maxResults?: number
): Promise<AnalyticsResult> {
  return wrapApiCall("youtubeAnalytics.reports.query", () =>
    withBackoff(async () => {
      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: metrics.join(","),
        dimensions: dimensions?.join(","),
        filters,
        maxResults,
      });
      return {
        columnHeaders: (response.data.columnHeaders ?? []).map((h) => ({
          name: h.name ?? "",
          dataType: h.dataType ?? "",
          columnType: h.columnType ?? "",
        })),
        rows: (response.data.rows ?? []) as Array<Array<string | number>>,
      };
    }, "youtubeAnalytics.reports.query")
  );
}

export async function queryTopVideos(
  analytics: YouTubeAnalyticsClient,
  startDate: string,
  endDate: string,
  sortMetric: string,
  maxResults = 10,
  filters?: string
): Promise<{ videoId: string; value: number }[]> {
  return wrapApiCall("youtubeAnalytics.reports.query", () =>
    withBackoff(async () => {
      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: sortMetric,
        dimensions: "video",
        sort: `-${sortMetric}`,
        maxResults,
        filters,
      });

      const rows = (response.data.rows ?? []) as Array<Array<string | number>>;
      return rows.map((row) => ({
        videoId: String(row[0]),
        value: Number(row[1]),
      }));
    }, "youtubeAnalytics.reports.query")
  );
}

export async function queryAudienceRetention(
  analytics: YouTubeAnalyticsClient,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<{ elapsedVideoTimeRatio: number; audienceWatchRatio: number }[]> {
  return wrapApiCall("youtubeAnalytics.reports.query", () =>
    withBackoff(async () => {
      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "audienceWatchRatio",
        dimensions: "elapsedVideoTimeRatio",
        filters: `video==${videoId}`,
      });

      const rows = (response.data.rows ?? []) as Array<Array<string | number>>;
      return rows.map((row) => ({
        elapsedVideoTimeRatio: Number(row[0]),
        audienceWatchRatio: Number(row[1]),
      }));
    }, "youtubeAnalytics.reports.query")
  );
}

export async function queryRevenueReport(
  analytics: YouTubeAnalyticsClient,
  startDate: string,
  endDate: string,
  dimensions?: string[]
): Promise<{
  estimatedRevenue: number;
  rows: AnalyticsResult;
}> {
  return wrapApiCall("youtubeAnalytics.reports.query", () =>
    withBackoff(async () => {
      const response = await analytics.reports.query({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "estimatedRevenue,estimatedAdRevenue,grossRevenue",
        dimensions: dimensions?.join(","),
      });

      const rows = (response.data.rows ?? []) as Array<Array<string | number>>;
      const estimatedRevenue = rows.reduce((sum, row) => sum + Number(row[0] ?? 0), 0);

      return {
        estimatedRevenue,
        rows: {
          columnHeaders: (response.data.columnHeaders ?? []).map((h) => ({
            name: h.name ?? "",
            dataType: h.dataType ?? "",
            columnType: h.columnType ?? "",
          })),
          rows,
        },
      };
    }, "youtubeAnalytics.reports.query")
  );
}
