// =============================================================================
// TechXchange governance seed — initialization only (not runtime source of truth)
// Run: node scripts/seed-txc-compass-governance-admin.cjs
// =============================================================================

import type {
  SttNormalizationRecord,
  TechXchangeKnowledgeRecord,
  VoiceDictionaryRecord,
} from "@/types/compassGovernance";

const NOW = new Date().toISOString();

function kb(
  partial: Omit<TechXchangeKnowledgeRecord, "createdAt" | "updatedAt" | "experience" | "language">,
): TechXchangeKnowledgeRecord {
  return {
    ...partial,
    experience: "techxchange",
    language: "en-US",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const TXC_KNOWLEDGE_SEED: TechXchangeKnowledgeRecord[] = [
  kb({
    id: "kb-what-is-compass",
    intent: "WHAT_IS_COMPASS",
    category: "Compass",
    examples: ["what is compass", "what does compass do", "why was compass created", "how is compass different from the event app"],
    response:
      "Compass is your personalized event companion. Instead of showing everyone the same information, Compass helps you discover the sessions, people, Champions, communities, certifications, and experiences that are most relevant to your goals. The more you share about your interests and intent, the better Compass can guide your journey.",
    active: true,
    status: "active",
    priority: 100,
    tags: ["compass", "overview"],
  }),
  kb({
    id: "kb-why-use-compass",
    intent: "WHY_USE_COMPASS",
    category: "Compass",
    examples: ["why should i use compass", "what is the benefit of compass", "why is compass useful"],
    response:
      "Large events can be overwhelming. Compass helps reduce the noise by recommending what matters most to you. It helps you learn faster, meet the right people, discover valuable opportunities, and get more value from your event experience.",
    active: true,
    status: "active",
    priority: 95,
    tags: ["compass", "benefits"],
  }),
  kb({
    id: "kb-maximize-event",
    intent: "HOW_TO_GET_THE_MOST_OUT_OF_THE_EVENT",
    category: "Compass",
    examples: [
      "how do i get the most out of techxchange",
      "how do i maximize my event experience",
      "what should i do first",
      "how do i succeed at this event",
    ],
    response:
      "Start with your goals. Tell Compass what you want to learn, who you want to meet, and what outcomes matter most. Then balance your experience across learning, community, and fun. The best event experiences come from a mix of sessions, conversations, hands-on activities, and unexpected discoveries.",
    active: true,
    status: "active",
    priority: 90,
    tags: ["compass", "planning"],
  }),
  kb({
    id: "kb-cert-prep",
    intent: "CERT_PREP_WITH_COMPASS",
    category: "Certification",
    examples: [
      "how do i prepare for my certification",
      "how can compass help me prepare for my test",
      "help me study for certification",
      "how do i get ready for my exam",
    ],
    response:
      "Compass can help you build a certification learning path. Start by identifying your certification goal, then explore related sessions, labs, workshops, and experts. You can also connect with Champions and attendees who have experience in the same technology area.",
    active: true,
    status: "active",
    priority: 88,
    tags: ["certification", "learning"],
  }),
  kb({
    id: "kb-champion-match",
    intent: "CHAMPION_MATCH",
    category: "Champion",
    examples: [
      "is there a champion you recommend",
      "who should i meet today",
      "can i meet a champion",
      "recommend a champion",
    ],
    response:
      "Champions are among the best people to meet because they bring real-world experience, community energy, and practical knowledge. Compass can recommend Champions based on your interests, products, role, and goals.",
    active: true,
    status: "active",
    priority: 85,
    tags: ["champion", "networking"],
  }),
  kb({
    id: "kb-champion-path",
    intent: "CHAMPION_PATH",
    category: "Champion",
    examples: [
      "what can a champion do",
      "i am a champion what should i do",
      "how can champions help",
    ],
    response:
      "As a Champion, your path is to Discover, Connect, Contribute, and Inspire. Attend the sessions that strengthen your expertise, meet people who can benefit from your experience, share practical knowledge, and help others leave the event with greater confidence and clarity.\n\nChampion Journey:\n\nDISCOVER — Explore new technologies, ideas, and opportunities.\n\nCONNECT — Build relationships with peers, experts, and communities.\n\nCONTRIBUTE — Share knowledge, mentor others, and participate in discussions.\n\nINSPIRE — Help others see what is possible and leave the community stronger than you found it.",
    active: true,
    status: "active",
    priority: 84,
    tags: ["champion", "journey"],
  }),
  kb({
    id: "kb-fun",
    intent: "FUN_RECOMMENDATION",
    category: "Fun",
    examples: [
      "is there something fun i can do",
      "anything fun happening",
      "what is a social thing i can try",
      "what should i do besides sessions",
    ],
    response:
      "Look for community meetups, networking opportunities, social events, Sandbox experiences, and informal gatherings. Compass can help balance learning, community, and fun throughout your event journey.",
    active: true,
    status: "active",
    priority: 80,
    tags: ["fun", "social"],
  }),
  kb({
    id: "kb-huddle",
    intent: "SETUP_HUDDLE",
    category: "Networking",
    examples: ["how do i start a huddle", "can i create a meetup", "how do i gather people around a topic"],
    response:
      "A huddle is a great way to connect people around a shared technology, industry, challenge, or interest. Use Compass to identify attendees with similar goals and invite them into a focused conversation.",
    active: true,
    status: "active",
    priority: 78,
    tags: ["networking", "huddle"],
  }),
  kb({
    id: "kb-alumni",
    intent: "FIND_ALUMNI",
    category: "Networking",
    examples: ["how do i find alumni", "can i connect with people from my university", "who attended my school"],
    response:
      "Compass can help identify attendees who share educational, community, geographic, or professional connections when that information is available and consented.",
    active: true,
    status: "active",
    priority: 76,
    tags: ["networking", "alumni"],
  }),
  kb({
    id: "kb-edit-intent",
    intent: "EDIT_INTENT",
    category: "Compass",
    examples: ["my intent is wrong", "how do i edit my intent", "how do i change my interests", "how do i update my profile"],
    response:
      "Compass recommendations are driven by your goals, interests, technologies, and networking preferences. You can update your intent profile at any time to improve recommendation quality.",
    active: true,
    status: "active",
    priority: 74,
    tags: ["compass", "profile"],
  }),
  kb({
    id: "kb-add-intent",
    intent: "ADD_MORE_INTENT",
    category: "Compass",
    examples: ["how do i add more interests", "how do i improve recommendations", "can i add more goals"],
    response:
      "The more information you provide, the more personalized Compass becomes. Consider adding technologies, products, industries, certifications, communities, and networking interests.",
    active: true,
    status: "active",
    priority: 72,
    tags: ["compass", "profile"],
  }),
  kb({
    id: "kb-repeated-recs",
    intent: "REPEATED_RECOMMENDATIONS",
    category: "Compass",
    examples: [
      "why do i keep seeing the same people",
      "why do i keep getting the same recommendations",
      "why are recommendations repeating",
    ],
    response:
      "Compass prioritizes recommendations that strongly align with your goals. To diversify suggestions, add new interests, explore additional communities, attend recommended experiences, or update your intent profile.",
    active: true,
    status: "active",
    priority: 70,
    tags: ["compass", "recommendations"],
  }),
  kb({
    id: "kb-data-security",
    intent: "DATA_SECURITY",
    category: "Privacy",
    examples: ["is my data secure", "is compass private", "what information do you store", "how is my data used"],
    response:
      "Compass uses profile information, preferences, and event activity to personalize recommendations. Information is handled according to event privacy guidelines and consent settings. Recommendations are based only on information you choose to share.",
    active: true,
    status: "active",
    priority: 68,
    tags: ["privacy", "security"],
  }),
  kb({
    id: "kb-partner",
    intent: "PARTNER_GUIDANCE",
    category: "Partner",
    examples: ["i am a partner", "what should i not miss", "what should partners attend", "what should i do as a partner"],
    response:
      "Partners should make the most of Partner Day, networking opportunities, solution showcases, technical sessions, and conversations with IBM experts, clients, and communities. Compass can help identify the most relevant experiences based on your business goals and technology interests.",
    active: true,
    status: "active",
    priority: 66,
    tags: ["partner"],
  }),
  kb({
    id: "kb-breakfast",
    intent: "BREAKFAST",
    category: "Event Logistics",
    examples: ["when is breakfast", "where is breakfast"],
    response:
      "Compass can provide meal information when event logistics are available. Check your agenda, event communications, or venue information for the latest details.",
    active: true,
    status: "active",
    priority: 50,
    tags: ["meals", "logistics"],
  }),
  kb({
    id: "kb-lunch",
    intent: "LUNCH",
    category: "Event Logistics",
    examples: ["when is lunch", "where is lunch"],
    response:
      "Compass can provide meal information when event logistics are available. Check your agenda, event communications, or venue information for the latest details.",
    active: true,
    status: "active",
    priority: 49,
    tags: ["meals", "logistics"],
  }),
  kb({
    id: "kb-superheroes",
    intent: "SUPERHEROES",
    category: "Champion",
    examples: ["will there be superheroes", "are there superheroes at the event", "can i meet a superhero"],
    response:
      "Not superheroes exactly, but we do have Champions. IBM Champions are community leaders who share knowledge, help others learn, and contribute to the growth of the technical community. If you meet a Champion, say hello, thank them for their contributions, and ask what sessions or communities they recommend.",
    active: true,
    status: "active",
    priority: 64,
    tags: ["champion", "fun"],
  }),
  kb({
    id: "kb-out-of-scope",
    intent: "OUT_OF_SCOPE_LOCATION",
    category: "Fallback",
    examples: ["where do i buy groceries", "where is a grocery store", "where can i buy snacks"],
    response:
      "Compass focuses on helping you get the most from the event experience through learning, networking, community, and discovery. For local errands and nearby services, please use venue information, hotel resources, or a maps application.",
    active: true,
    status: "active",
    priority: 40,
    tags: ["fallback", "location"],
  }),
  kb({
    id: "kb-how-recs",
    intent: "HOW_RECOMMENDATIONS_WORK",
    category: "Compass",
    examples: ["why was this recommended", "why am i seeing this", "how do recommendations work"],
    response:
      "Compass considers your goals, interests, technologies, role, industry, learning preferences, networking interests, and event activity to recommend the sessions, people, communities, and experiences most relevant to you.",
    active: true,
    status: "active",
    priority: 82,
    tags: ["compass", "recommendations"],
  }),
];

function voice(
  partial: Omit<VoiceDictionaryRecord, "createdAt" | "updatedAt" | "experience" | "language">,
): VoiceDictionaryRecord {
  return {
    ...partial,
    experience: "techxchange",
    language: "en-US",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const TXC_VOICE_DICTIONARY_SEED: VoiceDictionaryRecord[] = [
  voice({ id: "vd-techxchange", displayText: "TechXchange", spokenText: "Tech Exchange", active: true, notes: "Event name" }),
  voice({ id: "vd-ai", displayText: "AI", spokenText: "A Eye", active: true }),
  voice({ id: "vd-ai-agents", displayText: "AI Agents", spokenText: "A Eye agents", active: true }),
  voice({ id: "vd-watsonx", displayText: "watsonx", spokenText: "Watson Ex", active: true }),
  voice({ id: "vd-qiskit", displayText: "Qiskit", spokenText: "Kiss kit", active: true }),
  voice({ id: "vd-openshift", displayText: "Red Hat OpenShift", spokenText: "Red Hat Open Shift", active: true }),
  voice({ id: "vd-ibm-z", displayText: "IBM Z", spokenText: "I B M Z", active: true }),
  voice({ id: "vd-linuxone", displayText: "LinuxONE", spokenText: "Linux One", active: true }),
];

function stt(
  partial: Omit<SttNormalizationRecord, "createdAt" | "updatedAt" | "experience" | "language">,
): SttNormalizationRecord {
  return {
    ...partial,
    experience: "techxchange",
    language: "en-US",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const TXC_STT_NORMALIZATION_SEED: SttNormalizationRecord[] = [
  stt({
    id: "stt-techxchange",
    canonicalText: "TechXchange",
    heardAs: ["Tech Exchange", "tech exchange", "tech change", "text change"],
    active: true,
    notes: "Event name STT variants",
  }),
  stt({
    id: "stt-watsonx",
    canonicalText: "watsonx",
    heardAs: ["Watson X", "Watson Ex", "Watson acts", "Watson axe"],
    active: true,
  }),
  stt({
    id: "stt-qiskit",
    canonicalText: "Qiskit",
    heardAs: ["Kiss kit", "Q kit", "quiz kit"],
    active: true,
  }),
];
