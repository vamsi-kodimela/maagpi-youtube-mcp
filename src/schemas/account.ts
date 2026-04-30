import { z } from "zod";

export const AddChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Profile name may only contain letters, numbers, hyphens, and underscores").describe("A unique name for this channel profile (e.g. 'gaming', 'cooking', 'work')."),
});

export const SwitchChannelSchema = z.object({
  name: z.string().min(1).describe("Profile name to set as active."),
});

export const RemoveChannelSchema = z.object({
  name: z.string().min(1).describe("Profile name to remove."),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "confirm must be exactly true to prevent accidental removal" }),
  }),
});

export const ListChannelsSchema = z.object({});
export const CurrentChannelSchema = z.object({});
