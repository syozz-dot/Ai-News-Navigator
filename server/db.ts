import { eq, gte, lte, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, papers, newsItems, products, insights, InsertPaper, InsertNewsItem, InsertProduct, InsertInsight } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Papers ────────────────────────────────────────────────────────────────────
export async function getPapers(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (startDate) conditions.push(gte(papers.publishedAt, startDate));
  if (endDate) conditions.push(lte(papers.publishedAt, endDate));
  return db.select().from(papers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(papers.publishedAt));
}

export async function upsertPaper(paper: InsertPaper) {
  const db = await getDb();
  if (!db) return;
  await db.insert(papers).values(paper).onDuplicateKeyUpdate({
    set: { title: paper.title, titleCn: paper.titleCn, corePrinciple: paper.corePrinciple, bottomLogic: paper.bottomLogic, productImagination: paper.productImagination, impactScore: paper.impactScore }
  });
}

// ── News ──────────────────────────────────────────────────────────────────────
export async function getNews(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (startDate) conditions.push(gte(newsItems.publishedAt, startDate));
  if (endDate) conditions.push(lte(newsItems.publishedAt, endDate));
  return db.select().from(newsItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsItems.publishedAt));
}

export async function upsertNewsItem(item: InsertNewsItem) {
  const db = await getDb();
  if (!db) return;
  await db.insert(newsItems).values(item).onDuplicateKeyUpdate({
    set: { headline: item.headline, headlineCn: item.headlineCn, summary: item.summary, powerShift: item.powerShift, businessInsight: item.businessInsight }
  });
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function getProducts(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (startDate) conditions.push(gte(products.publishedAt, startDate));
  if (endDate) conditions.push(lte(products.publishedAt, endDate));
  return db.select().from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.publishedAt));
}

export async function upsertProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) return;
  await db.insert(products).values(product).onDuplicateKeyUpdate({
    set: { name: product.name, tagline: product.tagline, painPointAnalysis: product.painPointAnalysis, interactionInnovation: product.interactionInnovation, upvotes: product.upvotes }
  });
}

// ── Insights ──────────────────────────────────────────────────────────────────
export async function getInsights(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (startDate) conditions.push(gte(insights.publishedAt, startDate));
  if (endDate) conditions.push(lte(insights.publishedAt, endDate));
  return db.select().from(insights)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(insights.publishedAt));
}

export async function upsertInsight(insight: InsertInsight) {
  const db = await getDb();
  if (!db) return;
  await db.insert(insights).values(insight);
}
