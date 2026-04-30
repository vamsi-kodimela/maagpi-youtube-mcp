import { z } from "zod";

const channel = z.string().optional().describe("Channel profile name. Defaults to active profile.");

export const ListCommentsSchema = z.object({
  videoId: z.string().min(1),
  maxResults: z.number().int().min(1).max(100).default(20),
  pageToken: z.string().optional(),
  order: z.enum(["time", "relevance"]).default("time"),
  searchTerms: z.string().optional(),
  channel,
});

export const ReplyCommentSchema = z.object({
  parentCommentId: z.string().min(1),
  text: z.string().min(1).max(10000),
  channel,
});

export const DeleteCommentSchema = z.object({
  commentId: z.string().min(1),
  channel,
});

export const ModerateCommentSchema = z.object({
  commentId: z.string().min(1),
  moderationStatus: z.enum(["published", "heldForReview", "rejected"]),
  banAuthor: z.boolean().default(false),
  channel,
});

export const GetCommentThreadSchema = z.object({
  commentThreadId: z.string().min(1),
  maxReplies: z.number().int().min(1).max(100).default(20),
  channel,
});
