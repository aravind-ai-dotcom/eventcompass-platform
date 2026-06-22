import type { TxcKnowledgeRecord } from "@/data/seeds/txcKnowledgeSeed";
import type {
  VoiceIntentCategory,
  VoiceKnowledgeCategory,
  VoiceKnowledgeRecord,
  VoiceKnowledgeRedirectType,
} from "@/types/voiceKnowledge";

const FAQ_CATEGORY_TO_INTENT: Record<string, VoiceIntentCategory> = {
  event_overview: "EVENT_OVERVIEW",
  registration: "REGISTRATION_HELP",
  accessibility: "ACCESSIBILITY_HELP",
  onsite_experience: "ONSITE_EXPERIENCE",
  hotel: "HOTEL_HELP",
  travel_logistics: "TRAVEL_HELP",
  partner_events: "PARTNER_EVENT_HELP",
};

const UTTERANCE_OVERRIDES: Record<string, string[]> = {
  "event-what-is-techxchange": [
    "What is TechXchange?",
    "Tell me about IBM TechXchange",
    "What is this conference about?",
    "Why should I attend TechXchange?",
    "Describe TechXchange for me",
  ],
  "event-when": [
    "When is TechXchange 2026?",
    "What dates is the conference?",
    "When does TechXchange start?",
    "What are the event dates?",
  ],
  "event-where": [
    "Where is TechXchange?",
    "Where is the conference located?",
    "What city is TechXchange in?",
    "Where is the venue?",
  ],
  "event-who-should-attend": [
    "Who should attend TechXchange?",
    "Who is this event for?",
    "Is TechXchange for developers?",
    "What roles should come to TechXchange?",
  ],
  "registration-fee": [
    "Is TechXchange free?",
    "How much does registration cost?",
    "Is there a fee to attend?",
    "What is the conference price?",
  ],
  "registration-government-rate": [
    "Is there a government discount?",
    "Public sector registration rate",
    "Do government employees get a discount?",
  ],
  "registration-age-limit": [
    "Is there an age limit?",
    "Can minors attend TechXchange?",
    "How old do I need to be to attend?",
  ],
  "registration-cancellation-policy": [
    "What is the cancellation policy?",
    "Can I get a refund?",
    "How do I cancel my registration?",
  ],
  "registration-transfer": [
    "Can I transfer my registration?",
    "Can someone else use my pass?",
    "How do I substitute my registration?",
  ],
  "registration-login-not-ibmid": [
    "Is my TechXchange login the same as my IBM ID?",
    "Can I use my IBMid to register?",
    "Why is my IBM password not working?",
    "I can't log into TechXchange registration",
    "Do I need a separate event login?",
  ],
  "registration-email": [
    "What email should I use to register?",
    "Can I use a personal email?",
    "Which email for registration?",
  ],
  "registration-accessibility": [
    "How do I request accessibility accommodations?",
    "I have accessibility needs",
    "How do I communicate accessibility needs?",
    "Special accommodations at TechXchange",
  ],
  "registration-group-purchase": [
    "Can I buy group passes?",
    "Group registration options",
    "Are group purchases available?",
  ],
  "event-code-of-conduct": [
    "Is there a code of conduct?",
    "What are the event conduct rules?",
    "Harassment policy at TechXchange",
  ],
  "event-guests": [
    "Can I bring a guest?",
    "Can my spouse attend with me?",
    "Are plus ones allowed?",
  ],
  "event-attire": [
    "What should I wear?",
    "Dress code for TechXchange",
    "What is coder casual?",
  ],
  "event-parking": [
    "Is parking available?",
    "Where can I park at the venue?",
    "Is parking included?",
  ],
  "event-shuttle": [
    "Is there a hotel shuttle?",
    "Will shuttles run between hotels?",
    "Transportation from my hotel",
  ],
  "event-airport-transport": [
    "Is airport transportation provided?",
    "Shuttle from the airport?",
    "How do I get from the airport?",
  ],
  "hotel-blocks": [
    "Are hotel blocks available?",
    "How do I book the conference hotel?",
    "Discounted hotel rates",
  ],
  "hotel-deposit": [
    "Will the hotel charge a deposit?",
    "Hotel deposit policy",
    "Do I need to pay a hotel deposit?",
  ],
  "hotel-cancellation": [
    "What is the hotel cancellation policy?",
    "Can I cancel my hotel reservation?",
    "Hotel refund policy",
  ],
  "hotel-update-reservation": [
    "How do I change my hotel reservation?",
    "Update hotel booking",
    "Modify my hotel stay",
  ],
  "hotel-confirmation": [
    "When will I get hotel confirmation?",
    "Hotel confirmation email timing",
    "Has my hotel booking been confirmed?",
  ],
  "hotel-one-reservation": [
    "Can I book two hotel rooms?",
    "More than one hotel reservation",
    "Multiple hotel bookings allowed?",
  ],
  "travel-visa-letter": [
    "How do I get a visa invitation letter?",
    "Visa letter for TechXchange",
    "Invitation letter for international travel",
  ],
  "idug-separate-pass": [
    "Do I need a separate pass for IDUG?",
    "IDUG registration requirements",
    "How do I register for IDUG NA?",
  ],
  "idug-techxchange-pass": [
    "Does IDUG include TechXchange access?",
    "IDUG pass and TechXchange",
    "Is TechXchange included with IDUG?",
  ],
  "idug-only-techxchange-pass": [
    "Can I attend IDUG with only a TechXchange pass?",
    "TechXchange pass for IDUG sessions",
    "Do I need IDUG registration for Db2 sessions?",
  ],
  "idug-champions": [
    "Do IBM Champions get IDUG access?",
    "Champion discount for IDUG",
    "IDUG registration for Champions",
  ],
  "common-separate-pass": [
    "Do I need a separate COMMON pass?",
    "COMMON at TechXchange access",
    "Is COMMON included?",
  ],
  "common-register": [
    "Where do I register for COMMON?",
    "COMMON registration at TechXchange",
    "How do I sign up for COMMON sessions?",
  ],
  "common-techxchange-registration-required": [
    "Do COMMON attendees need TechXchange registration?",
    "COMMON registration requirements",
    "Must COMMON attendees register with IBM?",
  ],
  "common-open-sessions": [
    "Can TechXchange attendees go to COMMON sessions?",
    "Are COMMON sessions open to everyone?",
    "Access COMMON without separate registration",
  ],
};

function toIntentId(knowledgeId: string): string {
  return knowledgeId.replace(/-/g, "_").toUpperCase();
}

function compactForVoice(text: string): string {
  const trimmed = text.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return trimmed;
  return sentences.slice(0, 2).join(" ").trim();
}

export function buildFaqVoiceResponse(
  shortAnswer: string,
  redirectType: VoiceKnowledgeRedirectType,
): string {
  const base = compactForVoice(shortAnswer);
  switch (redirectType) {
    case "official_faq":
      return `${base} Check the official TechXchange FAQ for full details.`;
    case "guest_services":
      return `${base} Guest Services can help with the details.`;
    case "external_site":
      return base;
    default:
      return base;
  }
}

function generateSampleUtterances(faq: TxcKnowledgeRecord): string[] {
  const phrases = new Set<string>();
  const override = UTTERANCE_OVERRIDES[faq.knowledge_id];
  if (override) {
    for (const phrase of override) phrases.add(phrase);
  }

  phrases.add(faq.question.trim());
  const q = faq.question.replace(/\?+$/, "").trim();
  phrases.add(`Tell me ${q.charAt(0).toLowerCase()}${q.slice(1)}`);
  phrases.add(`What about ${q.charAt(0).toLowerCase()}${q.slice(1)}?`);

  for (const tag of faq.intent_tags.slice(0, 3)) {
    phrases.add(tag.replace(/_/g, " "));
  }

  return [...phrases].filter(Boolean).slice(0, 6);
}

export function faqCategoryToIntentCategory(categoryId: string): VoiceIntentCategory {
  return FAQ_CATEGORY_TO_INTENT[categoryId] ?? "EVENT_OVERVIEW";
}

export function faqToVoiceKnowledgeRecord(
  faq: TxcKnowledgeRecord,
  updatedAt = new Date().toISOString(),
): VoiceKnowledgeRecord {
  const redirectType = faq.redirect_type as VoiceKnowledgeRedirectType;
  const intentCategory = faqCategoryToIntentCategory(faq.category);
  const voiceCategory: VoiceKnowledgeCategory =
    intentCategory === "CERTIFICATION_HELP" ? "Certifications" : "Event Knowledge";

  return {
    id: faq.knowledge_id,
    category: voiceCategory,
    title: faq.question,
    trigger_phrases: generateSampleUtterances(faq),
    response: buildFaqVoiceResponse(faq.short_answer, redirectType),
    display_response: faq.short_answer,
    enabled: faq.is_active,
    topic_key: faq.category,
    intent: toIntentId(faq.knowledge_id),
    intent_category: intentCategory,
    faq_category_id: faq.category,
    redirect_type: redirectType,
    source_url: faq.source_url,
    contact_email: faq.contact_email,
    tags: faq.intent_tags,
    priority: faq.priority,
    source: "official_txc_faq",
    updated_by: "faq_migration",
    updated_at: updatedAt,
  };
}

export function faqRecordsToVoiceKnowledge(
  faqs: TxcKnowledgeRecord[],
): VoiceKnowledgeRecord[] {
  const now = new Date().toISOString();
  return faqs.map(faq => faqToVoiceKnowledgeRecord(faq, now));
}
