// =============================================================================
// Compass Knowledge Intelligence Layer — shared (TechXchange + SKO)
// Future admin: /setup/knowledge
// =============================================================================

import type { ChampionPathStep, KnowledgeItem } from "./knowledgeTypes";

export const COMPASS_KNOWLEDGE_CATEGORY = "COMPASS_KNOWLEDGE" as const;

const CHAMPION_PATH_EN =
  "As a Champion, your path is to Discover, Connect, Contribute, and Inspire. Attend the sessions that strengthen your expertise, meet people who can benefit from your experience, share practical knowledge, and help others leave the event with greater confidence and clarity.\n\n" +
  "Champion Journey:\n\n" +
  "DISCOVER — Explore new technologies, ideas, and opportunities.\n\n" +
  "CONNECT — Build relationships with peers, experts, and communities.\n\n" +
  "CONTRIBUTE — Share knowledge, mentor others, and participate in discussions.\n\n" +
  "INSPIRE — Help others see what is possible and leave the community stronger than you found it.";

const CHAMPION_PATH_ZH =
  "作为 Champion，您的路径是发现、连接、贡献与启发。参加提升专业能力的会议，结识能从您经验中受益的人，分享实用知识，并帮助他人带着更多信心和清晰度离开活动。\n\n" +
  "Champion 旅程：\n\n" +
  "DISCOVER — 探索新技术、想法和机会。\n\n" +
  "CONNECT — 与同行、专家和社区建立关系。\n\n" +
  "CONTRIBUTE — 分享知识、指导他人并参与讨论。\n\n" +
  "INSPIRE — 帮助他人看到更多可能，让社区因您而更加强大。";

/** Shared Compass knowledge — available to TechXchange and SKO */
export const COMPASS_KNOWLEDGE: KnowledgeItem[] = [
  {
    intent: "what_is_compass",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "what is compass",
      "what does compass do",
      "why was compass created",
      "how is compass different from the event app",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass is your personalized event companion. Instead of showing everyone the same information, Compass helps you discover the sessions, people, Champions, communities, certifications, and experiences that are most relevant to your goals. The more you share about your interests and intent, the better Compass can guide your journey.",
      "zh-CN":
        "Compass 是您的个性化活动伴侣。Compass 不会向所有人展示相同的信息，而是帮助您发现与目标最相关的会议、人物、Champions、社区、认证和体验。您分享的兴趣和意图越多，Compass 就越能更好地引导您的旅程。",
    },
  },
  {
    intent: "why_use_compass",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "why should i use compass",
      "what is the benefit of compass",
      "why is compass useful",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Large events can be overwhelming. Compass helps reduce the noise by recommending what matters most to you. It helps you learn faster, meet the right people, discover valuable opportunities, and get more value from your event experience.",
      "zh-CN":
        "大型活动可能令人应接不暇。Compass 通过推荐对您最重要的事项来减少信息噪音，帮助您更快学习、结识合适的人、发现宝贵机会，并从活动中获得更多价值。",
    },
  },
  {
    intent: "how_to_maximize_event",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do i get the most out of techxchange",
      "how do i maximize my event experience",
      "what should i do first at the event",
      "how do i succeed at this event",
      "how do i get the most out of the event",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Start with your goals. Tell Compass what you want to learn, who you want to meet, and what outcomes matter most. Then balance your experience across learning, community, and fun. The best event experiences come from a mix of sessions, conversations, hands-on activities, and unexpected discoveries.",
      "zh-CN":
        "从您的目标开始。告诉 Compass 您想学习什么、想认识谁以及最重要的成果是什么。然后在学习、社区和乐趣之间平衡您的体验。最好的活动体验来自会议、对话、动手活动和意外发现的有效组合。",
    },
  },
  {
    intent: "cert_prep_with_compass",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do i prepare for my certification",
      "how can compass help me prepare for my test",
      "help me study for certification",
      "how do i get ready for my exam",
      "how do i prepare for my test",
      "what should i do before certification",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass can help you build a certification learning path. Start by identifying your certification goal, then explore related sessions, labs, workshops, and experts. You can also connect with Champions and attendees who have experience in the same technology area.",
      "zh-CN":
        "Compass 可以帮助您建立认证学习路径。首先明确您的认证目标，然后探索相关会议、实验、工作坊和专家。您还可以与在同一技术领域有经验的 Champions 和与会者建立联系。",
    },
  },
  {
    intent: "champion_playful",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "will there be superheroes",
      "are there superheroes at the event",
      "are there superheroes at techxchange",
      "can i meet a superhero",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Not superheroes exactly, but we do have Champions. IBM Champions are community leaders who share knowledge, help others learn, and contribute to the growth of the technical community. If you meet a Champion, say hello, thank them for their contributions, and ask what sessions or communities they recommend.",
      "zh-CN":
        "不完全是超级英雄——但我们有 Champions。IBM Champions 是社区领袖，分享知识、帮助他人学习，并促进技术社区的成长。如果您遇到 Champion，请向他们问好，感谢他们的贡献，并询问他们推荐哪些会议或社区。",
    },
  },
  {
    intent: "champion_path",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "what can a champion do",
      "i am a champion what should i do",
      "i'm a champion what should i do",
      "how can champions help",
      "champion path",
    ],
    experience: "shared",
    response: {
      "en-US": CHAMPION_PATH_EN,
      "zh-CN": CHAMPION_PATH_ZH,
    },
  },
  {
    intent: "champion_match",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "is there a champion you recommend",
      "champion you recommend for me to meet",
      "who should i meet today",
      "can i meet a champion",
      "recommend a champion",
      "who is a good champion",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Champions are among the best people to meet because they bring real-world experience, community energy, and practical knowledge. Compass can recommend Champions based on your interests, products, role, and goals.",
      "zh-CN":
        "Champions 是最值得结识的人之一——他们带来实战经验、社区活力和实用知识。Compass 可以根据您的兴趣、产品、角色和目标推荐 Champions。",
    },
  },
  {
    intent: "fun_recommendation",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "is there something fun i can do",
      "anything fun happening",
      "what is a social thing i can try",
      "what should i do besides sessions",
      "something fun i can try today",
      "what can i do that is social",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Look for community meetups, networking opportunities, social events, Sandbox experiences, and informal gatherings. Compass can help balance learning, community, and fun throughout your event journey.",
      "zh-CN":
        "您可以关注社区聚会、社交机会、社交活动、Sandbox 体验和非正式聚会。Compass 可以帮助您在活动旅程中平衡学习、社区和乐趣。",
    },
  },
  {
    intent: "setup_huddle",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do i start a huddle",
      "can i create a meetup",
      "how do i gather people around a topic",
      "start a huddle",
    ],
    experience: "shared",
    response: {
      "en-US":
        "A huddle is a great way to connect people around a shared technology, industry, challenge, or interest. Use Compass to identify attendees with similar goals and invite them into a focused conversation.",
      "zh-CN":
        "Huddle 是将具有共同技术、行业、挑战或兴趣的人连接起来的好方法。使用 Compass 识别目标相似的与会者，并邀请他们参与聚焦对话。",
    },
  },
  {
    intent: "find_alumni",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do i find alumni",
      "can i connect with people from my university",
      "who attended my school",
      "find alumni",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass can help identify attendees who share educational, community, geographic, or professional connections when that information is available and consented.",
      "zh-CN":
        "在信息可用且经同意的情况下，Compass 可以帮助识别在教育、社区、地理或职业方面有共同联系的与会者。",
    },
  },
  {
    intent: "edit_intent",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "my intent is wrong",
      "how do i edit my intent",
      "how do i change my interests",
      "how do i update my profile",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass recommendations are driven by your goals, interests, technologies, and networking preferences. You can update your intent profile at any time to improve recommendation quality.",
      "zh-CN":
        "Compass 的推荐由您的目标、兴趣、技术和社交偏好驱动。您可以随时更新意图配置文件以提高推荐质量。",
    },
  },
  {
    intent: "add_more_intent",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do i add more interests",
      "how do i improve recommendations",
      "can i add more goals",
    ],
    experience: "shared",
    response: {
      "en-US":
        "The more information you provide, the more personalized Compass becomes. Consider adding technologies, products, industries, certifications, communities, and networking interests.",
      "zh-CN":
        "您提供的信息越多，Compass 就越个性化。考虑添加技术、产品、行业、认证、社区和社交兴趣。",
    },
  },
  {
    intent: "repeated_recommendations",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "why do i keep seeing the same people",
      "why do i keep getting the same recommendations",
      "why are recommendations repeating",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass prioritizes recommendations that strongly align with your goals. To diversify suggestions, add new interests, explore additional communities, attend recommended experiences, or update your intent profile.",
      "zh-CN":
        "Compass 优先推荐与您目标高度一致的内容。要多样化建议，请添加新兴趣、探索更多社区、参加推荐的体验或更新您的意图配置文件。",
    },
  },
  {
    intent: "data_security",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "is my data secure",
      "is compass private",
      "what information do you store",
      "how is my data used",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass uses profile information, preferences, and event activity to personalize recommendations. Information is handled according to event privacy guidelines and consent settings. Recommendations are based only on information you choose to share.",
      "zh-CN":
        "Compass 使用配置文件信息、偏好和活动数据来个性化推荐。信息处理遵循活动隐私指南和同意设置。推荐仅基于您选择分享的信息。",
    },
  },
  {
    intent: "partner_guidance",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "i am a partner what should i not miss",
      "what should partners attend",
      "what should i do as a partner",
      "i am a partner",
      "i'm a partner",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Partners should make the most of Partner Day, networking opportunities, solution showcases, technical sessions, and conversations with IBM experts, clients, and communities. Compass can help identify the most relevant experiences based on your business goals and technology interests.",
      "zh-CN":
        "合作伙伴应充分利用 Partner Day、社交机会、解决方案展示、技术会议，以及与 IBM 专家、客户和社区的对话。Compass 可以根据您的业务目标和技术兴趣识别最相关的体验。",
    },
  },
  {
    intent: "meals",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "when is breakfast",
      "where is breakfast",
      "when is lunch",
      "where is lunch",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass can provide meal information when event logistics are available. Check your agenda, event communications, or venue information for the latest details.",
      "zh-CN":
        "在活动后勤信息可用时，Compass 可以提供用餐信息。请查看您的议程、活动通知或场馆信息以获取最新详情。",
    },
  },
  {
    intent: "out_of_scope_location",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "where do i buy groceries",
      "where is a grocery store",
      "where can i buy snacks",
      "where can i buy food",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass focuses on helping you get the most from the event experience through learning, networking, community, and discovery. For local errands and nearby services, please use venue information, hotel resources, or a maps application.",
      "zh-CN":
        "Compass 专注于通过学习、社交、社区和发现帮助您充分利用活动体验。如需处理本地事务或使用附近服务，请查阅场馆信息、酒店资源或地图应用。",
    },
  },
  {
    intent: "how_recommendations_work",
    category: COMPASS_KNOWLEDGE_CATEGORY,
    adminEditable: true,
    examples: [
      "how do recommendations work",
      "why am i seeing this recommendation",
      "why am i seeing this",
      "how does compass recommend",
    ],
    experience: "shared",
    response: {
      "en-US":
        "Compass considers your goals, interests, technologies, role, industry, learning preferences, networking interests, and event activity to recommend the sessions, people, communities, and experiences most relevant to you.",
      "zh-CN":
        "Compass 综合考虑您的目标、兴趣、技术、角色、行业、学习偏好、社交兴趣和活动行为，推荐与您最相关的会议、人物、社区和体验。",
    },
  },
];

export const CHAMPION_PATH_STEPS: ChampionPathStep[] = [
  {
    label: "DISCOVER",
    copy: {
      "en-US": "Explore new technologies, ideas, and opportunities.",
      "zh-CN": "探索新技术、想法和机会。",
    },
  },
  {
    label: "CONNECT",
    copy: {
      "en-US": "Build relationships with peers, experts, and communities.",
      "zh-CN": "与同行、专家和社区建立关系。",
    },
  },
  {
    label: "CONTRIBUTE",
    copy: {
      "en-US": "Share knowledge, mentor others, and participate in discussions.",
      "zh-CN": "分享知识、指导他人并参与讨论。",
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
