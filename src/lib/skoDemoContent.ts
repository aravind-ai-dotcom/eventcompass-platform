// Demo SKO briefing content when Firestore has no user-specific records yet.
import type { SkoBrief, SkoPodcast } from "@/types/sko";
import { isChineseBriefingEnabled } from "@/lib/skoLocale";

export function getDemoBrief(geoId?: string, marketId?: string): SkoBrief {
  const zh = isChineseBriefingEnabled(geoId, marketId);
  return {
    id: "demo-brief",
    userId: "demo",
    editionId: "sko2h-2026",
    geoId: geoId ?? "APAC",
    marketId: marketId ?? "m-gcg",
    title: zh ? "您的 SKO 简报" : "Your SKO Briefing",
    summary: zh
      ? "Compass 为您提炼 GM Opening、Expand Value 和 AI Tools & RevTech 的关键内容，并提供可执行的销售行动建议。"
      : "Compass shaped your briefing around GM Opening, Expand Value, and AI Tools & RevTech with seller-ready actions.",
    generatedAt: new Date().toISOString(),
    sourceContentIds: ["content-1", "content-3", "content-6"],
    sourceClipIds: ["clip-1", "clip-3"],
    status: "ready",
  };
}

export function getDemoPodcasts(userId: string, geoId?: string, marketId?: string): SkoPodcast[] {
  const zh = isChineseBriefingEnabled(geoId, marketId);
  const base = {
    userId,
    editionId: "sko2h-2026",
    geoId: geoId ?? "APAC",
    generatedAt: new Date().toISOString(),
    audioUrl: "",
  };
  const pods: SkoPodcast[] = [
    {
      ...base,
      id: "demo-pod-en",
      format: "seller_podcast_15min",
      language: "en-US",
      voice: "Warm narrator",
      durationMinutes: 15,
      script: "Welcome to your SKO briefing. Here are the moments that matter for your accounts this week…",
    },
    {
      ...base,
      id: "demo-pod-quick",
      format: "quick_brief_3min",
      language: "en-US",
      durationMinutes: 3,
      script: "Three-minute SKO recap: proof of value, architecture-led growth, and AI tools that remove selling friction.",
    },
    {
      ...base,
      id: "demo-pod-exec",
      format: "executive_brief_10min",
      language: "en-US",
      durationMinutes: 10,
      script: "Executive brief: connect leadership strategy to measurable client outcomes.",
    },
    {
      ...base,
      id: "demo-pod-deep",
      format: "deep_dive_45min",
      language: "en-US",
      durationMinutes: 45,
      script: "Deep dive across the full SKO run-of-show with segment-level takeaways.",
    },
  ];
  if (zh) {
    pods.push({
      ...base,
      id: "demo-pod-zh",
      format: "seller_podcast_15min",
      language: "zh-CN",
      voice: "Executive brief",
      durationMinutes: 15,
      script: "欢迎收听您的 SKO 简报。以下是本周对您客户最重要的几个要点…",
    });
  }
  return pods;
}
