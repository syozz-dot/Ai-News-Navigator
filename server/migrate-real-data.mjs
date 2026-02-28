/**
 * Migration script: replace seed data with real content from the original static site
 * Run: node server/migrate-real-data.mjs
 */
import mysql from "mysql2/promise";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

async function migrate() {
  console.log("Clearing old seed data...");
  await connection.execute("DELETE FROM insights");
  await connection.execute("DELETE FROM products");
  await connection.execute("DELETE FROM news_items");
  await connection.execute("DELETE FROM papers");
  console.log("✓ Old data cleared");

  // ── Papers ──────────────────────────────────────────────────────────────────
  const papers = [
    {
      paperId: "arxiv-2602.23152",
      title: "The Trinity of Consistency as a Defining Principle for General World Models",
      titleCn: "通用世界模型的「一致性三位一体」原则",
      tag: "cs.AI",
      source: "arXiv · 2602.23152",
      url: "https://arxiv.org/abs/2602.23152",
      submitted: "2026-02-26",
      impactScore: 9,
      corePrinciple: "提出世界模型必须同时满足三个一致性：模态一致性（语义接口）、空间一致性（几何基础）、时间一致性（因果引擎）。119页、50张图，是迄今为止最系统的世界模型理论框架。",
      bottomLogic: "过去的 AI 视频生成（Sora 等）只是在「拟合像素分布」，并不真正理解物理世界。这篇论文指出：一个真正的世界模型必须同时理解「这是什么」（模态）、「在哪里」（空间）、「接下来会怎样」（时间）——三者缺一不可。就像人类大脑的三个感知维度，缺少任何一个都会产生幻觉。",
      productImagination: "一旦这套框架落地，AI 将能真正「理解」视频而非仅仅生成视频。产品侧的想象：① 游戏 NPC 能真正感知物理规律，不再穿墙；② 自动驾驶仿真环境的可信度大幅提升；③ 视频编辑 AI 能精准理解「这个杯子如果倒了会怎样」，实现物理感知的内容创作。",
      publishedAt: new Date("2026-02-26"),
    },
    {
      paperId: "arxiv-2602.23363",
      title: "MediX-R1: Open Ended Medical Reinforcement Learning",
      titleCn: "MediX-R1：开放式医疗强化学习框架",
      tag: "cs.CV",
      source: "arXiv · 2602.23363",
      url: "https://arxiv.org/abs/2602.23363",
      submitted: "2026-02-26",
      impactScore: 8,
      corePrinciple: "用强化学习（RL）训练医疗多模态大模型，突破了以往只能回答选择题的限制，实现了自由文本的临床推理。仅用 51K 训练样本，在开放式临床任务上大幅超越同类开源模型。",
      bottomLogic: "以前的医疗 AI 只能做「选择题」——给四个选项，选一个。这就像让医生只能用「是/否」回答病人，毫无实用价值。MediX-R1 用了一个复合奖励信号（语义准确性 + 医学术语相似度 + 格式规范性），让模型学会像真正的医生一样「写诊断报告」。",
      productImagination: "① 医院的 AI 辅助诊断系统可以从「给建议」升级为「写报告」，减少医生的文书工作；② 医疗问答 App 不再只给模板答案，而是能根据用户描述的症状给出结构化的分析；③ 医学教育场景：AI 可以扮演「标准病例」，让医学生练习问诊。",
      publishedAt: new Date("2026-02-26"),
    },
    {
      paperId: "arxiv-2602.22897",
      title: "OmniGAIA: Towards Native Omni-Modal AI Agents",
      titleCn: "OmniGAIA：迈向原生全模态 AI 智能体",
      tag: "cs.AI",
      source: "arXiv · 2602.22897",
      url: "https://arxiv.org/abs/2602.22897",
      submitted: "2026-02-26",
      impactScore: 8,
      corePrinciple: "提出 OmniGAIA 基准测试，评估能同时处理视频、音频、图像并进行多轮工具调用的全模态 AI 智能体。同时发布 OmniAtlas 基础模型，通过「事后引导树探索」策略训练，显著提升跨模态推理能力。",
      bottomLogic: "现在大多数多模态模型只能「看图说话」（视觉+语言双模态）。OmniGAIA 要解决的是：AI 能不能同时听、看、理解，并调用工具完成复杂任务？比如「分析这段视频里的对话内容，并根据背景音乐的情绪，生成一份营销文案」——这需要视频、音频、语言三个模态的深度融合。",
      productImagination: "① 会议助手 2.0：不只是转录文字，而是同时分析发言者的情绪（音频）、PPT 内容（视觉）、对话逻辑（语言），生成真正有价值的会议纪要；② 短视频创作工具：AI 能理解视频的视觉节奏、背景音乐情绪，自动生成匹配的字幕和话题标签；③ 无障碍辅助：为视障/听障用户提供真正全感知的内容理解。",
      publishedAt: new Date("2026-02-26"),
    },
  ];

  for (const p of papers) {
    await connection.execute(
      `INSERT INTO papers (paperId, title, titleCn, tag, source, url, submitted, impactScore, corePrinciple, bottomLogic, productImagination, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.paperId, p.title, p.titleCn, p.tag, p.source, p.url, p.submitted,
       p.impactScore, p.corePrinciple, p.bottomLogic, p.productImagination, p.publishedAt]
    );
    console.log(`✓ Paper: ${p.titleCn}`);
  }

  // ── News ────────────────────────────────────────────────────────────────────
  const newsItems = [
    {
      newsId: "N001-2026-02-27",
      headline: "OpenAI Raises $110B — The Largest Private Funding Round in History",
      headlineCn: "OpenAI 完成 1100 亿美元融资，史上最大私募轮",
      tag: "FUNDING",
      source: "TechCrunch",
      url: "https://techcrunch.com/2026/02/27/openai-raises-110b-in-one-of-the-largest-private-funding-rounds-in-history/",
      time: "2026-02-27 06:13 PST",
      urgency: "critical",
      summary: "Amazon 投资 500 亿美元，Nvidia 和 SoftBank 各投 300 亿，估值 7300 亿美元（融资前）。OpenAI 将在 AWS Bedrock 上构建「有状态运行时环境」，并承诺消耗至少 2GW 的 AWS Trainium 算力。",
      powerShift: "**获利方**：OpenAI（资金弹药充足，可加速 AGI 研究）、AWS（绑定 OpenAI 模型，对抗 Azure）、Nvidia（3GW 推理 + 2GW 训练的 Vera Rubin 系统订单）。**被打击方**：Anthropic（政治风波雪上加霜，资金差距拉大）、Azure（OpenAI 开始向 AWS 分散算力依赖）、所有中小 AI 创业公司（融资难度进一步上升，头部效应加剧）。",
      businessInsight: "这不只是钱的问题，而是「基础设施控制权」的重新分配。OpenAI 在 AWS 上构建「有状态运行时」意味着：未来的 AI Agent 将有持久记忆和状态，这对**兴趣电商**（AI 能记住你的购物偏好并主动推荐）和**内容推荐**（AI 能跨会话理解用户的长期兴趣图谱）有深远影响。当 AI 有了「记忆」，推荐系统的逻辑将被彻底重写。",
      publishedAt: new Date("2026-02-27"),
    },
    {
      newsId: "N002-2026-02-26",
      headline: "Anthropic Refuses Pentagon's Demands; Trump Orders Federal Agencies to Cut Ties",
      headlineCn: "Anthropic 拒绝五角大楼要求，特朗普下令联邦机构断绝合作",
      tag: "GEOPOLITICS",
      source: "Anthropic Blog · CNBC · NPR",
      url: "https://www.anthropic.com/news/statement-department-of-war",
      time: "2026-02-26~27",
      urgency: "critical",
      summary: "五角大楼要求 Anthropic 移除「大规模国内监控」和「完全自主武器」两项安全限制，Anthropic 拒绝。特朗普随即下令联邦机构停用 Anthropic 产品，并将其列为「供应链风险」。OpenAI 随后宣布与五角大楼达成协议，填补空缺。",
      powerShift: "**获利方**：OpenAI（趁机拿下政府合同，政治站队成功）、Palantir（传统国防 AI 供应商地位更稳固）。**被打击方**：Anthropic（失去政府收入，品牌形象两极分化——在企业客户中可能反而加分）、AI 安全倡导者（「安全护栏」被政治化，未来更难推行）。**深层影响**：这是 AI 行业第一次因「价值观」而非「技术」被政府制裁，开创了危险先例。",
      businessInsight: "对**数字安全**行业的启示最为直接：AI 驱动的大规模监控技术正在从「科幻」变成「合同条款」。企业需要重新评估自己的 AI 供应商选择——使用哪家公司的模型，就意味着接受其背后的政治立场。这对 B2B SaaS 产品的**合规风险管理**和**供应商多元化策略**提出了新要求。",
      publishedAt: new Date("2026-02-26"),
    },
    {
      newsId: "N003-2026-02-25",
      headline: "Perplexity Launches 'Computer' — 19 AI Models Orchestrated as One Digital Worker",
      headlineCn: "Perplexity 发布「Computer」：19 个 AI 模型协同，成为你的数字同事",
      tag: "PRODUCT",
      source: "Perplexity Blog · TechCrunch",
      url: "https://www.perplexity.ai/hub/blog/introducing-perplexity-computer",
      time: "2026-02-25",
      urgency: "high",
      summary: "Perplexity Computer 将 19 个顶级 AI 模型（Opus 4.6 主推理、Gemini 深度研究、Nano Banana 图像、Veo 3.1 视频、Grok 轻量任务、ChatGPT 5.2 长上下文）统一编排，可运行数小时乃至数月的异步工作流，支持 400+ 应用集成。",
      powerShift: "**获利方**：Perplexity（从搜索引擎进化为「数字员工」，重新定义产品边界）、各模型提供商（被编排即被分发，流量入口转移）。**被打击方**：单一模型 Wrapper 类产品（如 ChatGPT 套壳应用）、传统 RPA 工具（如 UiPath）、低端外包工作（数据整理、报告生成等）。",
      businessInsight: "「多模型编排」是 2026 年最重要的产品范式转变。Perplexity 的核心洞察是：**没有一个模型能做所有事，但一个系统可以调度所有模型**。对于做**内容推荐**的产品团队，这意味着可以用 Gemini 做深度用户研究、用 Grok 做实时热点抓取、用 Nano Banana 生成配图——一个工作流完成全套内容生产。这将把内容创作的边际成本压到接近零。",
      publishedAt: new Date("2026-02-25"),
    },
  ];

  for (const n of newsItems) {
    await connection.execute(
      `INSERT INTO news_items (newsId, headline, headlineCn, tag, source, url, time, urgency, summary, powerShift, businessInsight, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.newsId, n.headline, n.headlineCn, n.tag, n.source, n.url, n.time,
       n.urgency, n.summary, n.powerShift, n.businessInsight, n.publishedAt]
    );
    console.log(`✓ News: ${n.headlineCn}`);
  }

  // ── Products ────────────────────────────────────────────────────────────────
  const products = [
    {
      productId: "T001-ironclaw",
      name: "IronClaw",
      tagline: "Secure, open-source alternative to OpenClaw — built in Rust, privacy-first",
      tag: "OPEN SOURCE",
      source: "Product Hunt · GitHub (nearai/ironclaw)",
      url: "https://www.producthunt.com/products/ironclaw",
      upvotes: 194,
      verdict: "real-need",
      painPointAnalysis: "OpenClaw 因 Moltbook 事件（AI 社交网络上的 Agent 失控）暴露了严重的安全漏洞：提示注入可窃取 API 密钥，恶意技能可抓取密码。IronClaw 用 Rust 重写了整个运行时，默认沙箱隔离，解决的是**真实存在的安全恐惧**——不是伪需求。随着 AI Agent 被越来越多地赋予「真实权限」（邮件、文件、支付），安全隔离将成为刚需。",
      interactionInnovation: "将「安全」从一个需要配置的选项变成了**默认状态**（Secure by Default）。这是 HCI 层面的重要转变：用户不需要理解安全机制，只需要知道「这个版本更安全」。类似于 HTTPS 从可选变成默认——降低了安全的认知门槛。",
      publishedAt: new Date("2026-02-25"),
    },
    {
      productId: "T002-rover",
      name: "Rover by rtrvr.ai",
      tagline: "Turn your website into an AI agent with one script tag — Think Stripe for AI agents",
      tag: "PRODUCT HUNT",
      source: "Product Hunt · #3 Today",
      url: "https://www.producthunt.com/posts/rover-by-rtrvr-ai",
      upvotes: 343,
      verdict: "real-need",
      painPointAnalysis: "网站的转化率问题长期悬而未决：用户在结账流程中迷失、表单填写放弃、操作路径不清晰。Rover 的洞察是：**与其优化 UI，不如让 AI 替用户完成操作**。「帮我结账」→ AI 填表、点击、完成支付。这击中了电商和 SaaS 产品最痛的转化漏斗问题，是真实需求。",
      interactionInnovation: "「Stripe for AI Agents」的类比非常精准——Stripe 让支付从「需要开发」变成「一行代码」，Rover 试图让网站 Agent 化也变成「一行代码」。这是**分发模式的创新**：不需要用户迁移到新平台，而是把能力嵌入到现有网站。这种「寄生式」的分发策略，比构建独立 App 的摩擦小得多。",
      publishedAt: new Date("2026-02-25"),
    },
  ];

  for (const p of products) {
    await connection.execute(
      `INSERT INTO products (productId, name, tagline, tag, source, url, upvotes, verdict, painPointAnalysis, interactionInnovation, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.productId, p.name, p.tagline, p.tag, p.source, p.url, p.upvotes,
       p.verdict, p.painPointAnalysis, p.interactionInnovation, p.publishedAt]
    );
    console.log(`✓ Product: ${p.name}`);
  }

  // ── Insight ─────────────────────────────────────────────────────────────────
  await connection.execute(
    `INSERT INTO insights (headline, subheadline, content, source, urgency, publishedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "OpenAI 的 1100 亿美元",
      "不是融资新闻，是基础设施战争的开战宣言",
      "**OpenAI 在 AWS 上构建「有状态运行时」**。这意味着 AI Agent 将获得持久记忆，产品的底层逻辑将被重写——不是明天，但已经在路上了。现在是评估你的产品「当用户的 AI 助手记住了一切，我们的差异化还在哪里？」的最佳时机。",
      "综合 OpenAI 融资公告 + AWS 合作协议",
      "立即思考",
      new Date("2026-02-28"),
    ]
  );
  console.log("✓ Insight: OpenAI 的 1100 亿美元");

  console.log("\n✅ Migration completed! Real data is now in the database.");
  await connection.end();
}

migrate().catch(async (err) => {
  console.error("❌ Migration failed:", err);
  await connection.end();
  process.exit(1);
});
