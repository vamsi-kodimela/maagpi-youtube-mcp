import { z } from "zod";

const futureDateTime = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: "publishAt must be a future datetime",
  });

const channel = z.string().optional().describe("Channel profile name. Defaults to active profile.");

export const SetPrivacySchema = z.object({
  videoId: z.string().min(1),
  privacyStatus: z.enum(["public", "private", "unlisted"]),
  channel,
});

export const SchedulePublishSchema = z.object({
  videoId: z.string().min(1),
  publishAt: futureDateTime,
  privacyStatus: z.enum(["public", "private"]).default("public"),
  channel,
});

export const SetPremiereSchema = z.object({
  videoId: z.string().min(1),
  premiereAt: futureDateTime,
  premiereCountdown: z.enum(["none", "countdown", "live"]).default("countdown"),
  channel,
});
