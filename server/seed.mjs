/**
 * Seed script for AI News Navigator
 * Populates the database with initial sample data for testing.
 * Run: node server/seed.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

// ── Papers ────────────────────────────────────────────────────────────────────
const papersData = [
  {
    paperId: "arxiv-2502-12345",
    title: "Scaling Laws for Reasoning in Large Language Models",
    titleCn: "大语言模型推理能力的扩展规律",
    tag: "LLM",
    source: "arXiv",
    url: "https://arxiv.org/abs/2502.12345",
    submitted: today.toISOString().split("T")[0],
    impactScore: 9.2,
    corePrinciple: "研究发现，LLM 的推理能力随模型规模和推理时计算量的增加呈现出可预测的扩展规律，为未来模型设计提供了理论依据。",
    bottomLogic: "推理能力不仅取决于训练时的参数量，推理时的计算预算同样关键。这意味着「思考时间」是可以被工程化的资源。",
    productImagination: "可以构建「按需推理」的 AI 产品：简单问题快速回答，复杂决策深度思考，动态分配计算资源，大幅降低成本同时保证质量。",
    publishedAt: today,
  },
  {
    paperId: "arxiv-2502-11111",
    title: "Multimodal Chain-of-Thought Reasoning in Vision-Language Models",
    titleCn: "视觉语言模型的多模态思维链推理",
    tag: "Multimodal",
    source: "arXiv",
    url: "https://arxiv.org/abs/2502.11111",
    submitted: yesterday.toISOString().split("T")[0],
    impactScore: 8.5,
    corePrinciple: "提出了一种新的多模态思维链框架，使 VLM 能够在处理图像和文本时进行显式的中间推理步骤，显著提升复杂视觉推理任务的准确率。",
    bottomLogic: "视觉理解不再是「黑盒」——模型可以解释它「看到了什么」和「为什么这样判断」，大幅提升可信度和可调试性。",
    productImagination: "医疗影像诊断助手：不仅给出诊断结论，还能展示推理过程（先看到异常区域，再对比正常组织，最后给出置信度）。",
    publishedAt: yesterday,
  },
  {
    paperId: "arxiv-2502-09876",
    title: "Efficient Fine-tuning of Foundation Models with LoRA Variants",
    titleCn: "基于 LoRA 变体的基础模型高效微调",
    tag: "Training",
    source: "arXiv",
    url: "https://arxiv.org/abs/2502.09876",
    submitted: threeDaysAgo.toISOString().split("T")[0],
    impactScore: 7.8,
    corePrinciple: "提出了多种 LoRA 改进方案，在保持微调效率的同时，通过动态秩调整和梯度感知权重分配，将模型性能提升了 15-23%。",
    bottomLogic: "微调成本的持续下降意味着「定制化 AI」的门槛越来越低，企业级垂直模型将成为标配而非奢侈品。",
    productImagination: "SaaS 平台可以为每个企业客户提供「专属 AI 助手」——基于通用模型，用客户数据快速微调，成本控制在数百美元以内。",
    publishedAt: threeDaysAgo,
  },
];

// ── News ──────────────────────────────────────────────────────────────────────
const newsData = [
  {
    newsId: "news-2502-001",
    headline: "OpenAI Announces GPT-5 with Enhanced Reasoning Capabilities",
    headlineCn: "OpenAI 发布 GPT-5，推理能力大幅提升",
    tag: "OpenAI",
    source: "TechCrunch",
    url: "https://techcrunch.com",
    time: today.toISOString().split("T")[0],
    urgency: "critical",
    summary: "OpenAI 正式发布 GPT-5，在数学推理、代码生成和多步骤问题解决方面取得重大突破，性能较 GPT-4 提升约 40%。",
    powerShift: "**OpenAI** 再次拉开与竞争对手的差距，**Anthropic** 和 **Google** 面临压力。企业客户将加速迁移，中小型 AI 创业公司的差异化空间进一步压缩。",
    businessInsight: "对产品团队的启示：**不要押注单一模型**，建立模型无关的架构。同时，GPT-5 的推理能力意味着可以将更复杂的业务逻辑交给 AI 处理，减少规则引擎的维护成本。",
    publishedAt: today,
  },
  {
    newsId: "news-2502-002",
    headline: "Google DeepMind Releases Gemini 2.0 Ultra with 2M Context Window",
    headlineCn: "Google DeepMind 发布 Gemini 2.0 Ultra，支持 200 万 token 上下文",
    tag: "Google",
    source: "The Verge",
    url: "https://theverge.com",
    time: yesterday.toISOString().split("T")[0],
    urgency: "high",
    summary: "Gemini 2.0 Ultra 支持高达 200 万 token 的上下文窗口，可以一次性处理整个代码库或数小时的视频内容，开创了「超长上下文」新时代。",
    powerShift: "**Google** 在上下文长度上建立了显著优势，这对**企业级文档处理**和**代码分析**场景极具吸引力。RAG（检索增强生成）的部分应用场景将被直接替代。",
    businessInsight: "超长上下文改变了产品设计范式：**不再需要复杂的分块策略**，可以直接将整个知识库喂给模型。这降低了 AI 产品的技术门槛，但也意味着竞争将更多回归到数据质量和产品体验。",
    publishedAt: yesterday,
  },
  {
    newsId: "news-2502-003",
    headline: "EU AI Act Enforcement Begins: What It Means for AI Companies",
    headlineCn: "欧盟 AI 法案开始执行：对 AI 公司意味着什么",
    tag: "监管",
    source: "VentureBeat",
    url: "https://venturebeat.com",
    time: threeDaysAgo.toISOString().split("T")[0],
    urgency: "high",
    summary: "欧盟 AI 法案正式进入执法阶段，高风险 AI 系统需要进行强制性合规审查，违规罚款最高可达全球年营收的 7%。",
    powerShift: "**欧洲市场**的合规成本将显著上升，**大型科技公司**因有专门的法律团队而具备优势，**中小型 AI 创业公司**进入欧洲市场的门槛大幅提高。",
    businessInsight: "**合规即产品功能**：将 AI 可解释性、偏见检测和审计日志作为产品卖点，而非仅仅是法律义务。率先建立合规能力的公司将在欧洲市场获得先发优势。",
    publishedAt: threeDaysAgo,
  },
];

// ── Products ──────────────────────────────────────────────────────────────────
const productsData = [
  {
    productId: "ph-2502-001",
    name: "Cursor AI 2.0",
    tagline: "The AI-first code editor that thinks like a senior engineer",
    tag: "Code",
    source: "Product Hunt",
    url: "https://cursor.sh",
    upvotes: 2847,
    verdict: "real-need",
    painPointAnalysis: "开发者每天花费大量时间在重复性代码编写、调试和代码审查上。Cursor 通过深度理解代码上下文，将这些工作自动化，让开发者专注于架构设计和业务逻辑。",
    interactionInnovation: "革命性的「Tab 补全」体验——不只是单行补全，而是预测整个函数甚至文件的修改意图。结合自然语言指令，实现了「描述意图 → 生成代码」的无缝工作流。",
    publishedAt: today,
  },
  {
    productId: "ph-2502-002",
    name: "Perplexity Pages",
    tagline: "Turn any research into a beautiful, shareable document",
    tag: "Productivity",
    source: "Product Hunt",
    url: "https://perplexity.ai",
    upvotes: 1523,
    verdict: "real-need",
    painPointAnalysis: "研究人员和知识工作者花费大量时间整理信息、撰写报告，但从「信息收集」到「可分享文档」的转化过程繁琐低效。",
    interactionInnovation: "一键将 Perplexity 的搜索结果转化为结构化的文章页面，自动添加引用、图表和摘要。将「搜索」和「创作」两个独立工作流合并为一个流畅体验。",
    publishedAt: yesterday,
  },
  {
    productId: "ph-2502-003",
    name: "HeyGen 3.0",
    tagline: "Create studio-quality AI videos in 30 languages",
    tag: "Video",
    source: "Product Hunt",
    url: "https://heygen.com",
    upvotes: 987,
    verdict: "watch",
    painPointAnalysis: "企业需要制作多语言视频内容，但专业视频制作成本高昂，翻译配音质量参差不齐。HeyGen 通过 AI 数字人和实时翻译降低了视频内容的制作门槛。",
    interactionInnovation: "「一次录制，多语言发布」——上传一段视频，AI 自动生成 30 种语言版本，口型同步、语调自然，几乎无法与真人区分。",
    publishedAt: threeDaysAgo,
  },
];

// ── Insights ──────────────────────────────────────────────────────────────────
const insightsData = [
  {
    headline: "The Reasoning Revolution: From Pattern Matching to Deliberate Thinking",
    subheadline: "AI 正在从「快思考」进化为「慢思考」，这改变了一切",
    content: "本周最重要的信号是：AI 模型的推理能力正在经历质的飞跃。GPT-5 和 Gemini 2.0 的发布，加上 arXiv 上关于推理扩展规律的研究，共同指向一个趋势——AI 不再只是「快速模式匹配」，而是开始具备「深度推理」能力。这对产品设计意味着：可以将更复杂的判断任务交给 AI，而不只是简单的分类和生成。下一个大机会在于「AI 决策辅助」而非「AI 内容生成」。",
    source: "arXiv + TechCrunch + Product Hunt",
    urgency: "本周必读",
    publishedAt: today,
  },
];

// ── Insert data ────────────────────────────────────────────────────────────────
async function seed() {
  console.log("Starting seed...");

  try {
    // Insert papers
    for (const paper of papersData) {
      await connection.execute(
        `INSERT INTO papers (paperId, title, titleCn, tag, source, url, submitted, impactScore, corePrinciple, bottomLogic, productImagination, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        [paper.paperId, paper.title, paper.titleCn, paper.tag, paper.source, paper.url, paper.submitted,
         paper.impactScore, paper.corePrinciple, paper.bottomLogic, paper.productImagination, paper.publishedAt]
      );
      console.log(`✓ Paper: ${paper.title.slice(0, 50)}`);
    }

    // Insert news
    for (const item of newsData) {
      await connection.execute(
        `INSERT INTO news_items (newsId, headline, headlineCn, tag, source, url, time, urgency, summary, powerShift, businessInsight, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE headline=VALUES(headline)`,
        [item.newsId, item.headline, item.headlineCn, item.tag, item.source, item.url, item.time,
         item.urgency, item.summary, item.powerShift, item.businessInsight, item.publishedAt]
      );
      console.log(`✓ News: ${item.headlineCn}`);
    }

    // Insert products
    for (const product of productsData) {
      await connection.execute(
        `INSERT INTO products (productId, name, tagline, tag, source, url, upvotes, verdict, painPointAnalysis, interactionInnovation, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [product.productId, product.name, product.tagline, product.tag, product.source, product.url,
         product.upvotes, product.verdict, product.painPointAnalysis, product.interactionInnovation, product.publishedAt]
      );
      console.log(`✓ Product: ${product.name}`);
    }

    // Insert insights
    for (const insight of insightsData) {
      await connection.execute(
        `INSERT INTO insights (headline, subheadline, content, source, urgency, publishedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [insight.headline, insight.subheadline, insight.content, insight.source, insight.urgency, insight.publishedAt]
      );
      console.log(`✓ Insight: ${insight.headline.slice(0, 50)}`);
    }

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await connection.end();
  }
}

seed();
