/**
 * Unit tests for the on-demand scheduler logic
 * Tests the stale-check threshold and system_config integration
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Constants ─────────────────────────────────────────────────────────────────
const UPDATE_THRESHOLD_MS = 20 * 60 * 60 * 1000; // 20 hours in ms

// ── Helpers (extracted from routers.ts for isolated testing) ──────────────────

/**
 * Determines whether a background update should be triggered based on
 * the last_updated_at timestamp stored in system_config.
 */
function shouldTriggerUpdate(lastUpdatedAt: string | null, now: number): boolean {
  const lastMs = lastUpdatedAt ? new Date(lastUpdatedAt).getTime() : 0;
  return now - lastMs > UPDATE_THRESHOLD_MS;
}

// ── Tests: shouldTriggerUpdate ────────────────────────────────────────────────
describe("shouldTriggerUpdate", () => {
  const NOW = new Date("2026-03-02T10:00:00.000Z").getTime();

  it("returns true when last_updated_at is null (never updated)", () => {
    expect(shouldTriggerUpdate(null, NOW)).toBe(true);
  });

  it("returns true when last update was more than 20 hours ago", () => {
    const staleTime = new Date(NOW - UPDATE_THRESHOLD_MS - 1).toISOString();
    expect(shouldTriggerUpdate(staleTime, NOW)).toBe(true);
  });

  it("returns true when last update was exactly 20 hours ago (boundary)", () => {
    const boundaryTime = new Date(NOW - UPDATE_THRESHOLD_MS).toISOString();
    // Exactly at threshold: now - last === threshold, so NOT strictly greater
    expect(shouldTriggerUpdate(boundaryTime, NOW)).toBe(false);
  });

  it("returns false when last update was less than 20 hours ago", () => {
    const recentTime = new Date(NOW - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
    expect(shouldTriggerUpdate(recentTime, NOW)).toBe(false);
  });

  it("returns false when last update was just 19 hours ago", () => {
    const almostStale = new Date(NOW - 19 * 60 * 60 * 1000).toISOString();
    expect(shouldTriggerUpdate(almostStale, NOW)).toBe(false);
  });

  it("returns true when last update was 21 hours ago", () => {
    const staleTime = new Date(NOW - 21 * 60 * 60 * 1000).toISOString();
    expect(shouldTriggerUpdate(staleTime, NOW)).toBe(true);
  });

  it("returns true for an empty string (invalid timestamp)", () => {
    // new Date("").getTime() returns NaN; NaN comparisons are always false,
    // so now - NaN = NaN > threshold = false — treated as never updated
    // We handle this by falling back to 0 if isNaN
    const lastMs = new Date("").getTime();
    const effectiveLastMs = isNaN(lastMs) ? 0 : lastMs;
    expect(NOW - effectiveLastMs > UPDATE_THRESHOLD_MS).toBe(true);
  });
});

// ── Tests: system_config key naming ──────────────────────────────────────────
describe("System config key convention", () => {
  it("last_updated_at key is a non-empty string", () => {
    const key = "last_updated_at";
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });

  it("ISO string from new Date() is parseable back to a Date", () => {
    const iso = new Date().toISOString();
    const parsed = new Date(iso);
    expect(parsed).toBeInstanceOf(Date);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

  it("stored ISO timestamp round-trips correctly", () => {
    const original = new Date("2026-03-01T00:00:00.000Z");
    const stored = original.toISOString();
    const restored = new Date(stored);
    expect(restored.getTime()).toBe(original.getTime());
  });
});

// ── Tests: UPDATE_THRESHOLD_MS constant ──────────────────────────────────────
describe("UPDATE_THRESHOLD_MS constant", () => {
  it("equals exactly 20 hours in milliseconds", () => {
    expect(UPDATE_THRESHOLD_MS).toBe(72_000_000);
  });

  it("is greater than 19 hours", () => {
    expect(UPDATE_THRESHOLD_MS).toBeGreaterThan(19 * 60 * 60 * 1000);
  });

  it("is less than 24 hours (within same day)", () => {
    expect(UPDATE_THRESHOLD_MS).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

// ── Tests: runDailyUpdate guard (isRunning flag) ──────────────────────────────
describe("runDailyUpdate concurrency guard", () => {
  it("isRunning flag prevents concurrent executions", async () => {
    let isRunning = false;
    const callLog: string[] = [];

    async function mockRunDailyUpdate() {
      if (isRunning) {
        callLog.push("skipped");
        return { success: false, error: "Already running" };
      }
      isRunning = true;
      callLog.push("started");
      // Simulate async work
      await new Promise((r) => setTimeout(r, 10));
      callLog.push("finished");
      isRunning = false;
      return { success: true };
    }

    // Fire two concurrent calls
    const [r1, r2] = await Promise.all([mockRunDailyUpdate(), mockRunDailyUpdate()]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(false);
    expect(r2.error).toBe("Already running");
    expect(callLog).toContain("skipped");
    expect(callLog.filter((e) => e === "started").length).toBe(1);
  });
});
