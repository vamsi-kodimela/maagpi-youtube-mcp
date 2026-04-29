import { describe, it, expect } from "vitest";
import { classifyError } from "../../../src/errors/handlers.js";
import { YouTubeMcpErrorCode } from "../../../src/errors/codes.js";
import { YouTubeMcpError } from "../../../src/errors/types.js";

function makeGaxiosError(status: number, reason = "unknown") {
  const err = new Error("API Error") as Error & { response: object };
  err.response = {
    status,
    data: {
      error: {
        errors: [{ reason, domain: "youtube.quota", message: "error" }],
        message: "API Error",
        code: status,
      },
    },
  };
  return err;
}

describe("classifyError", () => {
  it("returns the same YouTubeMcpError unchanged", () => {
    const original = new YouTubeMcpError(YouTubeMcpErrorCode.VIDEO_NOT_FOUND, "not found");
    expect(classifyError("videos.list", original)).toBe(original);
  });

  it("maps 401 to AUTH_TOKEN_EXPIRED", () => {
    const err = classifyError("videos.list", makeGaxiosError(401));
    expect(err.code).toBe(YouTubeMcpErrorCode.AUTH_TOKEN_EXPIRED);
    expect(err.retryable).toBe(false);
    expect(err.suggestedFix).toBeTruthy();
  });

  it("maps 403+quotaExceeded to QUOTA_EXCEEDED", () => {
    const err = classifyError("videos.list", makeGaxiosError(403, "quotaExceeded"));
    expect(err.code).toBe(YouTubeMcpErrorCode.QUOTA_EXCEEDED);
  });

  it("maps 403+forbidden to PERMISSION_DENIED", () => {
    const err = classifyError("videos.list", makeGaxiosError(403, "forbidden"));
    expect(err.code).toBe(YouTubeMcpErrorCode.PERMISSION_DENIED);
  });

  it("maps 404 on video method to VIDEO_NOT_FOUND", () => {
    const err = classifyError("youtube_video_get", makeGaxiosError(404));
    expect(err.code).toBe(YouTubeMcpErrorCode.VIDEO_NOT_FOUND);
  });

  it("maps 404 on playlist method to PLAYLIST_NOT_FOUND", () => {
    const err = classifyError("youtube_playlist_get", makeGaxiosError(404));
    expect(err.code).toBe(YouTubeMcpErrorCode.PLAYLIST_NOT_FOUND);
  });

  it("maps 429 to RATE_LIMITED with retryable=true", () => {
    const err = classifyError("videos.list", makeGaxiosError(429));
    expect(err.code).toBe(YouTubeMcpErrorCode.RATE_LIMITED);
    expect(err.retryable).toBe(true);
  });

  it("maps 500 to INTERNAL_ERROR with retryable=true", () => {
    const err = classifyError("videos.list", makeGaxiosError(500));
    expect(err.code).toBe(YouTubeMcpErrorCode.INTERNAL_ERROR);
    expect(err.retryable).toBe(true);
  });

  it("wraps unknown errors as INTERNAL_ERROR", () => {
    const err = classifyError("unknown", new Error("mystery"));
    expect(err.code).toBe(YouTubeMcpErrorCode.INTERNAL_ERROR);
    expect(err.retryable).toBe(false);
  });
});
