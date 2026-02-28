/**
 * AI News Fetcher
 * Fetches AI industry news from free RSS feeds and enriches with LLM.
 * Sources: TechCrunch AI, VentureBeat AI, The Verge AI
 */
import { invokeLLM } from "../_core/llm";
import { upsertNewsItem } from "../db";
import type { InsertNewsItem } from "../../drizzle/schema";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

const RSS_FEEDS = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", category: "AI" },
  { url: "https://feeds.feedburner.com/venturebeat/SZYF", source: "VentureBeat", category: "AI" },
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "AI" },
];

function parseRssXml(xml: string, source: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const getField = (tag: string, s: string) => {
      const m = s.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || "").trim() : "";
    };

    const title = getField("title", item);
    const link = getField("link", item) || item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || "";
    const pubDate = getField("pubDate", item) || getField("published", item);
    const description = getField("description", item) || getField("summary", item);

    if (title && link) {
      items.push({ title, link, pubDate, description, source });
    }
  }
  return items;
}

function isAIRelated(title: string, description: string): boolean {
  const keywords = [
    "AI", "artificial intelligence", "machine learning", "deep learning",
    "ChatGPT", "GPT", "Claude", "Gemini", "LLM", "OpenAI", "Anthropic",
    "Google AI", "Microsoft AI", "Meta AI", "neural", "model", "robot",
    "automation", "generative", "大模型", "人工智能", "大语言模型",
  ];
  const text = `${title} ${description}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

async function enrichNewsWithLLM(item: RssItem): Promise<{
  headlineCn: string;
  tag: string;
  urgency: "critical" | "high" | "medium";
  summary: string;
  powerShift: string;
  businessInsight: string;
}> {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位 AI 行业分析师，擅长解读 AI 新闻的商业影响。
请分析以下新闻，从产品经理和商业战略视角提供洞察，返回 JSON 格式。`,
      },
      {
        role: "user",
        content: `新闻标题: ${item.title}
来源: ${item.source}
摘要: ${item.description.slice(0, 500)}

请返回如下 JSON（不要有其他内容）:
{
  "headlineCn": "标题的中文翻译（简洁有力）",
  "tag": "新闻标签（如 OpenAI / Google / 监管 / 融资 / 产品发布 等，最多2个词）",
  "urgency": "critical|high|medium（根据对AI行业的影响程度）",
  "summary": "新闻摘要（100字内中文）",
  "powerShift": "权力变动分析（80字内中文，分析谁受益谁受损，用**加粗**关键词）",
  "businessInsight": "商业启示（100字内中文，对产品团队的启发，用**加粗**关键词）"
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = result.choices[0]?.message?.content;
  if (typeof content !== "string") {
    return {
      headlineCn: item.title,
      tag: "AI",
      urgency: "medium",
      summary: item.description.slice(0, 100),
      powerShift: "",
      businessInsight: "",
    };
  }

  try {
    return JSON.parse(content);
  } catch {
    return {
      headlineCn: item.title,
      tag: "AI",
      urgency: "medium",
      summary: item.description.slice(0, 100),
      powerShift: "",
      businessInsight: "",
    };
  }
}

export async function fetchAINews(maxPerSource = 3): Promise<number> {
  console.log("[News] Starting fetch...");
  let savedCount = 0;
  let newsIndex = 1;

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "AI-News-Navigator/1.0",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error(`[News] HTTP ${response.status} for ${feed.source}`);
        continue;
      }

      const xml = await response.text();
      const items = parseRssXml(xml, feed.source);
      console.log(`[News] Fetched ${items.length} items from ${feed.source}`);

      // Filter AI-related news
      const aiItems = items.filter((item) => isAIRelated(item.title, item.description));
      console.log(`[News] ${aiItems.length} AI-related items from ${feed.source}`);

      for (const item of aiItems.slice(0, maxPerSource)) {
        try {
          const newsId = `news-${Date.now()}-${newsIndex++}`;
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

          const enriched = await enrichNewsWithLLM(item);

          const newsItem: InsertNewsItem = {
            newsId,
            headline: item.title,
            headlineCn: enriched.headlineCn,
            tag: enriched.tag,
            source: feed.source,
            url: item.link,
            time: publishedAt.toISOString().split("T")[0],
            urgency: enriched.urgency,
            summary: enriched.summary,
            powerShift: enriched.powerShift,
            businessInsight: enriched.businessInsight,
            publishedAt,
          };

          await upsertNewsItem(newsItem);
          savedCount++;
          console.log(`[News] Saved: ${item.title.slice(0, 60)}`);
        } catch (err) {
          console.error(`[News] Failed to process: ${item.title}`, err);
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[News] Error fetching ${feed.source}:`, err);
    }
  }

  console.log(`[News] Done. Saved ${savedCount} news items.`);
  return savedCount;
}
