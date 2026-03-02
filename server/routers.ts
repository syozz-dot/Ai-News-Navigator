import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { getPapers, getNews, getProducts, getInsights, getSystemConfig } from "./db";
import { runDailyUpdate } from "./fetchers/scheduler";

/** 20 小时阈值（毫秒）：防止同一天被多次触发 */
const UPDATE_THRESHOLD_MS = 20 * 60 * 60 * 1000;

/**
 * 检查是否需要触发每日更新，若距上次更新超过 20 小时则异步触发。
 * 不阻塞调用方，任何访客请求均可触发。
 */
function triggerUpdateIfStale(): void {
  getSystemConfig("last_updated_at").then((lastUpdatedAt) => {
    const now = Date.now();
    const lastMs = lastUpdatedAt ? new Date(lastUpdatedAt).getTime() : 0;
    if (now - lastMs > UPDATE_THRESHOLD_MS) {
      console.log("[Router] Data is stale, triggering background update...");
      runDailyUpdate().catch((err) =>
        console.error("[Router] Background update failed:", err)
      );
    }
  }).catch((err) => {
    console.warn("[Router] Failed to check last_updated_at:", err);
  });
}

// Date range helper — all boundaries are computed in Beijing time (UTC+8)
// so that "today" always matches the user's calendar day in China.
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function getDateRange(filter: "today" | "week") {
  const now = new Date();
  // Shift now into Beijing time space
  const beijingNow = new Date(now.getTime() + BEIJING_OFFSET_MS);

  // Beijing midnight of today (as a UTC timestamp)
  const beijingTodayMidnightUTC = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate()
  );

  if (filter === "today") {
    // today 00:00:00 Beijing = beijingTodayMidnightUTC - BEIJING_OFFSET_MS
    const startDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS);
    // today 23:59:59.999 Beijing
    const endDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS + 24 * 60 * 60 * 1000 - 1);
    return { startDate, endDate };
  } else {
    // week: 7 days ago 00:00:00 Beijing → today 23:59:59.999 Beijing
    const startDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS + 24 * 60 * 60 * 1000 - 1);
    return { startDate, endDate };
  }
}

const dateFilterSchema = z.object({
  filter: z.enum(["today", "week"]).default("week"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Papers ──────────────────────────────────────────────────────────────────
  papers: router({
    list: publicProcedure.input(dateFilterSchema).query(async ({ input }) => {
      // Trigger background update if data is stale (non-blocking)
      triggerUpdateIfStale();
      const { startDate, endDate } = getDateRange(input.filter);
      return getPapers(startDate, endDate);
    }),
  }),

  // ── News ────────────────────────────────────────────────────────────────────
  news: router({
    list: publicProcedure.input(dateFilterSchema).query(async ({ input }) => {
      const { startDate, endDate } = getDateRange(input.filter);
      return getNews(startDate, endDate);
    }),
  }),

  // ── Products ────────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.input(dateFilterSchema).query(async ({ input }) => {
      const { startDate, endDate } = getDateRange(input.filter);
      return getProducts(startDate, endDate);
    }),
  }),

  // ── Insights ────────────────────────────────────────────────────────────────
  insights: router({
    list: publicProcedure.input(dateFilterSchema).query(async ({ input }) => {
      const { startDate, endDate } = getDateRange(input.filter);
      return getInsights(startDate, endDate);
    }),
  }),

  // ── Admin: Trigger manual update ────────────────────────────────────────────
  admin: router({
    triggerUpdate: adminProcedure.mutation(async () => {
      const result = await runDailyUpdate();
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
