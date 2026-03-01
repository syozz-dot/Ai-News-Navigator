/**
 * One-time fix: regenerate today's insight using the latest papers and news.
 * Run: node --env-file=.env server/fix-insight.mjs
 */
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Fetch recent papers
const [papers] = await conn.query(
  "SELECT titleCn, title FROM papers ORDER BY id DESC LIMIT 6"
);
// Fetch recent news
const [news] = await conn.query(
  "SELECT headlineCn, headline FROM news_items ORDER BY id DESC LIMIT 6"
);
// Fetch recent products
const [prods] = await conn.query(
  "SELECT name, tagline FROM products ORDER BY id DESC LIMIT 5"
);

const paperTitles = papers.map((p) => p.titleCn || p.title).filter(Boolean);
const newsTitles = news.map((n) => n.headlineCn || n.headline).filter(Boolean);
const productNames = prods.map((p) => `${p.name}: ${p.tagline}`).filter(Boolean);

console.log("Papers:", paperTitles);
console.log("News:", newsTitles);
console.log("Products:", productNames);

if (paperTitles.length === 0 && newsTitles.length === 0) {
  console.error("No data found, aborting.");
  await conn.end();
  process.exit(1);
}

// Call LLM via Forge API
const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

const prompt = `今日 AI 动态摘要:

论文前沿:
${paperTitles.slice(0, 3).join("\n")}

行业要闻:
${newsTitles.slice(0, 3).join("\n")}

创新产品:
${productNames.slice(0, 3).join("\n") || "（暂无）"}

请返回如下 JSON（不要有其他内容）:
{
  "headline": "今日最重要的 AI 洞察标题（英文，简洁有力）",
  "subheadline": "副标题（中文，一句话点明核心）",
  "content": "洞察内容（200字内中文，深度分析今日 AI 动态的底层逻辑和趋势）",
  "source": "综合来源（如 arXiv + TechCrunch + Product Hunt）",
  "urgency": "紧迫程度标签（如 '本周必读' / '战略级信号' / '技术突破' 等）"
}`;

const resp = await fetch(`${apiUrl}/v1/chat/completions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "你是一位顶级 AI 行业分析师，每日为产品经理和创业者提供最重要的 AI 洞察。请基于今日 AI 动态，提炼出最值得关注的核心洞察，返回 JSON 格式。",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  }),
});

const data = await resp.json();
console.log("LLM response:", JSON.stringify(data, null, 2));

const content = data.choices?.[0]?.message?.content;
if (!content) {
  console.error("No content from LLM");
  await conn.end();
  process.exit(1);
}

const parsed = JSON.parse(content);
console.log("Parsed insight:", parsed);

// Delete today's placeholder insight and insert the real one
await conn.query(
  "DELETE FROM insights WHERE headline = 'AI Insights Placeholder: No Daily Dynamics Provided' AND DATE(publishedAt) = CURDATE()"
);

await conn.query(
  "INSERT INTO insights (headline, subheadline, content, source, urgency, publishedAt) VALUES (?, ?, ?, ?, ?, NOW())",
  [
    parsed.headline || "Today's AI Insight",
    parsed.subheadline || "",
    parsed.content || "",
    parsed.source || "AI News Navigator",
    parsed.urgency || "今日必读",
  ]
);

console.log("✅ Insight saved successfully!");
await conn.end();
