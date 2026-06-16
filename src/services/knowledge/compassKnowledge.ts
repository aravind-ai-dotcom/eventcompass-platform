// =============================================================================
// Compass Knowledge — shared responses
// Future admin: /setup/knowledge
// =============================================================================

import type { KnowledgeItem } from "./knowledgeTypes";

export const COMPASS_KNOWLEDGE: KnowledgeItem[] = [
  {
    intent: "out_of_scope_location",
    examples: [
      "where do i get groceries",
      "where is a grocery store",
      "where can i buy food",
      "grocery store near",
      "buy groceries",
    ],
    experience: "shared",
    response: {
      "en-US":
        "I may not know local grocery options from inside Compass yet. But I can help you make the most of your event — the technology learning, community connections, sessions, labs, Champions, and social experiences around you. For groceries or local errands, please check your hotel, event concierge, or maps app.",
      "zh-CN":
        "Compass 目前可能无法提供当地杂货店信息。但我可以帮助您充分利用本次活动——技术学习、社区连接、会议、实验、Champions 以及社交体验。如需购买日用品或处理本地事务，请查阅酒店、活动礼宾服务或地图应用。",
    },
  },
];
