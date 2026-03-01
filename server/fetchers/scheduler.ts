/**
 * Daily Data Scheduler
 * Orchestrates all data fetchers and runs them on a daily schedule.
 * Triggered at 08:00 Beijing time (UTC+8) = 00:00 UTC
 */
import { fetchArxivPapers } from "./arxiv";
import { fetchAINews } from "./news";
import { fetchAIProducts, generateDailyInsight } from "./products";
import { getRecentPapers, getRecentNews, getRecentProducts, upsertInsight } from "../db";
import { notifyOwner } from "../_core/notification";

let isRunning = false;

export async function runDailyUpdate(): Promise<{
  success: boolean;
  papers: number;
  news: number;
  products: number;
  insight: boolean;
  error?: string;
}> {
  if (isRunning) {
    console.log("[Scheduler] Already running, skipping...");
    return { success: false, papers: 0, news: 0, products: 0, insight: false, error: "Already running" };
  }

  isRunning = true;
  console.log("[Scheduler] Starting daily update...", new Date().toISOString());

  let papersCount = 0;
  let newsCount = 0;
  let productsCount = 0;
  let insightSaved = false;

  try {
    // 1. Fetch arXiv papers
    console.log("[Scheduler] Step 1/4: Fetching arXiv papers...");
    papersCount = await fetchArxivPapers(5);

    // 2. Fetch AI news
    console.log("[Scheduler] Step 2/4: Fetching AI news...");
    newsCount = await fetchAINews(3);

    // 3. Fetch AI products
    console.log("[Scheduler] Step 3/4: Fetching AI products...");
    productsCount = await fetchAIProducts(5);

    // 4. Generate daily insight
    console.log("[Scheduler] Step 4/4: Generating daily insight...");
    // Use recently fetched items (not date-filtered) to avoid timezone issues
    // where arXiv publishedAt may be older than today's crawl time
    const recentPapers = await getRecentPapers(6);
    const recentNews = await getRecentNews(6);
    const recentProducts = await getRecentProducts(5);

    const paperTitles = recentPapers.map((p) => p.titleCn || p.title);
    const newsTitles = recentNews.map((n) => n.headlineCn || n.headline);
    const productNames = recentProducts.map((p) => `${p.name}: ${p.tagline}`);

    const insight = await generateDailyInsight(paperTitles, newsTitles, productNames);
    if (insight) {
      await upsertInsight(insight);
      insightSaved = true;
    }

    const summary = `每日更新完成: 论文 ${papersCount} 篇, 新闻 ${newsCount} 条, 产品 ${productsCount} 个, 洞察 ${insightSaved ? "已生成" : "未生成"}`;
    console.log(`[Scheduler] ${summary}`);

    // Notify owner
    try {
      await notifyOwner({
        title: "AI News Navigator 每日更新完成",
        content: summary,
      });
    } catch (e) {
      console.warn("[Scheduler] Failed to notify owner:", e);
    }

    return { success: true, papers: papersCount, news: newsCount, products: productsCount, insight: insightSaved };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Scheduler] Daily update failed:", msg);
    return { success: false, papers: papersCount, news: newsCount, products: productsCount, insight: insightSaved, error: msg };
  } finally {
    isRunning = false;
  }
}

// Cron-based scheduler: runs at 00:00 UTC (08:00 Beijing time)
let cronTimer: NodeJS.Timeout | null = null;

export function startScheduler() {
  console.log("[Scheduler] Initializing daily update scheduler (08:00 Beijing / 00:00 UTC)...");

  function scheduleNext() {
    const now = new Date();
    // Next midnight UTC
    const nextRun = new Date(now);
    nextRun.setUTCHours(0, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    const msUntilNext = nextRun.getTime() - now.getTime();
    console.log(`[Scheduler] Next run at ${nextRun.toISOString()} (in ${Math.round(msUntilNext / 1000 / 60)} minutes)`);

    cronTimer = setTimeout(async () => {
      await runDailyUpdate();
      scheduleNext(); // Schedule next day
    }, msUntilNext);
  }

  scheduleNext();
}

export function stopScheduler() {
  if (cronTimer) {
    clearTimeout(cronTimer);
    cronTimer = null;
    console.log("[Scheduler] Stopped.");
  }
}
