import { describe, it, expect, beforeEach } from "vitest";
import { trackQuota, getQuotaSummary, resetQuotaForTesting } from "../../../src/quota/tracker.js";

describe("quota tracker", () => {
  beforeEach(() => {
    resetQuotaForTesting();
  });

  it("starts at 0 usage", () => {
    const summary = getQuotaSummary(0);
    expect(summary.used).toBe(0);
    expect(summary.warningLevel).toBe("ok");
  });

  it("increments correctly", () => {
    trackQuota("videos.list", 1);
    trackQuota("videos.insert", 1600);
    const summary = getQuotaSummary(0);
    expect(summary.used).toBe(1601);
  });

  it("returns 'warn' at 80% of budget", () => {
    trackQuota("test", 7200); // 80% of default 9000
    const summary = getQuotaSummary(0);
    expect(summary.warningLevel).toBe("warn");
  });

  it("returns 'critical' at 95% of budget", () => {
    trackQuota("test", 8551); // 95.0...% of 9000
    const summary = getQuotaSummary(0);
    expect(summary.warningLevel).toBe("critical");
  });

  it("remaining is never negative", () => {
    trackQuota("test", 99999);
    const summary = getQuotaSummary(0);
    expect(summary.remaining).toBe(0);
  });

  it("includes costOfThisCall in summary", () => {
    const summary = getQuotaSummary(50);
    expect(summary.costOfThisCall).toBe(50);
  });

  it("resetAt is an ISO date string", () => {
    const summary = getQuotaSummary(0);
    expect(() => new Date(summary.resetAt)).not.toThrow();
    expect(new Date(summary.resetAt).getTime()).toBeGreaterThan(Date.now());
  });
});
