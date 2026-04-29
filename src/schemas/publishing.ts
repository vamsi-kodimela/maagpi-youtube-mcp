import { z } from "zod";

const futureDateTime = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: "publishAt must be a future datetime",
  });

export const SetPrivacySchema = z.object({
  videoId: z.string().min(1),
  privacyStatus: z.enum(["public", "private", "unlisted"]),
});

export const SchedulePublishSchema = z.object({
  videoId: z.string().min(1),
  publishAt: futureDateTime,
  privacyStatus: z.enum(["public", "private"]).default("public"),
});

export const SetPremiereSchema = z.object({
  videoId: z.string().min(1),
  premiereAt: futureDateTime,
  premiereCountdown: z.enum(["none", "countdown", "live"]).default("countdown"),
});
