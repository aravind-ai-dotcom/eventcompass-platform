// =============================================================================
// Compass Knowledge — SKO responses (incl. Chinese podcast / clip summaries)
// =============================================================================

import type { KnowledgeItem } from "./knowledgeTypes";

export const SKO_KNOWLEDGE: KnowledgeItem[] = [
  {
    intent: "fun_recommendation",
    examples: [
      "something fun at sko",
      "social thing at sales kickoff",
      "networking at sko",
    ],
    experience: "sko",
    response: {
      "en-US":
        "Yes — SKO is not only about sessions. Look for regional meetups, RevTech moments, networking breaks, and informal gatherings where sellers connect with peers and leaders. Compass can help you balance learning, pipeline focus, and community.",
      "zh-CN":
        "当然有——SKO 不仅仅是会议。您可以关注区域聚会、RevTech 环节、社交休息时段以及非正式聚会，与同行和领导者建立联系。Compass 可以帮助您平衡学习、管道重点与社区连接。",
    },
  },
];

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
