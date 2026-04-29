import { z } from "zod";

const privacyStatus = z.enum(["public", "private", "unlisted"]);

const videoParts = z.array(
  z.enum(["contentDetails", "fileDetails", "id", "liveStreamingDetails", "localizations",
    "player", "processingDetails", "recordingDetails", "snippet", "statistics",
    "status", "suggestions", "topicDetails"])
);

export const UploadVideoSchema = z.object({
  filePath: z.string().min(1, "filePath is required"),
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  privacyStatus,
  language: z.string().optional(),
  thumbnailPath: z.string().optional(),
  notifySubscribers: z.boolean().default(true),
});

export const GetVideoSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  parts: videoParts.optional(),
});

export const ListVideosSchema = z.object({
  channelId: z.string().optional(),
  playlistId: z.string().optional(),
  query: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).default(25),
  pageToken: z.string().optional(),
  order: z.enum(["date", "rating", "relevance", "title", "viewCount"]).optional(),
  publishedAfter: z.string().datetime({ offset: true }).optional(),
  publishedBefore: z.string().datetime({ offset: true }).optional(),
});

export const UpdateVideoSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

export const DeleteVideoSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "confirm must be exactly true to prevent accidental deletion" }),
  }),
});

export const RateVideoSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  rating: z.enum(["like", "dislike", "none"]),
});

export const SetThumbnailSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  thumbnailPath: z.string().min(1, "thumbnailPath is required"),
});
