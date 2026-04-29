import { describe, it, expect } from "vitest";
import { SchedulePublishSchema, SetPremiereSchema } from "../../../src/schemas/publishing.js";

describe("SchedulePublishSchema", () => {
  it("accepts a future ISO datetime", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(SchedulePublishSchema.safeParse({ videoId: "abc", publishAt: future }).success).toBe(true);
  });

  it("rejects a past datetime", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(SchedulePublishSchema.safeParse({ videoId: "abc", publishAt: past }).success).toBe(false);
  });

  it("rejects invalid datetime format", () => {
    expect(SchedulePublishSchema.safeParse({ videoId: "abc", publishAt: "2024-13-01" }).success).toBe(false);
  });
});

describe("SetPremiereSchema", () => {
  it("accepts valid premiere config", () => {
    const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(
      SetPremiereSchema.safeParse({ videoId: "abc", premiereAt: future, premiereCountdown: "countdown" }).success
    ).toBe(true);
  });
});
