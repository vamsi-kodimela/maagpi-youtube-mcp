import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

const videoMetrics = z.array(
  z.enum([
    "views", "redViews", "comments", "likes", "dislikes", "videosAddedToPlaylists",
    "videosRemovedFromPlaylists", "shares", "estimatedMinutesWatched",
    "estimatedRedMinutesWatched", "averageViewDuration", "averageViewPercentage",
    "annotationClickThroughRate", "annotationCloseRate", "annotationImpressions",
    "annotationClickableImpressions", "annotationClosableImpressions",
    "annotationClicks", "annotationCloses", "cardClickRate", "cardTeaserClickRate",
    "cardImpressions", "cardTeaserImpressions", "cardClicks", "cardTeaserClicks",
    "subscribersGained", "subscribersLost",
  ])
);

const channelMetrics = z.array(
  z.enum([
    "views", "redViews", "comments", "likes", "dislikes", "videosAddedToPlaylists",
    "videosRemovedFromPlaylists", "shares", "estimatedMinutesWatched",
    "estimatedRedMinutesWatched", "averageViewDuration", "averageViewPercentage",
    "subscribersGained", "subscribersLost", "estimatedRevenue", "estimatedAdRevenue",
    "grossRevenue", "estimatedRedPartnerRevenue", "monetizedPlaybacks",
    "playbackBasedCpm", "adImpressions", "cpm",
  ])
);

export const VideoMetricsSchema = z.object({
  videoId: z.string().min(1),
  startDate: dateString,
  endDate: dateString,
  metrics: videoMetrics.min(1),
  dimensions: z.array(z.string()).optional(),
});

export const ChannelMetricsSchema = z.object({
  startDate: dateString,
  endDate: dateString,
  metrics: channelMetrics.min(1),
  dimensions: z.array(z.string()).optional(),
  filters: z.string().optional(),
  maxResults: z.number().int().min(1).max(200).optional(),
});

export const TopVideosSchema = z.object({
  startDate: dateString,
  endDate: dateString,
  metric: z.string().min(1),
  maxResults: z.number().int().min(1).max(200).default(10),
  filters: z.string().optional(),
});

export const AudienceRetentionSchema = z.object({
  videoId: z.string().min(1),
  startDate: dateString,
  endDate: dateString,
});

export const RevenueReportSchema = z.object({
  startDate: dateString,
  endDate: dateString,
  dimensions: z.array(z.string()).optional(),
});
