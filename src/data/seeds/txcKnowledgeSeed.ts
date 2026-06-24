// TechXchange event FAQ knowledge — initialization seed only
// Run: npm run seed:txc-knowledge

export interface TxcKnowledgeRecord {
  knowledge_id: string;
  category: string;
  question: string;
  short_answer: string;
  redirect_type: string;
  source_url: string;
  intent_tags: string[];
  priority: number;
  is_active: boolean;
  contact_email?: string;
}

export interface TxcKnowledgeCategory {
  category_id: string;
  label: string;
  purpose: string;
  display_order: number;
}

export const txcKnowledgeSeed: TxcKnowledgeRecord[] = [
{
knowledge_id: "event-what-is-techxchange",
category: "event_overview",
question: "What is the IBM TechXchange conference?",
short_answer:
"IBM TechXchange 2026 is IBM's hands-on technical conference for developers, engineers, architects, data experts, AI specialists, security professionals, and infrastructure teams. It focuses on labs, workshops, certifications, product experts, roadmaps, and technical community connection.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["about_event", "event_overview", "why_attend"],
priority: 100,
is_active: true
},
{
knowledge_id: "event-when",
category: "event_overview",
question: "When is IBM TechXchange 2026?",
short_answer: "IBM TechXchange 2026 takes place October 26–29, 2026.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["dates", "event_schedule"],
priority: 100,
is_active: true
},
{
knowledge_id: "event-where",
category: "event_overview",
question: "Where is IBM TechXchange 2026?",
short_answer:
"IBM TechXchange 2026 is in Atlanta, Georgia at the Georgia World Congress Center.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["location", "venue", "atlanta"],
priority: 100,
is_active: true
},
{
knowledge_id: "event-who-should-attend",
category: "event_overview",
question: "Who should attend?",
short_answer:
"TechXchange is designed for developers, software engineers, system programmers, data experts, AI specialists, infrastructure architects, operations professionals, cybersecurity experts, and technical community leaders.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["audience", "who_should_attend", "roles"],
priority: 90,
is_active: true
},

{
knowledge_id: "registration-fee",
category: "registration",
question: "Is there a fee to attend?",
short_answer:
"Yes. IBM TechXchange 2026 is a paid conference. Standard pricing, early-bird pricing, and government/public sector rates are handled through the official registration site.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["registration", "pricing", "cost"],
priority: 90,
is_active: true
},
{
knowledge_id: "registration-government-rate",
category: "registration",
question: "Is there a discounted government or public sector rate?",
short_answer:
"Yes. IBM offers a government/public sector rate for eligible attendees. Eligibility and ID requirements should be verified on the official FAQ or with Guest Services.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["government_rate", "public_sector", "discount"],
priority: 80,
is_active: true
},
{
knowledge_id: "registration-age-limit",
category: "registration",
question: "Is there an age limit?",
short_answer:
"Yes. Attendees must be at least 18 years old by the day they pick up their conference badge.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["age_limit", "registration_policy"],
priority: 70,
is_active: true
},
{
knowledge_id: "registration-cancellation-policy",
category: "registration",
question: "What is the cancellation policy?",
short_answer:
"Cancellation deadlines and refund eligibility are handled by IBM TechXchange Guest Services. For official policy details, use the FAQ or contact ibmtechxchange@gpj.com.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["cancellation", "refund", "registration_help"],
priority: 75,
is_active: true
},
{
knowledge_id: "registration-transfer",
category: "registration",
question: "Can I transfer my registration?",
short_answer:
"Purchased passes may be substituted for someone from the same company if requested through Guest Services by the official deadline. Complimentary passes are not transferable.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["transfer_registration", "substitution", "registration_help"],
priority: 70,
is_active: true
},
{
knowledge_id: "registration-login-not-ibmid",
category: "registration",
question: "Is the TechXchange login the same as my IBMid?",
short_answer:
"No. TechXchange registration uses a separate Event login. Your IBMid username and password will not work on the registration site.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["login_help", "ibmid", "event_login"],
priority: 95,
is_active: true
},
{
knowledge_id: "registration-email",
category: "registration",
question: "What email should I use to register?",
short_answer:
"Use the business email address you want associated with your conference registration.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["registration_email", "business_email"],
priority: 70,
is_active: true
},
{
knowledge_id: "registration-accessibility",
category: "accessibility",
question: "How do I communicate accessibility needs?",
short_answer:
"Add accessibility needs in your registration profile or contact Guest Services directly. IBM recommends doing this two to three weeks before the conference.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["accessibility", "special_needs", "guest_services"],
priority: 85,
is_active: true
},
{
knowledge_id: "registration-group-purchase",
category: "registration",
question: "Are group purchase options available?",
short_answer:
"Yes. Group purchases are available for multiple conference passes, but they do not create additional discounted pricing.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["group_purchase", "registration", "passes"],
priority: 60,
is_active: true
},

{
knowledge_id: "event-code-of-conduct",
category: "onsite_experience",
question: "Is there a code of conduct?",
short_answer:
"Yes. IBM requires a safe, respectful, comfortable, and harassment-free environment at IBM events.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["code_of_conduct", "event_policy", "safety"],
priority: 80,
is_active: true
},
{
knowledge_id: "event-guests",
category: "onsite_experience",
question: "Can guests attend with me?",
short_answer:
"No. Conference access is limited to invited and registered attendees.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["guests", "passes", "event_access"],
priority: 70,
is_active: true
},
{
knowledge_id: "event-attire",
category: "onsite_experience",
question: "What should I wear?",
short_answer:
"The dress code is coder casual: comfortable, polished, and practical for a technical conference. Comfortable shoes are strongly recommended.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["attire", "dress_code", "what_to_wear"],
priority: 75,
is_active: true
},
{
knowledge_id: "event-parking",
category: "travel_logistics",
question: "Is parking available?",
short_answer:
"Parking is not included with the conference pass. Attendees should use the Georgia World Congress Center parking resources for current options.",
redirect_type: "external_site",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["parking", "venue", "transportation"],
priority: 50,
is_active: true
},
{
knowledge_id: "event-shuttle",
category: "travel_logistics",
question: "Will hotel shuttles be provided?",
short_answer:
"No conference hotel shuttle is planned. Attendees can use walking, taxi, rideshare, public transit, or other local transportation.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["shuttle", "hotel_transport", "transportation"],
priority: 55,
is_active: true
},
{
knowledge_id: "event-airport-transport",
category: "travel_logistics",
question: "Will airport transportation be provided?",
short_answer:
"No. Airport transportation is not provided. Attendees should arrange taxi, rideshare, public transit, or private pickup.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["airport", "transportation", "travel"],
priority: 55,
is_active: true
},

{
knowledge_id: "hotel-blocks",
category: "hotel",
question: "Are hotel blocks available?",
short_answer:
"Yes. Registered attendees can access discounted hotel rates through the Attendee Portal when the hotel block is available.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel", "hotel_block", "attendee_portal"],
priority: 75,
is_active: true
},
{
knowledge_id: "hotel-deposit",
category: "hotel",
question: "Will a hotel deposit be charged?",
short_answer:
"Hotel deposit policies vary by hotel. Check the official hotel details in the Attendee Portal or contact Guest Services.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel_deposit", "hotel_policy"],
priority: 55,
is_active: true
},
{
knowledge_id: "hotel-cancellation",
category: "hotel",
question: "What is the hotel cancellation policy?",
short_answer:
"Hotel cancellation policies vary by property and date. Use the official FAQ, Attendee Portal, or Guest Services for the exact policy.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel_cancellation", "hotel_policy"],
priority: 65,
is_active: true
},
{
knowledge_id: "hotel-update-reservation",
category: "hotel",
question: "How can I update or change my hotel reservation?",
short_answer:
"Registered attendees can update hotel reservations through the Attendee Portal or contact IBM TechXchange Guest Services.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel_change", "reservation", "attendee_portal"],
priority: 65,
is_active: true
},
{
knowledge_id: "hotel-confirmation",
category: "hotel",
question: "When will I receive hotel confirmation details?",
short_answer:
"Hotel confirmation timing is handled through the official hotel process. Use the Attendee Portal or Guest Services for exact status.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel_confirmation", "reservation"],
priority: 50,
is_active: true
},
{
knowledge_id: "hotel-one-reservation",
category: "hotel",
question: "Can I book more than one hotel reservation?",
short_answer:
"No. Only one hotel reservation per registered attendee is allowed.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["hotel", "reservation_limit"],
priority: 55,
is_active: true
},

{
knowledge_id: "travel-visa-letter",
category: "travel_logistics",
question: "How do I request a visa invitation letter?",
short_answer:
"Registered IBM clients and Business Partners can request a visa invitation letter through registration or the Attendee Portal. Guest Services can help if needed.",
redirect_type: "guest_services",
contact_email: "ibmtechxchange@gpj.com",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["visa", "invitation_letter", "international_travel"],
priority: 70,
is_active: true
},

{
knowledge_id: "idug-separate-pass",
category: "partner_events",
question: "Do I need a separate pass for IDUG NA?",
short_answer:
"Yes. IDUG NA requires registration directly with IDUG. IDUG registration includes access to IBM TechXchange, but attendees must complete the IBM registration process too.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["idug", "db2", "partner_event", "registration"],
priority: 80,
is_active: true
},
{
knowledge_id: "idug-techxchange-pass",
category: "partner_events",
question: "Does IDUG registration include TechXchange access?",
short_answer:
"Yes. IDUG NA registration includes a complimentary IBM TechXchange pass, but the IBM TechXchange registration process must still be completed.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["idug", "techxchange_access"],
priority: 75,
is_active: true
},
{
knowledge_id: "idug-only-techxchange-pass",
category: "partner_events",
question: "Can I attend IDUG with only an IBM TechXchange pass?",
short_answer:
"No. Most IDUG NA sessions require IDUG registration. Select Db2 sessions may appear in the main TechXchange catalog for all attendees.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["idug", "db2_sessions", "access"],
priority: 70,
is_active: true
},
{
knowledge_id: "idug-champions",
category: "partner_events",
question: "Will IBM Champions get access to IDUG NA?",
short_answer:
"IBM Champions may be eligible for a discount on IDUG registration, but they still need to register directly with IDUG.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["idug", "ibm_champions", "discount"],
priority: 60,
is_active: true
},

{
knowledge_id: "common-separate-pass",
category: "partner_events",
question: "Do I need a separate pass for COMMON?",
short_answer:
"No. A COMMON at IBM TechXchange pass provides access to both COMMON and IBM TechXchange events.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["common", "ibm_i", "partner_event", "access"],
priority: 80,
is_active: true
},
{
knowledge_id: "common-register",
category: "partner_events",
question: "Where do I register for COMMON at IBM TechXchange?",
short_answer:
"You can register directly with IBM or COMMON. Valid IBM TechXchange access includes TechXchange, HashiConf at TechXchange, and COMMON sessions.",
redirect_type: "official_faq",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["common", "registration", "hashiconf"],
priority: 75,
is_active: true
},
{
knowledge_id: "common-techxchange-registration-required",
category: "partner_events",
question: "Do COMMON attendees need IBM TechXchange registration?",
short_answer:
"Yes. COMMON attendees still need to complete IBM TechXchange registration to confirm details and accept IBM terms.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["common", "registration", "terms"],
priority: 70,
is_active: true
},
{
knowledge_id: "common-open-sessions",
category: "partner_events",
question: "Can IBM TechXchange attendees attend COMMON sessions?",
short_answer:
"Yes. COMMON sessions are open to valid IBM TechXchange attendees without separate COMMON registration.",
redirect_type: "answer",
source_url: "https://www.ibm.com/events/techxchange/faq",
intent_tags: ["common", "sessions", "access"],
priority: 70,
is_active: true
}
];

export const txcKnowledgeCategories: TxcKnowledgeCategory[] = [
{
category_id: "event_overview",
label: "Event Overview",
purpose: "Core questions about what TechXchange is, when it happens, where it is, and who it is for.",
display_order: 1
},
{
category_id: "registration",
label: "Registration",
purpose: "Registration, pricing, login, transfer, cancellation, group purchase, and pass-related questions.",
display_order: 2
},
{
category_id: "accessibility",
label: "Accessibility",
purpose: "Accessibility needs and attendee support requests.",
display_order: 3
},
{
category_id: "onsite_experience",
label: "Onsite Experience",
purpose: "Attire, guests, conduct, badge access, and onsite attendee expectations.",
display_order: 4
},
{
category_id: "hotel",
label: "Hotel",
purpose: "Hotel blocks, reservations, deposits, confirmation, changes, and cancellation guidance.",
display_order: 5
},
{
category_id: "travel_logistics",
label: "Travel & Logistics",
purpose: "Parking, airport transport, shuttle, visa letters, and local transportation.",
display_order: 6
},
{
category_id: "partner_events",
label: "Co-located Events",
purpose: "IDUG NA, COMMON, HashiConf, and related registration/access questions.",
display_order: 7
}
];