import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { getPapers, getNews, getProducts, getInsights } from "./db";
import { runDailyUpdate } from "./fetchers/scheduler";

// Date range helper
function getDateRange(filter: "today" | "week") {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  if (filter === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
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
