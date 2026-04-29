import { z } from "zod";

export const GetChannelSchema = z.object({
  parts: z.array(z.string()).optional(),
});

export const UpdateChannelSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  keywords: z.array(z.string()).optional(),
  country: z.string().length(2).optional(),
  defaultLanguage: z.string().optional(),
});

export const UpdateBrandingSchema = z.object({
  bannerImagePath: z.string().optional(),
  profileImagePath: z.string().optional(),
  showRelatedChannels: z.boolean().optional(),
  featuredChannelsTitle: z.string().optional(),
});

export const SetWatermarkSchema = z.object({
  channelId: z.string().min(1),
  imagePath: z.string().min(1),
  position: z.object({
    cornerPosition: z.enum(["topLeft", "topRight", "bottomLeft", "bottomRight"]),
    type: z.literal("corner"),
  }),
  timing: z.object({
    type: z.enum(["offsetFromStart", "offsetFromEnd"]),
    offsetMs: z.number().int().min(0),
    durationMs: z.number().int().min(0),
  }),
});

export const UnsetWatermarkSchema = z.object({
  channelId: z.string().min(1),
});

export const ListChannelSectionsSchema = z.object({
  channelId: z.string().optional(),
});

export const CreateChannelSectionSchema = z.object({
  type: z.string().min(1),
  title: z.string().optional(),
  position: z.number().int().min(0).optional(),
  playlistIds: z.array(z.string()).optional(),
  channelIds: z.array(z.string()).optional(),
});

export const DeleteChannelSectionSchema = z.object({
  sectionId: z.string().min(1),
});
