/**
 * AI Products Fetcher
 * Fetches trending AI products from Product Hunt RSS and GitHub Trending,
 * then enriches with LLM product analysis.
 */
import { invokeLLM } from "../_core/llm";
import { upsertProduct, upsertInsight } from "../db";
import type { InsertProduct, InsertInsight } from "../../drizzle/schema";

interface ProductItem {
  name: string;
  tagline: string;
  url: string;
  upvotes?: number;
  source: string;
}

async function fetchProductHuntRss(): Promise<ProductItem[]> {
  const items: ProductItem[] = [];
  try {
    const response = await fetch("https://www.producthunt.com/feed?category=artificial-intelligence", {
      headers: { "User-Agent": "AI-News-Navigator/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[Products] PH RSS HTTP ${response.status}`);
      return items;
    }

    const xml = await response.text();
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
      const description = getField("description", item);

      if (title) {
        // Parse "Product Name - Tagline" format
        const parts = title.split(" - ");
        const name = parts[0]?.trim() || title;
        const tagline = parts.slice(1).join(" - ").trim() || description.slice(0, 100);

        items.push({ name, tagline, url: link, source: "Product Hunt" });
      }
    }
  } catch (err) {
    console.error("[Products] PH RSS error:", err);
  }
  return items;
}

async function enrichProductWithLLM(product: ProductItem): Promise<{
  tag: string;
  verdict: "real-need" | "pseudo-need" | "watch";
  painPointAnalysis: string;
  interactionInnovation: string;
}> {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位 AI 产品经理，擅长评估 AI 产品的真实价值和市场潜力。
请分析以下 AI 产品，返回 JSON 格式的结构化分析。`,
      },
      {
        role: "user",
        content: `产品名称: ${product.name}
产品描述: ${product.tagline}
来源: ${product.source}

请返回如下 JSON（不要有其他内容）:
{
  "tag": "产品类别标签（如 Productivity / Writing / Code / Image / Video / Voice / Data 等，最多2个词）",
  "verdict": "real-need|pseudo-need|watch（评估是否解决真实需求）",
  "painPointAnalysis": "痛点分析（100字内中文，分析解决了什么问题）",
  "interactionInnovation": "交互创新（80字内中文，分析产品的创新之处）"
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = result.choices[0]?.message?.content;
  if (typeof content !== "string") {
    return {
      tag: "AI Tool",
      verdict: "watch",
      painPointAnalysis: product.tagline.slice(0, 100),
      interactionInnovation: "",
    };
  }

  try {
    return JSON.parse(content);
  } catch {
    return {
      tag: "AI Tool",
      verdict: "watch",
      painPointAnalysis: product.tagline.slice(0, 100),
      interactionInnovation: "",
    };
  }
}

async function generateDailyInsight(
  papers: string[],
  news: string[],
  products: string[]
): Promise<InsertInsight | null> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一位顶级 AI 行业分析师，每日为产品经理和创业者提供最重要的 AI 洞察。
请基于今日 AI 动态，提炼出最值得关注的核心洞察，返回 JSON 格式。`,
        },
        {
          role: "user",
          content: `今日 AI 动态摘要:

论文前沿:
${papers.slice(0, 3).join("\n")}

行业要闻:
${news.slice(0, 3).join("\n")}

创新产品:
${products.slice(0, 3).join("\n")}

请返回如下 JSON（不要有其他内容）:
{
  "headline": "今日最重要的 AI 洞察标题（英文，简洁有力，如 'The Attention Economy Shifts to AI Agents'）",
  "subheadline": "副标题（中文，一句话点明核心）",
  "content": "洞察内容（200字内中文，深度分析今日 AI 动态的底层逻辑和趋势）",
  "source": "综合来源（如 arXiv + TechCrunch + Product Hunt）",
  "urgency": "紧迫程度标签（如 '本周必读' / '战略级信号' / '技术突破' 等）"
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content);
    return {
      headline: parsed.headline || "Today's AI Insight",
      subheadline: parsed.subheadline || "",
      content: parsed.content || "",
      source: parsed.source || "AI News Navigator",
      urgency: parsed.urgency || "今日必读",
      publishedAt: new Date(),
    };
  } catch (err) {
    console.error("[Products] Failed to generate daily insight:", err);
    return null;
  }
}

export async function fetchAIProducts(maxItems = 5): Promise<number> {
  console.log("[Products] Starting fetch...");
  let savedCount = 0;
  let productIndex = 1;

  const phItems = await fetchProductHuntRss();
  console.log(`[Products] Fetched ${phItems.length} items from Product Hunt`);

  const productNames: string[] = [];

  for (const item of phItems.slice(0, maxItems)) {
    try {
      const productId = `ph-${Date.now()}-${productIndex++}`;
      const enriched = await enrichProductWithLLM(item);

      const product: InsertProduct = {
        productId,
        name: item.name,
        tagline: item.tagline,
        tag: enriched.tag,
        source: item.source,
        url: item.url,
        upvotes: item.upvotes,
        verdict: enriched.verdict,
        painPointAnalysis: enriched.painPointAnalysis,
        interactionInnovation: enriched.interactionInnovation,
        publishedAt: new Date(),
      };

      await upsertProduct(product);
      savedCount++;
      productNames.push(`${item.name}: ${item.tagline}`);
      console.log(`[Products] Saved: ${item.name}`);
    } catch (err) {
      console.error(`[Products] Failed to process: ${item.name}`, err);
    }
  }

  console.log(`[Products] Done. Saved ${savedCount} products.`);
  return savedCount;
}

export { generateDailyInsight };
