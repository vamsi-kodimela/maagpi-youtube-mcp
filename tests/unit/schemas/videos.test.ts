import { describe, it, expect } from "vitest";
import {
  UploadVideoSchema, GetVideoSchema, UpdateVideoSchema, DeleteVideoSchema,
} from "../../../src/schemas/videos.js";

describe("UploadVideoSchema", () => {
  it("accepts valid params", () => {
    const result = UploadVideoSchema.safeParse({
      filePath: "/tmp/video.mp4",
      title: "My Video",
      privacyStatus: "public",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty filePath", () => {
    const result = UploadVideoSchema.safeParse({ filePath: "", title: "T", privacyStatus: "public" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 100 chars", () => {
    const result = UploadVideoSchema.safeParse({
      filePath: "/tmp/v.mp4",
      title: "x".repeat(101),
      privacyStatus: "public",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid privacyStatus", () => {
    const result = UploadVideoSchema.safeParse({
      filePath: "/tmp/v.mp4",
      title: "Test",
      privacyStatus: "friends",
    });
    expect(result.success).toBe(false);
  });
});

describe("DeleteVideoSchema", () => {
  it("requires confirm: true", () => {
    expect(DeleteVideoSchema.safeParse({ videoId: "abc", confirm: false }).success).toBe(false);
    expect(DeleteVideoSchema.safeParse({ videoId: "abc", confirm: true }).success).toBe(true);
  });
});

describe("GetVideoSchema", () => {
  it("accepts videoId only", () => {
    expect(GetVideoSchema.safeParse({ videoId: "abc123" }).success).toBe(true);
  });
});

describe("UpdateVideoSchema", () => {
  it("accepts partial updates", () => {
    expect(UpdateVideoSchema.safeParse({ videoId: "abc", title: "New title" }).success).toBe(true);
  });

  it("requires videoId", () => {
    expect(UpdateVideoSchema.safeParse({ title: "No ID" }).success).toBe(false);
  });
});
