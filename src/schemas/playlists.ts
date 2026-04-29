import { z } from "zod";

const privacyStatus = z.enum(["public", "private", "unlisted"]);

export const CreatePlaylistSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(5000).optional(),
  privacyStatus,
  defaultLanguage: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdatePlaylistSchema = z.object({
  playlistId: z.string().min(1),
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(5000).optional(),
  privacyStatus: privacyStatus.optional(),
});

export const DeletePlaylistSchema = z.object({
  playlistId: z.string().min(1),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "confirm must be exactly true to prevent accidental deletion" }),
  }),
});

export const GetPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  parts: z.array(z.string()).optional(),
});

export const ListPlaylistsSchema = z.object({
  channelId: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).default(25),
  pageToken: z.string().optional(),
});

export const AddVideoToPlaylistSchema = z.object({
  playlistId: z.string().min(1),
  videoId: z.string().min(1),
  position: z.number().int().min(0).optional(),
});

export const RemoveVideoFromPlaylistSchema = z.object({
  playlistItemId: z.string().min(1),
});

export const ReorderPlaylistItemSchema = z.object({
  playlistItemId: z.string().min(1),
  playlistId: z.string().min(1),
  newPosition: z.number().int().min(0),
});

export const ListPlaylistItemsSchema = z.object({
  playlistId: z.string().min(1),
  maxResults: z.number().int().min(1).max(50).default(50),
  pageToken: z.string().optional(),
});
