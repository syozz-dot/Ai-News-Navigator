/**
 * Tests for /api/cron/trigger endpoint
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock scheduler before importing anything that uses it
vi.mock("./fetchers/scheduler", () => ({
  runDailyUpdate: vi.fn().mockResolvedValue({ success: true, papers: 0, news: 0, products: 0, insight: false }),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    cronSecret: "test-secret-12345",
    isProduction: false,
    appId: "",
    cookieSecret: "",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

import express from "express";
import request from "supertest";
import { runDailyUpdate } from "./fetchers/scheduler";
import { ENV } from "./_core/env";

function buildApp() {
  const app = express();
  app.get("/api/cron/trigger", async (req, res) => {
    const secret = req.query.secret as string;
    if (!secret || secret !== ENV.cronSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ ok: true, message: "Daily update triggered" });
    runDailyUpdate().catch(() => {});
  });
  return app;
}

describe("GET /api/cron/trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no secret provided", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/cron/trigger");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 when wrong secret provided", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/cron/trigger?secret=wrong-secret");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 200 and triggers update when correct secret provided", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/cron/trigger?secret=test-secret-12345");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.message).toBe("Daily update triggered");
  });

  it("calls runDailyUpdate when correct secret provided", async () => {
    const app = buildApp();
    await request(app).get("/api/cron/trigger?secret=test-secret-12345");
    // Give async call a tick to fire
    await new Promise(r => setTimeout(r, 10));
    expect(runDailyUpdate).toHaveBeenCalledTimes(1);
  });
});
