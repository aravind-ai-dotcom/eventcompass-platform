// =============================================================================
// Compass Knowledge — TechXchange responses
// =============================================================================

import type { ChampionPathStep, KnowledgeItem } from "./knowledgeTypes";

export const TECHXCHANGE_KNOWLEDGE: KnowledgeItem[] = [
  {
    intent: "certification_prep",
    examples: [
      "how do i prepare for my test",
      "what should i do before certification",
      "how do i get ready for my exam",
      "prepare for my exam",
      "before my cert exam",
      "get ready for certification",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "Great question. Start by finding the certification session or prep topic that matches your product area. Then build a focused path: review the related sessions, attend a hands-on lab if available, and use Compass to find experts or Champions who can help you clarify the hard parts. Certification is not just a test moment — it is a learning path.",
      "zh-CN":
        "很好的问题。首先找到与您产品领域匹配的认证会议或备考主题。然后建立一条专注的学习路径：复习相关会议、参加动手实验（如有），并使用 Compass 寻找专家或 Champions 帮助您攻克难点。认证不仅仅是一次考试——而是一条学习路径。",
    },
  },
  {
    intent: "champion_match",
    examples: [
      "champion you recommend for me to meet",
      "good champion for me",
      "can i meet an ibm champion",
      "recommend a champion",
      "champion should i meet today",
      "who is a good champion",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "Yes. Champions are some of the best people to meet at TechXchange because they bring real-world experience, community energy, and practical knowledge. Compass can recommend Champions based on your interests, products, role, and goals. If you meet a Champion, thank them for the knowledge they share and ask what sessions or communities they think you should explore next.",
      "zh-CN":
        "当然可以。Champions 是 TechXchange 最值得结识的人之一——他们带来实战经验、社区活力与实用知识。Compass 可以根据您的兴趣、产品、角色和目标推荐 Champions。如果您遇到 Champion，请感谢他们分享的知识，并询问他们推荐您探索哪些会议或社区。",
    },
  },
  {
    intent: "fun_recommendation",
    examples: [
      "something fun i can try today",
      "anything fun happening",
      "what can i do that is social",
      "social thing i can do",
      "is there something fun",
      "fun i can try today",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "Yes — TechXchange is not only about sessions. Look for community meetups, networking moments, Sandbox experiences, the Block Party, and informal gatherings where you can meet people with similar interests. Compass can help you balance learning, community, and fun so your day does not feel like only back-to-back sessions.",
      "zh-CN":
        "当然有——TechXchange 不仅仅是会议。您可以关注社区聚会、社交时刻、Sandbox 体验、Block Party 以及非正式聚会，结识志同道合的人。Compass 可以帮助您平衡学习、社区与乐趣，让一天不只有连续的会议。",
    },
  },
  {
    intent: "out_of_scope_location",
    examples: [
      "where do i get groceries",
      "where is a grocery store",
      "where can i buy food",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "I may not know local grocery options from inside Compass yet. But I can help you make the most of TechXchange — the technology learning, community connections, sessions, labs, Champions, and social experiences around the event. For groceries or local errands, please check your hotel, event concierge, or maps app.",
      "zh-CN":
        "Compass 目前可能无法提供 TechXchange 周边的杂货店信息。但我可以帮助您充分利用本次活动——技术学习、社区连接、会议、实验、Champions 以及社交体验。如需购买日用品，请查阅酒店、活动礼宾服务或地图应用。",
    },
  },
  {
    intent: "champion_playful",
    examples: [
      "will there be superheroes",
      "are there superheroes at techxchange",
      "can i meet a superhero",
      "superheroes at the event",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "Not superheroes exactly — but we do have Champions. IBM Champions are community leaders who share knowledge, help others learn, and bring real-world experience into the event. If you see a Champion, say hello, thank them for their contributions, and ask what session, product area, or community they recommend you explore next.",
      "zh-CN":
        "不完全是超级英雄——但我们有 Champions。IBM Champions 是社区领袖，分享知识、帮助他人学习，并将实战经验带入活动。如果您遇到 Champion，请向他们问好，感谢他们的贡献，并询问他们推荐您探索哪些会议、产品领域或社区。",
    },
  },
  {
    intent: "champion_path",
    examples: [
      "what can a champion do",
      "how can champions help",
      "i am a champion what should i do",
      "i'm a champion what should i do",
      "champion path",
      "what should champions do at techxchange",
    ],
    experience: "techxchange",
    response: {
      "en-US":
        "As a Champion, your path is to learn, connect, contribute, and inspire. Attend the sessions that sharpen your expertise, meet people who need guidance, share what you know in conversations and meetups, and help others leave TechXchange with more confidence than they arrived with. Compass can help you find the people, sessions, and community moments where your voice can have the greatest impact.",
      "zh-CN":
        "作为 Champion，您的路径是学习、连接、贡献与启发。参加提升专业能力的会议，结识需要指导的人，在对话和聚会中分享所知，并帮助他人带着比来时更多的信心离开 TechXchange。Compass 可以帮助您找到让您的声音产生最大影响的人、会议和社区时刻。",
    },
  },
];

export const CHAMPION_PATH_STEPS: ChampionPathStep[] = [
  {
    label: "DISCOVER",
    copy: {
      "en-US": "Explore new technology, sessions, and ideas that expand your expertise.",
      "zh-CN": "探索新技术、会议和想法，拓展您的专业能力。",
    },
  },
  {
    label: "CONNECT",
    copy: {
      "en-US": "Meet attendees, peers, experts, and community members who share your interests.",
      "zh-CN": "结识与会者、同行、专家以及与您兴趣相投的社区成员。",
    },
  },
  {
    label: "CONTRIBUTE",
    copy: {
      "en-US": "Share practical knowledge, answer questions, mentor others, and participate in community moments.",
      "zh-CN": "分享实用知识、回答问题、指导他人，并参与社区活动。",
    },
  },
  {
    label: "INSPIRE",
    copy: {
      "en-US": "Help others see what is possible and leave the community stronger than you found it.",
      "zh-CN": "帮助他人看到更多可能，让社区因您而更加强大。",
    },
  },
];
