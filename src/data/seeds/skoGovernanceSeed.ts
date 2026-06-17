// =============================================================================
// SKO governance seed — initialization only
// =============================================================================

import type {
  SkoGovernanceSummaryRecord,
  SkoKnowledgeRecord,
  TranslationMemoryRecord,
} from "@/types/compassGovernance";

const NOW = new Date().toISOString();

function skoKb(
  partial: Omit<SkoKnowledgeRecord, "createdAt" | "updatedAt" | "experience" | "languages"> & {
    languages?: SkoKnowledgeRecord["languages"];
  },
): SkoKnowledgeRecord {
  return {
    languages: ["en-US", "zh-CN"],
    ...partial,
    experience: "sko",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const SKO_KNOWLEDGE_SEED: SkoKnowledgeRecord[] = [
  skoKb({
    id: "sko-kb-what-is-compass",
    intent: "WHAT_IS_COMPASS",
    category: "Compass",
    examples: {
      "en-US": ["what is compass for sko", "what does compass do at sko", "how does compass help sellers"],
      "zh-CN": ["compass 是什么", "compass 如何帮助销售", "sko compass 有什么用"],
    },
    response: {
      "en-US": "Compass turns SKO into seller momentum. It shapes briefings, podcasts, key moments, and next steps around your role, market, technology focus, and goals.",
      "zh-CN": "Compass 将 SKO 转化为销售动能。它会根据您的角色、市场、技术重点和目标，定制简报、播客、关键片段和下一步行动。",
    },
    active: true,
    status: "active",
    priority: 100,
    tags: ["compass", "overview"],
  }),
  skoKb({
    id: "sko-kb-podcast-summary",
    intent: "PODCAST_SUMMARY",
    category: "Podcast",
    examples: {
      "en-US": ["podcast summary", "summarize the podcast", "what was the podcast about"],
      "zh-CN": ["播客摘要", "总结播客内容", "播客讲了什么"],
    },
    response: {
      "en-US": "Your podcast summary highlights the most actionable SKO moments for your geo and selling motion. Open My Compass to listen or read in English or Chinese.",
      "zh-CN": "播客摘要提炼与您区域和销售模式最相关的 SKO 要点。打开 My Compass 以中文或英文收听或阅读。",
    },
    active: true,
    status: "active",
    priority: 95,
    tags: ["podcast", "summary"],
  }),
  skoKb({
    id: "sko-kb-clip-summary",
    intent: "CLIP_SUMMARY",
    category: "Clip Summary",
    examples: {
      "en-US": ["clip summary", "summarize this clip", "key moment from the session"],
      "zh-CN": ["视频片段摘要", "总结这个片段", "这段内容的关键点"],
    },
    response: {
      "en-US": "Clip summaries focus on why a moment matters and what you should do next. Compass preserves branded terms like watsonx, IBM Bob, and RevTech.",
      "zh-CN": "视频片段摘要说明该片段为何重要以及您的下一步行动。Compass 保留 watsonx、IBM Bob、RevTech 等品牌术语。",
    },
    active: true,
    status: "active",
    priority: 90,
    tags: ["clip", "summary"],
  }),
  skoKb({
    id: "sko-kb-ai-tools",
    intent: "AI_TOOLS_REVTECH",
    category: "AI Tools",
    examples: {
      "en-US": ["ai tools for sellers", "revtech at sko", "how do ai tools help me sell"],
      "zh-CN": ["销售 ai 工具", "revtech 怎么用", "ai 工具如何帮助销售"],
    },
    response: {
      "en-US": "AI tools at SKO should remove selling friction—strong follow-up, faster prep, and clearer next steps. Connect tools to daily workflow, not generic transformation talk.",
      "zh-CN": "SKO 中的 AI 工具应减少销售摩擦——更高效的跟进、更快的准备、更清晰的下一步。将工具与日常工作流连接，而非泛泛的转型叙事。",
    },
    active: true,
    status: "active",
    priority: 88,
    tags: ["ai", "revtech", "watsonx"],
  }),
  skoKb({
    id: "sko-kb-apac-chinese",
    intent: "APAC_CHINESE_BRIEFING",
    category: "Geo",
    geoId: "APAC",
    examples: {
      "en-US": ["chinese briefing for apac", "listen in chinese", "read in chinese"],
      "zh-CN": ["中文简报", "中文收听", "中文阅读", "生成中文摘要"],
    },
    response: {
      "en-US": "APAC sellers can generate Chinese summaries and podcasts for GCG, HK, and broader APAC enablement. Branded terms stay stable in both languages.",
      "zh-CN": "APAC 销售团队可为 GCG、HK 及更广泛 APAC 区域生成中文摘要和播客。品牌术语在两种语言中保持一致。",
    },
    active: true,
    status: "active",
    priority: 85,
    tags: ["apac", "gcg", "hk", "chinese"],
  }),
  skoKb({
    id: "sko-kb-action-items",
    intent: "ACTION_ITEMS",
    category: "Action Items",
    examples: {
      "en-US": ["what are my action items", "what should i do next", "next best move"],
      "zh-CN": ["行动建议", "下一步做什么", "下一步推荐"],
    },
    response: {
      "en-US": "Action items translate SKO content into seller execution—one account conversation, one follow-up workflow, one proof point to bring to your next meeting.",
      "zh-CN": "行动建议将 SKO 内容转化为可执行的销售行动——一次客户对话、一个跟进流程、一个可在下次会议中使用的价值证明。",
    },
    active: true,
    status: "active",
    priority: 82,
    tags: ["actions", "next-best-move"],
  }),
  skoKb({
    id: "sko-kb-partner",
    intent: "PARTNER_SELLING",
    category: "Sales Enablement",
    examples: {
      "en-US": ["partner selling at sko", "ecosystem motion", "co-sell guidance"],
      "zh-CN": ["合作伙伴销售", "生态合作", "联合销售指导"],
    },
    response: {
      "en-US": "Partner SKO content focuses on co-creation, ecosystem activation, and joint value stories. Compass tailors partner guidance separately from direct seller motions.",
      "zh-CN": "合作伙伴 SKO 内容聚焦联合共创、生态激活和联合价值故事。Compass 将合作伙伴指导与直销模式分开定制。",
    },
    active: true,
    status: "active",
    priority: 80,
    tags: ["partner", "ecosystem"],
  }),
  skoKb({
    id: "sko-kb-fallback",
    intent: "FALLBACK",
    category: "Fallback",
    examples: {
      "en-US": ["help", "i am not sure", "general question"],
      "zh-CN": ["帮助", "我不确定", "一般问题"],
    },
    response: {
      "en-US": "I can help with SKO briefings, podcast summaries, clip highlights, action items, and geo-specific enablement. Try asking about a session, technology track, or your next best move.",
      "zh-CN": "我可以帮助您了解 SKO 简报、播客摘要、视频片段要点、行动建议及区域专属内容。请尝试询问某个环节、技术方向或下一步推荐。",
    },
    active: true,
    status: "active",
    priority: 10,
    tags: ["fallback"],
  }),
];

export const SKO_TRANSLATION_MEMORY_SEED: TranslationMemoryRecord[] = [
  { id: "tm-podcast-summary", sourceText: "Podcast Summary", translatedText: "播客摘要", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-clip-summary", sourceText: "Clip Summary", translatedText: "视频片段摘要", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-listen-zh", sourceText: "Listen in Chinese", translatedText: "中文收听", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-read-zh", sourceText: "Read in Chinese", translatedText: "中文阅读", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-gen-zh", sourceText: "Generate Chinese Summary", translatedText: "生成中文摘要", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-takeaways", sourceText: "Key Takeaways", translatedText: "关键要点", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-actions", sourceText: "Action Items", translatedText: "行动建议", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-nbm", sourceText: "Next Best Move", translatedText: "下一步推荐", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "ui", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-watsonx", sourceText: "watsonx", translatedText: "watsonx", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "product", notes: "Keep branded term stable", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-ibm-bob", sourceText: "IBM Bob", translatedText: "IBM Bob", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "product", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-revtech", sourceText: "RevTech", translatedText: "RevTech", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "product", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-expand-value", sourceText: "Expansion starts when the first deployment proves value.", translatedText: "扩展始于首次部署证明价值。", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "summary", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-ai-advantage", sourceText: "AI creates advantage when it changes how teams operate.", translatedText: "当 AI 改变团队运作方式时，才真正创造优势。", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "summary", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-follow-up", sourceText: "Strong follow-up is no longer just habit; it can be guided and improved.", translatedText: "高效跟进不再只是习惯，而是可以被引导和持续优化。", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "podcast", approved: true, createdAt: NOW, updatedAt: NOW },
  { id: "tm-partner-eco", sourceText: "Win through partner motions, co-creation, and ecosystem activation.", translatedText: "通过合作伙伴模式、联合共创和生态激活赢得机会。", sourceLanguage: "en-US", targetLanguage: "zh-CN", category: "clip", approved: true, createdAt: NOW, updatedAt: NOW },
];

export const SKO_GOVERNANCE_SUMMARIES_SEED: SkoGovernanceSummaryRecord[] = [
  {
    id: "gs-podcast-emea-1",
    contentId: "content-1",
    contentType: "podcast",
    title: "GM Opening — EMEA Seller Brief",
    geo: "emea",
    sourceLanguage: "en-US",
    availableLanguages: ["en-US", "zh-CN"],
    summary: {
      "en-US": "Leadership frames expansion around proof of value and architecture-led growth.",
      "zh-CN": "管理层将扩展战略定位于价值证明和架构驱动的增长。",
    },
    keyTakeaways: {
      "en-US": ["Expansion begins with deployed value", "Architecture unlocks larger opportunities"],
      "zh-CN": ["扩展始于已部署的价值", "架构能力带来更大机会"],
    },
    actionItems: {
      "en-US": ["Identify one expansion account this week", "Bring architecture language to QBR"],
      "zh-CN": ["本周确定一个扩展目标客户", "在 QBR 中引入架构语言"],
    },
    status: "approved",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "gs-clip-ai-tools",
    contentId: "content-6",
    contentType: "clip",
    title: "AI Tools & RevTech — Key Clip",
    geo: "apac",
    sourceLanguage: "en-US",
    availableLanguages: ["en-US", "zh-CN"],
    summary: {
      "en-US": "AI tools should remove selling friction and improve follow-up quality.",
      "zh-CN": "AI 工具应减少销售摩擦并提升跟进质量。",
    },
    keyTakeaways: {
      "en-US": ["Tools must give time back to sellers", "Follow-up can be guided and measured"],
      "zh-CN": ["工具必须为销售团队节省时间", "跟进可以被引导和衡量"],
    },
    actionItems: {
      "en-US": ["Apply follow-up guidance to one active opportunity"],
      "zh-CN": ["将跟进指导应用于一个活跃商机"],
    },
    status: "approved",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "gs-segment-expand",
    contentId: "content-3",
    contentType: "segment",
    title: "Expand Value — Segment Recap",
    geo: "global",
    sourceLanguage: "en-US",
    availableLanguages: ["en-US", "zh-CN"],
    summary: {
      "en-US": "Client satisfaction and successful use drive durable revenue.",
      "zh-CN": "客户满意度和成功使用驱动可持续收入。",
    },
    keyTakeaways: {
      "en-US": ["The win does not end at close", "Deployment success enables renewal and expansion"],
      "zh-CN": ["成交不是终点", "部署成功推动续约与扩展"],
    },
    actionItems: {
      "en-US": ["Partner with technical teams on adoption proof"],
      "zh-CN": ["与技术团队合作记录采用成果"],
    },
    status: "review",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "gs-daily-apac",
    contentId: "content-7",
    contentType: "dailyRecap",
    title: "APAC Day 1 Recap",
    geo: "apac",
    sourceLanguage: "en-US",
    availableLanguages: ["en-US", "zh-CN"],
    summary: {
      "en-US": "Day 1 connected platform growth, AI execution, and partner ecosystem momentum.",
      "zh-CN": "第一天内容连接平台增长、AI 执行和合作伙伴生态动能。",
    },
    keyTakeaways: {
      "en-US": ["AI advantage comes from workflow change", "Partner stories reinforce joint value"],
      "zh-CN": ["AI 优势来自工作流变革", "合作伙伴故事强化联合价值"],
    },
    actionItems: {
      "en-US": ["Share one clip with your team in Slack"],
      "zh-CN": ["在 Slack 与团队分享一个关键片段"],
    },
    status: "draft",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "gs-clip-partner",
    contentId: "content-9",
    contentType: "clip",
    title: "Partner Ecosystem — Highlight",
    geo: "gcg",
    sourceLanguage: "en-US",
    availableLanguages: ["en-US", "zh-CN"],
    summary: {
      "en-US": "Ecosystem selling requires co-creation narratives and repeatable partner plays.",
      "zh-CN": "生态销售需要联合共创叙事和可复制的合作伙伴打法。",
    },
    keyTakeaways: {
      "en-US": ["Co-sell motions need clear roles", "Ecosystem activation scales pipeline"],
      "zh-CN": ["联合销售需要清晰分工", "生态激活扩大管道"],
    },
    actionItems: {
      "en-US": ["Map one partner co-sell opportunity for the quarter"],
      "zh-CN": ["规划本季度一个合作伙伴联合销售机会"],
    },
    status: "approved",
    createdAt: NOW,
    updatedAt: NOW,
  },
];
