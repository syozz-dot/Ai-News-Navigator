import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── AI Research Papers ──────────────────────────────────────────────────────
export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  paperId: varchar("paperId", { length: 64 }).notNull().unique(), // e.g. "P001"
  title: text("title").notNull(),
  titleCn: text("titleCn"),
  tag: varchar("tag", { length: 64 }),
  source: varchar("source", { length: 128 }),
  url: text("url"),
  submitted: varchar("submitted", { length: 32 }),
  impactScore: float("impactScore"),
  corePrinciple: text("corePrinciple"),
  bottomLogic: text("bottomLogic"),
  productImagination: text("productImagination"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

// ── Industry News ────────────────────────────────────────────────────────────
export const newsItems = mysqlTable("news_items", {
  id: int("id").autoincrement().primaryKey(),
  newsId: varchar("newsId", { length: 64 }).notNull().unique(), // e.g. "N001"
  headline: text("headline").notNull(),
  headlineCn: text("headlineCn"),
  tag: varchar("tag", { length: 64 }),
  source: varchar("source", { length: 128 }),
  url: text("url"),
  time: varchar("time", { length: 32 }),
  urgency: mysqlEnum("urgency", ["critical", "high", "medium"]).default("medium").notNull(),
  summary: text("summary"),
  powerShift: text("powerShift"),
  businessInsight: text("businessInsight"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsItem = typeof newsItems.$inferSelect;
export type InsertNewsItem = typeof newsItems.$inferInsert;

// ── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull().unique(), // e.g. "PR001"
  name: varchar("name", { length: 256 }).notNull(),
  tagline: text("tagline"),
  tag: varchar("tag", { length: 64 }),
  source: varchar("source", { length: 128 }),
  url: text("url"),
  upvotes: int("upvotes"),
  verdict: mysqlEnum("verdict", ["real-need", "pseudo-need", "watch"]).default("watch").notNull(),
  painPointAnalysis: text("painPointAnalysis"),
  interactionInnovation: text("interactionInnovation"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ── Core Insights (One Thing) ─────────────────────────────────────────────────
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  headline: text("headline").notNull(),
  subheadline: text("subheadline"),
  content: text("content").notNull(),
  source: text("source"),
  urgency: varchar("urgency", { length: 128 }),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;
