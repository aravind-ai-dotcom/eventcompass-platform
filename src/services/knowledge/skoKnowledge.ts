// =============================================================================
// Compass Knowledge — SKO event-specific overrides
// Shared Compass knowledge lives in compassKnowledge.ts
// =============================================================================

import type { KnowledgeItem } from "./knowledgeTypes";

/** SKO-only knowledge overrides; empty when shared items suffice */
export const SKO_KNOWLEDGE: KnowledgeItem[] = [];

/** Template strings for SKO podcast / clip / segment summaries */
export const SKO_SUMMARY_TEMPLATES = {
  podcastIntro: {
    "en-US": "Here are the key takeaways from this SKO segment.",
    "zh-CN": "以下是本段 SKO 内容的关键要点。",
  },
  clipHighlight: {
    "en-US":
      "This clip highlights how sellers can use AI tools to improve productivity and client value.",
    "zh-CN":
      "本视频片段重点介绍销售团队如何利用 AI 工具提升工作效率，并创造更高的客户价值。",
  },
  segmentTakeaways: {
    "en-US": "Key takeaways from this segment:",
    "zh-CN": "本段内容关键要点：",
  },
  segmentActions: {
    "en-US": "Suggested action items:",
    "zh-CN": "建议行动项：",
  },
  podcastSummaryLabel: {
    "en-US": "Podcast Summary",
    "zh-CN": "播客摘要",
  },
  clipSummaryLabel: {
    "en-US": "Clip Summary",
    "zh-CN": "视频片段摘要",
  },
} as const;

export function buildSkoPodcastSummary(
  takeaways: string[],
  locale: "en-US" | "zh-CN",
): string {
  const intro = SKO_SUMMARY_TEMPLATES.podcastIntro[locale];
  const body = takeaways.map((t, i) => `${i + 1}. ${t}`).join(" ");
  return `${intro} ${body}`;
}

export function buildSkoClipSummary(
  highlight: string,
  locale: "en-US" | "zh-CN",
): string {
  if (locale === "zh-CN") {
    return highlight.includes("AI")
      ? SKO_SUMMARY_TEMPLATES.clipHighlight["zh-CN"]
      : `本视频片段重点：${highlight}`;
  }
  return highlight || SKO_SUMMARY_TEMPLATES.clipHighlight["en-US"];
}
