/**
 * Manual insight generation script
 * Run: node server/gen-insight.mjs
 */
import { createConnection } from "mysql2/promise";
import { invokeLLM } from "./server/_core/llm.js";

const db = await createConnection(process.env.DATABASE_URL);

// Get recent papers
const [papers] = await db.query(
  "SELECT titleCn, title FROM papers ORDER BY id DESC LIMIT 6"
);
// Get recent news
const [news] = await db.query(
  "SELECT headlineCn, headline FROM news_items ORDER BY id DESC LIMIT 6"
);
// Get recent products
const [prods] = await db.query(
  "SELECT name, tagline FROM products ORDER BY id DESC LIMIT 5"
);

const paperTitles = papers.map((p) => p.titleCn || p.title);
const newsTitles = news.map((n) => n.headlineCn || n.headline);
const productNames = prods.map((p) => `${p.name}: ${p.tagline}`);

console.log("Papers:", paperTitles);
console.log("News:", newsTitles);
console.log("Products:", productNames);

await db.end();
