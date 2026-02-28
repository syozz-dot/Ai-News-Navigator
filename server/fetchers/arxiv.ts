/**
 * arXiv Fetcher
 * Uses the arXiv API (no key required) to fetch recent AI papers.
 * Docs: https://arxiv.org/help/api/user-manual
 */
import { invokeLLM } from "../_core/llm";
import { upsertPaper } from "../db";
import type { InsertPaper } from "../../drizzle/schema";

const ARXIV_API = "https://export.arxiv.org/api/query";

// AI-related search queries
const AI_QUERIES = [
  "cat:cs.AI",
  "cat:cs.LG",
  "cat:cs.CL",
  "cat:cs.CV",
];

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  published: string;
  authors: string[];
  categories: string[];
  links: Array<{ href: string; type?: string }>;
}

function parseArxivXml(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getId = (s: string) => {
      const m = s.match(/<id>(.*?)<\/id>/);
      return m ? m[1].trim() : "";
    };
    const getTitle = (s: string) => {
      const m = s.match(/<title>([\s\S]*?)<\/title>/);
      return m ? m[1].replace(/\s+/g, " ").trim() : "";
    };
    const getSummary = (s: string) => {
      const m = s.match(/<summary>([\s\S]*?)<\/summary>/);
      return m ? m[1].replace(/\s+/g, " ").trim() : "";
    };
    const getPublished = (s: string) => {
      const m = s.match(/<published>(.*?)<\/published>/);
      return m ? m[1].trim() : "";
    };
    const getCategories = (s: string) => {
      const cats: string[] = [];
      const catRegex = /<category term="([^"]+)"/g;
      let cm;
      while ((cm = catRegex.exec(s)) !== null) cats.push(cm[1]);
      return cats;
    };
    const getLinks = (s: string) => {
      const links: Array<{ href: string; type?: string }> = [];
      const linkRegex = /<link([^>]*)>/g;
      let lm;
      while ((lm = linkRegex.exec(s)) !== null) {
        const attrs = lm[1];
        const href = attrs.match(/href="([^"]+)"/)?.[1] || "";
        const type = attrs.match(/type="([^"]+)"/)?.[1];
        if (href) links.push({ href, type });
      }
      return links;
    };

    entries.push({
      id: getId(entry),
      title: getTitle(entry),
      summary: getSummary(entry),
      published: getPublished(entry),
      authors: [],
      categories: getCategories(entry),
      links: getLinks(entry),
    });
  }
  return entries;
}

async function enrichPaperWithLLM(paper: {
  title: string;
  summary: string;
  categories: string[];
}): Promise<{
  titleCn: string;
  tag: string;
  impactScore: number;
  corePrinciple: string;
  bottomLogic: string;
  productImagination: string;
}> {
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位 AI 产品专家，擅长分析 AI 研究论文并提炼其商业价值。
请用中文分析以下论文，返回 JSON 格式的结构化数据。`,
      },
      {
        role: "user",
        content: `论文标题: ${paper.title}
摘要: ${paper.summary}
分类: ${paper.categories.join(", ")}

请返回如下 JSON（不要有其他内容）:
{
  "titleCn": "论文标题的中文翻译（简洁）",
  "tag": "论文领域标签（如 LLM / Vision / Robotics / Multimodal / RL / NLP 等，最多2个词）",
  "impactScore": 数字（1-10，评估对AI产品的影响力）,
  "corePrinciple": "核心原理（100字内中文）",
  "bottomLogic": "底层逻辑（80字内中文，从产品经理视角）",
  "productImagination": "落地想象（100字内中文，具体产品应用场景）"
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = result.choices[0]?.message?.content;
  if (typeof content !== "string") {
    return {
      titleCn: "",
      tag: "AI",
      impactScore: 5,
      corePrinciple: paper.summary.slice(0, 100),
      bottomLogic: "",
      productImagination: "",
    };
  }

  try {
    return JSON.parse(content);
  } catch {
    return {
      titleCn: "",
      tag: "AI",
      impactScore: 5,
      corePrinciple: paper.summary.slice(0, 100),
      bottomLogic: "",
      productImagination: "",
    };
  }
}

export async function fetchArxivPapers(maxResults = 5): Promise<number> {
  console.log("[arXiv] Starting fetch...");
  let savedCount = 0;

  for (const query of AI_QUERIES.slice(0, 2)) {
    try {
      const url = `${ARXIV_API}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
      const response = await fetch(url, {
        headers: { "User-Agent": "AI-News-Navigator/1.0" },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        console.error(`[arXiv] HTTP ${response.status} for query: ${query}`);
        continue;
      }

      const xml = await response.text();
      const entries = parseArxivXml(xml);
      console.log(`[arXiv] Fetched ${entries.length} entries for ${query}`);

      for (const entry of entries.slice(0, 3)) {
        try {
          const arxivId = entry.id.split("/abs/").pop() || entry.id;
          const paperId = `arxiv-${arxivId.replace(/\./g, "-")}`;
          const paperUrl = entry.links.find((l) => l.type === "text/html")?.href || entry.id;
          const publishedAt = new Date(entry.published);

          // Enrich with LLM
          const enriched = await enrichPaperWithLLM({
            title: entry.title,
            summary: entry.summary,
            categories: entry.categories,
          });

          const paper: InsertPaper = {
            paperId,
            title: entry.title,
            titleCn: enriched.titleCn,
            tag: enriched.tag,
            source: "arXiv",
            url: paperUrl,
            submitted: publishedAt.toISOString().split("T")[0],
            impactScore: enriched.impactScore,
            corePrinciple: enriched.corePrinciple,
            bottomLogic: enriched.bottomLogic,
            productImagination: enriched.productImagination,
            publishedAt,
          };

          await upsertPaper(paper);
          savedCount++;
          console.log(`[arXiv] Saved paper: ${entry.title.slice(0, 60)}`);
        } catch (err) {
          console.error(`[arXiv] Failed to process entry: ${entry.title}`, err);
        }
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`[arXiv] Error fetching ${query}:`, err);
    }
  }

  console.log(`[arXiv] Done. Saved ${savedCount} papers.`);
  return savedCount;
}
