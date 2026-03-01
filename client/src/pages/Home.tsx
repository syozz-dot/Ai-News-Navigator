/*
 * AI News Navigator — Home Page
 * Design: Google Material Design 3 (White + Blue)
 * Data: Fetched from tRPC API (papers, news, products, insights)
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import type { Paper, NewsItem, Product, Insight } from "../../../drizzle/schema";
import { ParticleBackground } from "@/components/ParticleBackground";

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  icon, label, labelCn, count, color
}: { icon: string; label: string; labelCn: string; count: number; color: "blue" | "amber" | "cyan" }) {
  const colors = {
    blue: { border: "border-blue-200", text: "text-blue-600", tag: "tag-blue" },
    amber: { border: "border-amber-200", text: "text-amber-600", tag: "tag-amber" },
    cyan: { border: "border-cyan-200", text: "text-cyan-600", tag: "tag-cyan" },
  };
  const c = colors[color];
  return (
    <div className={`flex items-center gap-4 pb-4 border-b ${c.border} mb-8`}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className={`font-display font-bold text-xl ${c.text}`}>{label}</div>
        <div className="font-cn text-sm text-gray-500 mt-0.5">{labelCn}</div>
      </div>
      <span className={`${c.tag}`}>{count} ITEMS</span>
    </div>
  );
}

// ─── Paper card ──────────────────────────────────────────────────────────────
function PaperCard({ paper, index }: { paper: Paper; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="card-material bg-white border border-gray-200 rounded-lg cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-1">
            <span className="tag-blue">{paper.tag || "AI"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">
              [{paper.paperId}] · {paper.submitted} · {paper.source}
            </div>
            <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
              {paper.title}
            </h3>
            {paper.titleCn && (
              <div className="font-cn text-gray-600 text-xs mt-1">{paper.titleCn}</div>
            )}
          </div>
          {paper.impactScore != null && (
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="font-display text-blue-600 text-lg font-bold leading-none">
                {paper.impactScore}
              </div>
              <div className="text-xs text-gray-500">IMPACT</div>
            </div>
          )}
        </div>

        {paper.corePrinciple && (
          <div className="text-gray-700 text-xs font-cn leading-relaxed line-clamp-2">
            {paper.corePrinciple}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
            {expanded ? "[ COLLAPSE ]" : "[ PM 视角 ↓ ]"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-200 pt-4 space-y-4 bg-gray-50">
              {paper.bottomLogic && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-blue">底层逻辑</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed">{paper.bottomLogic}</p>
                </div>
              )}
              {paper.productImagination && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-amber">落地想象</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed">{paper.productImagination}</p>
                </div>
              )}
              {paper.url && (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  → VIEW ON ARXIV
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── News card ───────────────────────────────────────────────────────────────
function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const urgencyColors = {
    critical: { tag: "tag-amber", dot: "bg-amber-500", label: "CRITICAL" },
    high: { tag: "tag-cyan", dot: "bg-cyan-500", label: "HIGH" },
    medium: { tag: "tag-blue", dot: "bg-blue-500", label: "MEDIUM" },
  };
  const u = urgencyColors[item.urgency] || urgencyColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
      className="card-material bg-white border border-gray-200 rounded-lg cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5 flex flex-col gap-1.5">
            <span className={`${u.tag}`}>{item.tag || "AI"}</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${u.dot} pulse-dot`} />
              <span className="text-xs text-gray-500">{u.label}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">
              [{item.newsId}] · {item.time} · {item.source}
            </div>
            <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug group-hover:text-amber-600 transition-colors">
              {item.headline}
            </h3>
            {item.headlineCn && (
              <div className="font-cn text-gray-600 text-xs mt-1">{item.headlineCn}</div>
            )}
          </div>
        </div>

        {item.summary && (
          <p className="text-gray-700 text-xs font-cn leading-relaxed line-clamp-2">
            {item.summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 group-hover:text-amber-600 transition-colors">
            {expanded ? "[ COLLAPSE ]" : "[ CPO 解读 ↓ ]"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-200 pt-4 space-y-4 bg-gray-50">
              {item.powerShift && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-amber">权力变动</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.powerShift.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-600">$1</strong>') }}
                  />
                </div>
              )}
              {item.businessInsight && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-cyan">商业启示</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.businessInsight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-600">$1</strong>') }}
                  />
                </div>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors"
                >
                  → READ SOURCE
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const verdictConfig = {
    "real-need": { label: "真实需求 ✓", color: "text-blue-600", bg: "bg-blue-50" },
    "pseudo-need": { label: "伪需求 ✗", color: "text-red-600", bg: "bg-red-50" },
    "watch": { label: "持续观察 ◎", color: "text-amber-600", bg: "bg-amber-50" },
  };
  const v = verdictConfig[product.verdict] || verdictConfig.watch;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="card-material bg-white border border-gray-200 rounded-lg cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            <span className="tag-cyan">{product.tag || "AI"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">
              [{product.productId}] · {product.source}
            </div>
            <h3 className="font-display font-bold text-gray-900 text-base leading-tight group-hover:text-cyan-600 transition-colors">
              {product.name}
            </h3>
            {product.tagline && (
              <p className="text-gray-600 text-xs font-cn mt-1 leading-snug">{product.tagline}</p>
            )}
          </div>
          {product.upvotes != null && (
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="font-display text-cyan-600 text-sm font-bold">▲{product.upvotes}</div>
              <div className="text-xs text-gray-500">VOTES</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 group-hover:text-cyan-600 transition-colors">
            {expanded ? "[ COLLAPSE ]" : "[ 产品解构 ↓ ]"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 border-t border-gray-200 pt-4 space-y-4 ${v.bg}`}>
              {product.painPointAnalysis && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-blue">痛点分析</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed">{product.painPointAnalysis}</p>
                </div>
              )}
              {product.interactionInnovation && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="tag-cyan">交互创新</span>
                  </div>
                  <p className="text-gray-700 text-xs font-cn leading-relaxed">{product.interactionInnovation}</p>
                </div>
              )}
              <div className={`inline-block px-3 py-1.5 rounded text-xs font-semibold ${v.color}`}>
                {v.label}
              </div>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  → VISIT PRODUCT
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── One Thing Insight ────────────────────────────────────────────────────────
function OneThingInsight({ insights, dateFilter }: { insights: Insight[]; dateFilter: "today" | "week" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (dateFilter === "week" && insights.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, 10000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dateFilter, insights.length]);

  const current = insights[currentIndex];
  if (!current) return null;

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="card-material bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-6"
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg text-gray-900">{current.headline}</h3>
          {current.subheadline && (
            <p className="text-sm text-blue-600 font-semibold mt-1">{current.subheadline}</p>
          )}
        </div>
        <p className="text-gray-700 text-sm font-cn leading-relaxed">{current.content}</p>
        <div className="flex items-center justify-between pt-4 border-t border-blue-200">
          <span className="text-xs text-gray-500">来源：{current.source}</span>
          {current.urgency && (
            <span className="text-xs font-semibold text-blue-600">{current.urgency}</span>
          )}
        </div>
        {insights.length > 1 && (
          <div className="flex gap-1 justify-center">
            {insights.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-16 h-5 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-sm">暂无{label}数据</p>
      <p className="text-xs mt-1">数据将在每日 08:00 自动更新</p>
    </div>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
const DEFAULT_VISIBLE = 3;

// ─── Collapsible section list ─────────────────────────────────────────────────
function CollapsibleList<T>({ 
  items, 
  renderItem, 
  dateFilter,
  accentColor,
}: { 
  items: T[]; 
  renderItem: (item: T, idx: number) => React.ReactNode;
  dateFilter: "today" | "week";
  accentColor: "blue" | "amber" | "cyan";
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = dateFilter === "week" && items.length > DEFAULT_VISIBLE;
  const visibleItems = shouldCollapse && !expanded ? items.slice(0, DEFAULT_VISIBLE) : items;
  const hiddenCount = items.length - DEFAULT_VISIBLE;

  const colors = {
    blue: { btn: "text-blue-600 border-blue-200 hover:bg-blue-50", dot: "bg-blue-600" },
    amber: { btn: "text-amber-600 border-amber-200 hover:bg-amber-50", dot: "bg-amber-600" },
    cyan: { btn: "text-cyan-600 border-cyan-200 hover:bg-cyan-50", dot: "bg-cyan-600" },
  };
  const c = colors[accentColor];

  return (
    <>
      <div className="grid gap-4">
        {visibleItems.map((item, idx) => renderItem(item, idx))}
      </div>
      {shouldCollapse && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-medium transition-all ${c.btn}`}
          >
            {expanded ? (
              <>
                <span>收起</span>
                <span className="text-xs opacity-60">↑</span>
              </>
            ) : (
              <>
                <span>查看全部 {items.length} 条</span>
                <span className="text-xs opacity-60">还有 {hiddenCount} 条 ↓</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [dateFilter, setDateFilter] = useState<"today" | "week">("week");

  const papersQuery = trpc.papers.list.useQuery({ filter: dateFilter });
  const newsQuery = trpc.news.list.useQuery({ filter: dateFilter });
  const productsQuery = trpc.products.list.useQuery({ filter: dateFilter });
  const insightsQuery = trpc.insights.list.useQuery({ filter: dateFilter });

  const papers = papersQuery.data || [];
  const news = newsQuery.data || [];
  const products = productsQuery.data || [];
  const insights = insightsQuery.data || [];

  const isLoading = papersQuery.isLoading || newsQuery.isLoading || productsQuery.isLoading;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ minHeight: '320px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 50%, #f5f8ff 100%)' }}>
        {/* Particle Flow Background (方案A) */}
        <ParticleBackground />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-white/20" />

        {/* Content */}
        <div className="relative text-center z-10 py-16 px-4">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">
            AI NEWS NAVIGATOR
          </h1>
          <p className="text-lg text-gray-600 mb-6">AI 新闻导航</p>

          {/* Date Filter Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setDateFilter("week")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                dateFilter === "week"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
              }`}
            >
              🗓 最近一周
            </button>
            <button
              onClick={() => setDateFilter("today")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                dateFilter === "today"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
              }`}
            >
              ✨ 今日动态
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter value={papers.length} />
              </div>
              <div className="text-xs text-gray-600 mt-1">论文扫描</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-amber-600">
                <AnimatedCounter value={news.length} />
              </div>
              <div className="text-xs text-gray-600 mt-1">行业要闻</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-cyan-600">
                <AnimatedCounter value={products.length} />
              </div>
              <div className="text-xs text-gray-600 mt-1">创新产品</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                <AnimatedCounter value={insights.length} />
              </div>
              <div className="text-xs text-gray-600 mt-1">核心洞察</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* One Thing Insight */}
        {insights.length > 0 && (
          <section className="mb-16">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">◈ 核心洞察</h2>
              <p className="text-gray-600">The One Thing · 今日必读</p>
            </div>
            <AnimatePresence mode="wait">
              <OneThingInsight insights={insights} dateFilter={dateFilter} />
            </AnimatePresence>
          </section>
        )}

        {/* Papers Section */}
        <section className="mb-16">
          <SectionHeader icon="📄" label="AI Research Frontier" labelCn="AI 论文前沿" count={papers.length} color="blue" />
          {papersQuery.isLoading ? (
            <LoadingSkeleton />
          ) : papers.length > 0 ? (
            <CollapsibleList
              items={papers}
              dateFilter={dateFilter}
              accentColor="blue"
              renderItem={(paper, idx) => (
                <PaperCard key={paper.id} paper={paper} index={idx} />
              )}
            />
          ) : (
            <EmptyState label="论文" />
          )}
          <p className="text-xs text-gray-500 mt-4">数据来源：arXiv · HuggingFace Trending Papers</p>
        </section>

        {/* News Section */}
        <section className="mb-16">
          <SectionHeader icon="📰" label="Industry Pulse" labelCn="AI 行业要闻" count={news.length} color="amber" />
          {newsQuery.isLoading ? (
            <LoadingSkeleton />
          ) : news.length > 0 ? (
            <CollapsibleList
              items={news}
              dateFilter={dateFilter}
              accentColor="amber"
              renderItem={(item, idx) => (
                <NewsCard key={item.id} item={item} index={idx} />
              )}
            />
          ) : (
            <EmptyState label="新闻" />
          )}
          <p className="text-xs text-gray-500 mt-4">数据来源：TechCrunch · The Verge · VentureBeat · Official Blogs</p>
        </section>

        {/* Products Section */}
        <section className="mb-16">
          <SectionHeader icon="🛠" label="Product Hunt" labelCn="AI 创新产品" count={products.length} color="cyan" />
          {productsQuery.isLoading ? (
            <LoadingSkeleton />
          ) : products.length > 0 ? (
            <CollapsibleList
              items={products}
              dateFilter={dateFilter}
              accentColor="cyan"
              renderItem={(product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              )}
            />
          ) : (
            <EmptyState label="产品" />
          )}
          <p className="text-xs text-gray-500 mt-4">数据来源：Product Hunt AI · There's an AI for That · GitHub Trending</p>
        </section>

        {/* Empty State - all sections empty */}
        {!isLoading && papers.length === 0 && news.length === 0 && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">该时间段暂无数据</p>
            <p className="text-gray-400 text-sm">数据将在每日 08:00（北京时间）自动更新</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 mt-16 text-center text-xs text-gray-500">
          <p className="mb-2">AI NEWS NAVIGATOR · 扫描完成于 {today}</p>
          <p className="mt-1">
            Made by{" "}
            <span className="font-semibold text-gray-700">Syozz</span>
            {" · "}
            <a
              href="mailto:syozz0124@gmail.com"
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              syozz0124@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
