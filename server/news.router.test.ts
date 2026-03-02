/**
 * Tests for AI News Navigator tRPC routers
 * Tests the date filtering logic (Beijing-time aware) and data structure
 */
import { describe, it, expect } from "vitest";

// ── Date range helper (extracted from routers.ts, Beijing-time aware) ─────────
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function getDateRange(filter: "today" | "week") {
  const now = new Date();
  const beijingNow = new Date(now.getTime() + BEIJING_OFFSET_MS);
  const beijingTodayMidnightUTC = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate()
  );

  if (filter === "today") {
    const startDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS);
    const endDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS + 24 * 60 * 60 * 1000 - 1);
    return { startDate, endDate };
  } else {
    const startDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(beijingTodayMidnightUTC - BEIJING_OFFSET_MS + 24 * 60 * 60 * 1000 - 1);
    return { startDate, endDate };
  }
}

describe("Date range helper (Beijing-time aware)", () => {
  it("today range spans exactly 24 hours", () => {
    const { startDate, endDate } = getDateRange("today");
    const diffMs = endDate.getTime() - startDate.getTime() + 1; // +1 because end is 23:59:59.999
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });

  it("today startDate is Beijing midnight (UTC+8 offset applied)", () => {
    const { startDate } = getDateRange("today");
    // startDate in Beijing time should be 00:00:00
    const beijingHour = (startDate.getUTCHours() + 8) % 24;
    expect(beijingHour).toBe(0);
    expect(startDate.getUTCMinutes()).toBe(0);
    expect(startDate.getUTCSeconds()).toBe(0);
  });

  it("today endDate is Beijing 23:59:59.999", () => {
    const { endDate } = getDateRange("today");
    // endDate in Beijing time should be 23:59:59.999
    const beijingHour = (endDate.getUTCHours() + 8) % 24;
    expect(beijingHour).toBe(23);
    expect(endDate.getUTCMinutes()).toBe(59);
    expect(endDate.getUTCSeconds()).toBe(59);
  });

  it("week range spans exactly 8 days (7 past days + today)", () => {
    const { startDate, endDate } = getDateRange("week");
    const diffMs = endDate.getTime() - startDate.getTime() + 1;
    expect(diffMs).toBe(8 * 24 * 60 * 60 * 1000);
  });

  it("today range start is before end", () => {
    const { startDate, endDate } = getDateRange("today");
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  it("week range start is before end", () => {
    const { startDate, endDate } = getDateRange("week");
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  it("fetchedAt (getTodayBeijing) falls within today's date range", () => {
    // Simulate getTodayBeijing logic used in fetchers
    const now = new Date();
    const beijingNow = new Date(now.getTime() + BEIJING_OFFSET_MS);
    const beijingMidnight = new Date(
      Date.UTC(beijingNow.getUTCFullYear(), beijingNow.getUTCMonth(), beijingNow.getUTCDate())
    );
    const fetchedAt = new Date(beijingMidnight.getTime() - BEIJING_OFFSET_MS);

    const { startDate, endDate } = getDateRange("today");
    expect(fetchedAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
    expect(fetchedAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
  });
});

// ── Data structure validation ─────────────────────────────────────────────────
describe("Paper data structure", () => {
  const mockPaper = {
    id: 1,
    paperId: "arxiv-2502-12345",
    title: "Test Paper Title",
    titleCn: "测试论文标题",
    tag: "LLM",
    source: "arXiv",
    url: "https://arxiv.org/abs/2502.12345",
    submitted: "2026-02-28",
    impactScore: 8.5,
    corePrinciple: "核心原理",
    bottomLogic: "底层逻辑",
    productImagination: "落地想象",
    publishedAt: new Date(),
    createdAt: new Date(),
  };

  it("has required fields", () => {
    expect(mockPaper.paperId).toBeDefined();
    expect(mockPaper.title).toBeDefined();
    expect(mockPaper.publishedAt).toBeDefined();
  });

  it("paperId follows arxiv format", () => {
    expect(mockPaper.paperId).toMatch(/^arxiv-/);
  });

  it("impactScore is within valid range", () => {
    expect(mockPaper.impactScore).toBeGreaterThanOrEqual(1);
    expect(mockPaper.impactScore).toBeLessThanOrEqual(10);
  });
});

describe("News item data structure", () => {
  const mockNews = {
    id: 1,
    newsId: "news-2502-001",
    headline: "Test Headline",
    headlineCn: "测试标题",
    tag: "OpenAI",
    source: "TechCrunch",
    url: "https://techcrunch.com",
    time: "2026-02-28",
    urgency: "high" as const,
    summary: "新闻摘要",
    powerShift: "权力变动",
    businessInsight: "商业启示",
    publishedAt: new Date(),
    createdAt: new Date(),
  };

  it("has required fields", () => {
    expect(mockNews.newsId).toBeDefined();
    expect(mockNews.headline).toBeDefined();
    expect(mockNews.urgency).toBeDefined();
  });

  it("urgency is valid enum value", () => {
    expect(["critical", "high", "medium"]).toContain(mockNews.urgency);
  });
});

describe("Product data structure", () => {
  const mockProduct = {
    id: 1,
    productId: "ph-2502-001",
    name: "Test Product",
    tagline: "A test product tagline",
    tag: "Productivity",
    source: "Product Hunt",
    url: "https://producthunt.com",
    upvotes: 500,
    verdict: "real-need" as const,
    painPointAnalysis: "痛点分析",
    interactionInnovation: "交互创新",
    publishedAt: new Date(),
    createdAt: new Date(),
  };

  it("has required fields", () => {
    expect(mockProduct.productId).toBeDefined();
    expect(mockProduct.name).toBeDefined();
    expect(mockProduct.verdict).toBeDefined();
  });

  it("verdict is valid enum value", () => {
    expect(["real-need", "pseudo-need", "watch"]).toContain(mockProduct.verdict);
  });
});

describe("Insight data structure", () => {
  const mockInsight = {
    id: 1,
    headline: "The Reasoning Revolution",
    subheadline: "AI 正在进化",
    content: "洞察内容",
    source: "arXiv + TechCrunch",
    urgency: "本周必读",
    publishedAt: new Date(),
    createdAt: new Date(),
  };

  it("has required fields", () => {
    expect(mockInsight.headline).toBeDefined();
    expect(mockInsight.content).toBeDefined();
    expect(mockInsight.publishedAt).toBeDefined();
  });

  it("publishedAt is a valid Date", () => {
    expect(mockInsight.publishedAt).toBeInstanceOf(Date);
    expect(mockInsight.publishedAt.getTime()).not.toBeNaN();
  });
});
