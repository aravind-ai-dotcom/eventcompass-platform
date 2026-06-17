// SKO product seed — initialization only (force-add: git add -f)
import type {
  SkoBrief,
  SkoContentAsset,
  SkoContentClip,
  SkoContentItem,
  SkoEdition,
  SkoGeo,
  SkoIngestJob,
  SkoMarket,
  SkoPodcast,
  SkoPulseMetrics,
  SkoPulseQuote,
  SkoSellerPersona,
  SkoSpeaker,
  SkoUserProfile,
} from "@/types/sko";
import { SKO_EDITION_ID } from "@/types/sko";
import { SKO_SPEAKER_PORTRAITS as P } from "@/lib/skoSpeakerPortraits";

export const SKO_EDITION: SkoEdition = {
  id: SKO_EDITION_ID,
  label: "Edition: SKO2H 2026",
  theme: "AI Creates Advantage",
  headline: "Turning organizational strategy into seller action.",
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  active: true,
};

export const SKO_GEOS: SkoGeo[] = [
  { id: "geo-emea", editionId: SKO_EDITION_ID, name: "EMEA", date: "2026-07-07", deliveryType: "Live", cityLabel: "Madrid", status: "completed", imageUrl: "/geo/madrid.png" },
  { id: "geo-apac", editionId: SKO_EDITION_ID, name: "APAC", date: "2026-07-13", deliveryType: "Live", cityLabel: "Singapore", status: "upcoming", imageUrl: "/geo/singapore-marina-bay.png" },
  { id: "geo-americas", editionId: SKO_EDITION_ID, name: "Americas", date: "2026-07-27", deliveryType: "Virtual", cityLabel: "Virtual studio", status: "upcoming", imageUrl: "/geo/americas-virtual.png" },
  { id: "geo-japan", editionId: SKO_EDITION_ID, name: "Japan", date: "2026-07-30", deliveryType: "Live", cityLabel: "Tokyo", status: "upcoming", imageUrl: "/geo/tokyo-tower-day.png" },
];

export const SKO_MARKETS: SkoMarket[] = [
  { id: "m-uki", geoId: "EMEA", label: "UKI", name: "United Kingdom & Ireland", sortOrder: 1, active: true },
  { id: "m-dach", geoId: "EMEA", label: "DACH", name: "Germany, Austria, Switzerland", sortOrder: 2, active: true },
  { id: "m-france", geoId: "EMEA", label: "France", name: "France", sortOrder: 3, active: true },
  { id: "m-italy", geoId: "EMEA", label: "Italy", name: "Italy", sortOrder: 4, active: true },
  { id: "m-spain", geoId: "EMEA", label: "Spain", name: "Spain", sortOrder: 5, active: true },
  { id: "m-mea", geoId: "EMEA", label: "MEA", name: "Middle East & Africa", sortOrder: 6, active: true },
  { id: "m-uae", geoId: "EMEA", label: "UAE", name: "United Arab Emirates", sortOrder: 7, active: true },
  { id: "m-saudi", geoId: "EMEA", label: "Saudi Arabia", name: "Saudi Arabia", sortOrder: 8, active: true },
  { id: "m-isa", geoId: "APAC", label: "ISA", name: "India & South Asia", sortOrder: 1, active: true },
  { id: "m-anz", geoId: "APAC", label: "ANZ", name: "Australia & New Zealand", sortOrder: 2, active: true },
  { id: "m-asean", geoId: "APAC", label: "ASEAN", name: "ASEAN", sortOrder: 3, active: true },
  { id: "m-gcg", geoId: "APAC", label: "GCG", name: "Greater China Group", sortOrder: 4, active: true },
  { id: "m-hk", geoId: "APAC", label: "HK", name: "Hong Kong", sortOrder: 5, active: true },
  { id: "m-sg", geoId: "APAC", label: "Singapore", name: "Singapore", sortOrder: 6, active: true },
  { id: "m-my", geoId: "APAC", label: "Malaysia", name: "Malaysia", sortOrder: 7, active: true },
  { id: "m-id", geoId: "APAC", label: "Indonesia", name: "Indonesia", sortOrder: 8, active: true },
  { id: "m-vn", geoId: "APAC", label: "Vietnam", name: "Vietnam", sortOrder: 9, active: true },
  { id: "m-usa", geoId: "Americas", label: "USA", name: "United States", sortOrder: 1, active: true },
  { id: "m-canada", geoId: "Americas", label: "Canada", name: "Canada", sortOrder: 2, active: true },
  { id: "m-mx", geoId: "Americas", label: "Mexico", name: "Mexico", sortOrder: 3, active: true },
  { id: "m-br", geoId: "Americas", label: "Brazil", name: "Brazil", sortOrder: 4, active: true },
  { id: "m-japan", geoId: "Japan", label: "Japan", name: "Japan", sortOrder: 1, active: true },
];

export const SKO_PERSONAS: SkoSellerPersona[] = [
  { id: "persona-tta", title: "Trusted Technical Advisor", description: "Shape client technology strategy and guide architecture decisions.", exampleRoles: ["ATL", "Senior ATL", "Account Technical Leader", "Technical Architect"], sortOrder: 1, active: true },
  { id: "persona-pgs", title: "Platform Growth Seller", description: "Win platform opportunities, grow pipeline, and expand adoption.", exampleRoles: ["Technology Sales Leader", "Software Seller", "Account Executive"], sortOrder: 2, active: true },
  { id: "persona-ss", title: "Solution Specialist", description: "Demonstrate value, create demand, and progress opportunities.", exampleRoles: ["Brand Technical Specialist", "Brand Technical Sales Specialist"], sortOrder: 3, active: true },
  { id: "persona-tgs", title: "Territory Growth Seller", description: "Build pipeline and progress opportunities across a broad client base.", exampleRoles: ["Territory Sales Specialist", "Regional Seller"], sortOrder: 4, active: true },
  { id: "persona-peb", title: "Partner & Ecosystem Builder", description: "Win through partner motions, co-creation, and ecosystem activation.", exampleRoles: ["Partner Technical Specialist", "Ecosystem Seller", "Partner Seller"], sortOrder: 5, active: true },
  { id: "persona-cei", title: "Client Engineering & Innovation", description: "Turn ideas into workshops, pilots, proof points, and client momentum.", exampleRoles: ["Client Engineer", "Innovation Specialist", "Workshop Lead"], sortOrder: 6, active: true },
  { id: "persona-ece", title: "Early Career Explorer", description: "Learn the business, build confidence, and understand how SKO helps you grow.", exampleRoles: ["Intern", "Associate Seller", "Graduate Hire", "Apprentice"], sortOrder: 7, active: true },
  { id: "persona-fl", title: "Future Leader", description: "Lead teams, grow sellers, and translate strategy into execution.", exampleRoles: ["Sales Manager", "First Line Manager", "Team Lead"], sortOrder: 8, active: true },
];

const AGENDA_CATALOG: {
  title: string;
  agendaType: SkoContentItem["agendaType"];
  description: string;
  durationMinutes: number;
  mediaCenterUrl: string;
  fallbackYoutubeUrl: string;
  technologyTracks: SkoContentItem["technologyTracks"];
  speakerIds: string[];
}[] = [
  {
    title: "General Manager Opening",
    agendaType: "opening",
    description:
      "Leadership frames how AI creates measurable advantage — connecting enterprise strategy to the proof points sellers need in client conversations this quarter.",
    durationMinutes: 25,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Agentic+AI+in+enterprise+planning:+Hype,+hesitation,+and+what+actually+matters/1_ujyjssu3",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=TKBzsNVga_w",
    technologyTracks: ["AI", "Hybrid Cloud"],
    speakerIds: ["speaker-1", "speaker-2"],
  },
  {
    title: "General Manager Conversation with Client",
    agendaType: "conversation",
    description:
      "A candid executive dialogue on co-creating outcomes — how trusted advisors translate SKO messaging into client-specific expansion narratives.",
    durationMinutes: 30,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Tech+Mahindra+|+Revolutionizing+Document+Management+with+watsonx.ai/1_l9gw1gz6/233881412",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=eL77_0-x9PE",
    technologyTracks: ["AI"],
    speakerIds: ["speaker-1", "speaker-3", "speaker-4"],
  },
  {
    title: "Expand Value",
    agendaType: "strategy",
    description:
      "Growth strategy for existing accounts — when first deployments prove value, expansion becomes a shared business case rather than a renewal conversation.",
    durationMinutes: 35,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Rhode+Island+College+Brings+IBM+Cyber+Campus+to+Life+Through+Immersive+Cyber+Training/1_yil3farx/233881412",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=4Hx15WVxvII",
    technologyTracks: ["Hybrid Cloud", "Automation"],
    speakerIds: ["speaker-5", "speaker-6"],
  },
  {
    title: "Must Win Frontiers",
    agendaType: "frontiers",
    description:
      "Priority battlegrounds for the half — where IBM must win mindshare, pipeline, and executive attention across hybrid cloud and AI-led transformation.",
    durationMinutes: 40,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Agentic+AI+in+enterprise+planning:+Hype,+hesitation,+and+what+actually+matters/1_ujyjssu3",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=-jspxYPCLBY",
    technologyTracks: ["AI", "Transaction Processing"],
    speakerIds: ["speaker-7", "speaker-8"],
  },
  {
    title: "IBM Bob",
    agendaType: "product",
    description:
      "Product momentum for IBM Bob — positioning the platform as a daily seller companion that removes friction from research, follow-up, and client preparation.",
    durationMinutes: 20,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Tech+Mahindra+|+Revolutionizing+Document+Management+with+watsonx.ai/1_l9gw1gz6/233881412",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=HnFy1MU5w0k",
    technologyTracks: ["AI"],
    speakerIds: ["speaker-9", "speaker-10"],
  },
  {
    title: "AI Tools & RevTech",
    agendaType: "tools",
    description:
      "RevTech in practice — the AI tools and workflows that give sellers time back while improving deal quality, forecasting, and client engagement.",
    durationMinutes: 30,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Agentic+AI+in+enterprise+planning:+Hype,+hesitation,+and+what+actually+matters/1_ujyjssu3",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=-jspxYPCLBY",
    technologyTracks: ["AI", "Automation"],
    speakerIds: ["speaker-11", "speaker-2"],
  },
  {
    title: "Inside SKOop",
    agendaType: "community",
    description:
      "Community energy behind SKO — how sellers connect across geos, share proof points, and build momentum through peer learning and SKOop programs.",
    durationMinutes: 15,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/HMC+Call+Home+Setup++Configuration/1_fkt35ejz/172215762",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=xA4QWwaweWA",
    technologyTracks: ["Hybrid Cloud"],
    speakerIds: ["speaker-12", "speaker-3"],
  },
  {
    title: "Platform Sessions",
    agendaType: "platform",
    description:
      "Deep platform sessions for technical sellers — architecture patterns, deployment proof, and the client conversations that unlock platform growth.",
    durationMinutes: 45,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Installing+your+Climate+Controlled+Diamondback+Tape+Library/1_wyqhw2z7",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=Yjqe24OyEcI",
    technologyTracks: ["Hybrid Cloud", "Transaction Processing"],
    speakerIds: ["speaker-5", "speaker-7", "speaker-11"],
  },
  {
    title: "Partner Ecosystem",
    agendaType: "partner",
    description:
      "Winning through partners — co-sell motions, ecosystem activation, and the joint value stories that accelerate pipeline in complex accounts.",
    durationMinutes: 35,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Tech+Mahindra+|+Revolutionizing+Document+Management+with+watsonx.ai/1_l9gw1gz6/233881412",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=wGNuTdIQ-nk",
    technologyTracks: ["Hybrid Cloud", "AI"],
    speakerIds: ["speaker-4", "speaker-6", "speaker-8"],
  },
  {
    title: "Recharge Lounge",
    agendaType: "recharge",
    description:
      "Reflection and recharge — synthesizing SKO takeaways into personal action plans before sellers return to clients and pipeline.",
    durationMinutes: 20,
    mediaCenterUrl:
      "https://mediacenter.ibm.com/media/Rhode+Island+College+Brings+IBM+Cyber+Campus+to+Life+Through+Immersive+Cyber+Training/1_yil3farx/233881412",
    fallbackYoutubeUrl: "https://www.youtube.com/watch?v=cdKop6aixVE",
    technologyTracks: ["Automation"],
    speakerIds: ["speaker-10", "speaker-12"],
  },
];

export const SKO_CONTENT_ITEMS: SkoContentItem[] = AGENDA_CATALOG.map((item, i) => ({
  id: `content-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: "global",
  agendaOrder: i + 1,
  title: item.title,
  agendaType: item.agendaType,
  description: item.description,
  durationMinutes: item.durationMinutes,
  videoProvider: "media_center",
  mediaCenterUrl: item.mediaCenterUrl,
  fallbackYoutubeUrl: item.fallbackYoutubeUrl,
  transcriptStatus: i < 6 ? "ready" : "pending",
  speakerIds: item.speakerIds,
  technologyTracks: item.technologyTracks,
  personas: [`persona-${["tta", "pgs", "ss", "tgs"][i % 4]}`],
  goals: (["Pipeline Growth", "Technical Confidence", "Client Engagement"] as const).slice(0, 2),
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
}));

const SPEAKER_PROFILES: Omit<SkoSpeaker, "id">[] = [
  {
    firstName: "Richard",
    lastName: "Hammond",
    displayName: "Richard Hammond",
    title: "General Manager",
    organization: "IBM",
    type: "General Manager",
    geoId: "APAC",
    imageUrl: P.male01,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@rhammond",
  },
  {
    firstName: "David",
    lastName: "Whitfield",
    displayName: "David Whitfield",
    title: "Technology Leader",
    organization: "IBM",
    type: "Technology Leader",
    geoId: "EMEA",
    imageUrl: P.male02,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@dwhitfield",
  },
  {
    firstName: "Marcus",
    lastName: "Thompson",
    displayName: "Marcus Thompson",
    title: "Client Executive",
    organization: "Global Financial Services",
    type: "Client Executive",
    geoId: "Americas",
    imageUrl: P.male03,
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@mthompson",
  },
  {
    firstName: "Naomi",
    lastName: "Williams",
    displayName: "Naomi Williams",
    title: "Partner Executive",
    organization: "Ecosystem Partner",
    type: "Partner Executive",
    geoId: "Americas",
    imageUrl: P.female03,
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@nwilliams",
  },
  {
    firstName: "Catherine",
    lastName: "Brooks",
    displayName: "Catherine Brooks",
    title: "Architecture Lead",
    organization: "IBM",
    type: "Architecture Lead",
    geoId: "EMEA",
    imageUrl: P.female02,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@cbrooks",
  },
  {
    firstName: "Alicia",
    lastName: "Morrison",
    displayName: "Alicia Morrison",
    title: "Sales Enablement Lead",
    organization: "IBM",
    type: "Sales Enablement Lead",
    geoId: "Americas",
    imageUrl: P.female04,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@amorrison",
  },
  {
    firstName: "Kenji",
    lastName: "Tanaka",
    displayName: "Kenji Tanaka",
    title: "AI Specialist",
    organization: "IBM Japan",
    type: "AI Specialist",
    geoId: "Japan",
    imageUrl: P.maleJapanese,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@ktanaka",
  },
  {
    firstName: "Mei Lin",
    lastName: "Wong",
    displayName: "Mei Lin Wong",
    title: "Marketplace Lead",
    organization: "IBM",
    type: "Marketplace Lead",
    geoId: "APAC",
    imageUrl: P.female01,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@mwong",
  },
  {
    firstName: "Arjun",
    lastName: "Mehta",
    displayName: "Arjun Mehta",
    title: "Brand Technical Specialist",
    organization: "IBM",
    type: "Brand Technical Specialist",
    geoId: "APAC",
    imageUrl: P.maleIndian,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@amehta",
  },
  {
    firstName: "James",
    lastName: "Porter",
    displayName: "James Porter",
    title: "Client Engineering Lead",
    organization: "IBM",
    type: "Client Engineering Lead",
    geoId: "EMEA",
    imageUrl: P.male01,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@jporter",
  },
  {
    firstName: "Michael",
    lastName: "Torres",
    displayName: "Michael Torres",
    title: "SME",
    organization: "IBM",
    type: "SME",
    geoId: "Americas",
    imageUrl: P.male02,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@mtorres",
  },
  {
    firstName: "Hiroshi",
    lastName: "Yamamoto",
    displayName: "Hiroshi Yamamoto",
    title: "Community Lead",
    organization: "IBM Japan",
    type: "Sales Enablement Lead",
    geoId: "Japan",
    imageUrl: P.maleJapanese,
    w3Url: "https://w3.ibm.com",
    linkedinUrl: "https://www.linkedin.com",
    slackHandle: "@hyamamoto",
  },
];

export const SKO_SPEAKERS: SkoSpeaker[] = SPEAKER_PROFILES.map((s, i) => ({
  id: `speaker-${i + 1}`,
  ...s,
}));

const CLIP_CATALOG: Omit<SkoContentClip, "id">[] = [
  // content-1 GM Opening
  { contentId: "content-1", startTime: "00:03:22", title: "Expansion begins with proof of value", teaserQuote: "…expansion starts when the first deployment proves value…", whyItMatters: "Connects leadership strategy to measurable client outcomes.", suggestedAction: "Use this framing when discussing expansion with existing clients.", speakerId: "speaker-1", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Pipeline Growth"], addedCount: 12, savedCount: 8 },
  { contentId: "content-1", startTime: "00:08:15", title: "Advantage is operational, not aspirational", teaserQuote: "…AI creates advantage when it changes how teams operate…", whyItMatters: "Helps sellers move the AI conversation from hype to practical execution.", suggestedAction: "Lead with workflow impact in your next executive briefing.", speakerId: "speaker-2", personas: ["persona-tta"], technologyTracks: ["Hybrid Cloud"], goals: ["Technical Confidence"], addedCount: 9, savedCount: 5 },
  { contentId: "content-1", startTime: "00:14:40", title: "Quarterly proof beats annual promises", teaserQuote: "…clients commit when you show progress this quarter…", whyItMatters: "Reframes SKO messaging into near-term client commitments.", suggestedAction: "Identify one account where a 90-day proof plan unlocks budget.", speakerId: "speaker-1", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Client Engagement"], addedCount: 7, savedCount: 4 },
  // content-2 GM Conversation
  { contentId: "content-2", startTime: "00:02:10", title: "Trust starts with shared outcomes", teaserQuote: "…the best conversations begin with what the client must prove…", whyItMatters: "Models executive dialogue that earns credibility quickly.", suggestedAction: "Open your next C-suite call with a co-owned outcome statement.", speakerId: "speaker-3", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Executive Conversations"], addedCount: 11, savedCount: 6 },
  { contentId: "content-2", startTime: "00:07:55", title: "Proof points beat feature lists", teaserQuote: "…executives lean in when you show evidence, not slides…", whyItMatters: "Sharpens how sellers prepare for client-facing moments.", suggestedAction: "Replace one product slide with a client proof point this week.", speakerId: "speaker-1", personas: ["persona-tta"], technologyTracks: ["Hybrid Cloud"], goals: ["Client Engagement"], addedCount: 8, savedCount: 3 },
  { contentId: "content-2", startTime: "00:12:30", title: "Rhythm that closes expansion", teaserQuote: "…expansion follows a rhythm of validate, scale, and renew…", whyItMatters: "Gives sellers a repeatable expansion narrative.", suggestedAction: "Map this rhythm to your top three expansion accounts.", speakerId: "speaker-4", personas: ["persona-peb"], technologyTracks: ["AI"], goals: ["Pipeline Growth"], addedCount: 6, savedCount: 2 },
  // content-3 Expand Value
  { contentId: "content-3", startTime: "00:04:15", title: "The win does not end at close", teaserQuote: "…the real growth begins when deployment creates satisfaction…", whyItMatters: "Reframes seller success around client outcomes and renewal opportunity.", suggestedAction: "Identify one account where deployment success can lead to expansion.", speakerId: "speaker-5", personas: ["persona-pgs"], technologyTracks: ["Hybrid Cloud"], goals: ["Value Creation"], addedCount: 14, savedCount: 9 },
  { contentId: "content-3", startTime: "00:09:20", title: "Land small, prove fast, expand deliberately", teaserQuote: "…start with a bounded scope that proves value in weeks…", whyItMatters: "Practical expansion motion for complex accounts.", suggestedAction: "Propose a bounded pilot with explicit expansion triggers.", speakerId: "speaker-6", personas: ["persona-tta"], technologyTracks: ["Automation"], goals: ["Pipeline Growth"], addedCount: 10, savedCount: 5 },
  { contentId: "content-3", startTime: "00:16:05", title: "Value stories travel further than decks", teaserQuote: "…a single client story can unlock three new conversations…", whyItMatters: "Encourages sellers to reuse proof across accounts.", suggestedAction: "Capture one client outcome story from this segment.", speakerId: "speaker-5", personas: ["persona-ss"], technologyTracks: ["Hybrid Cloud"], goals: ["Client Engagement"], addedCount: 5, savedCount: 3 },
  // content-4 Must Win Frontiers
  { contentId: "content-4", startTime: "00:05:10", title: "Frontiers demand focus, not breadth", teaserQuote: "…win where IBM has differentiated proof and partner energy…", whyItMatters: "Clarifies where sellers should concentrate pipeline effort.", suggestedAction: "Align your top opportunity to one Must Win frontier.", speakerId: "speaker-7", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Competitive Positioning"], addedCount: 13, savedCount: 7 },
  { contentId: "content-4", startTime: "00:11:30", title: "Executive attention follows urgency", teaserQuote: "…frontier accounts move when you tie AI to business risk…", whyItMatters: "Connects frontier strategy to executive-level urgency.", suggestedAction: "Reframe one deal around business risk and time-to-value.", speakerId: "speaker-8", personas: ["persona-fl"], technologyTracks: ["Transaction Processing"], goals: ["Executive Conversations"], addedCount: 9, savedCount: 4 },
  { contentId: "content-4", startTime: "00:18:45", title: "Partner proof accelerates frontier wins", teaserQuote: "…ecosystem stories shorten evaluation cycles…", whyItMatters: "Highlights partner leverage in competitive deals.", suggestedAction: "Invite a partner into your next frontier account plan.", speakerId: "speaker-8", personas: ["persona-peb"], technologyTracks: ["AI"], goals: ["Partner Selling"], addedCount: 6, savedCount: 2 },
  // content-5 IBM Bob
  { contentId: "content-5", startTime: "00:02:45", title: "Bob removes selling friction", teaserQuote: "…the tool is valuable when it gives time back to the seller…", whyItMatters: "Clarifies why productivity tools matter to daily execution.", suggestedAction: "Choose one workflow where Bob can reduce manual follow-up.", speakerId: "speaker-9", personas: ["persona-ss"], technologyTracks: ["AI"], goals: ["Product Knowledge"], addedCount: 15, savedCount: 10 },
  { contentId: "content-5", startTime: "00:07:20", title: "Daily habits beat occasional demos", teaserQuote: "…sellers win when Bob is part of every client prep…", whyItMatters: "Positions Bob as a daily companion, not a novelty.", suggestedAction: "Use Bob to draft your next client follow-up email.", speakerId: "speaker-10", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Technical Confidence"], addedCount: 8, savedCount: 5 },
  { contentId: "content-5", startTime: "00:11:55", title: "Personalization at seller speed", teaserQuote: "…personalized outreach should take minutes, not hours…", whyItMatters: "Links Bob to pipeline velocity and client relevance.", suggestedAction: "Generate a personalized account brief before your next call.", speakerId: "speaker-9", personas: ["persona-tta"], technologyTracks: ["Automation"], goals: ["Pipeline Growth"], addedCount: 6, savedCount: 3 },
  // content-6 AI Tools & RevTech
  { contentId: "content-6", startTime: "00:03:50", title: "RevTech connects tools to revenue", teaserQuote: "…every tool should map to a revenue motion…", whyItMatters: "Helps sellers justify AI tool adoption to managers.", suggestedAction: "Document one RevTech workflow you will use weekly.", speakerId: "speaker-11", personas: ["persona-pgs"], technologyTracks: ["AI"], goals: ["Pipeline Growth"], addedCount: 12, savedCount: 8 },
  { contentId: "content-6", startTime: "00:09:05", title: "Forecast quality improves with better inputs", teaserQuote: "…cleaner data in means cleaner commitments out…", whyItMatters: "Ties RevTech hygiene to forecast credibility.", suggestedAction: "Audit one opportunity for missing RevTech signals.", speakerId: "speaker-2", personas: ["persona-fl"], technologyTracks: ["Automation"], goals: ["Value Creation"], addedCount: 7, savedCount: 4 },
  { contentId: "content-6", startTime: "00:14:22", title: "AI assists, sellers decide", teaserQuote: "…automation supports judgment; it does not replace it…", whyItMatters: "Sets realistic expectations for AI in the sales process.", suggestedAction: "Use AI output as a draft, then add your client context.", speakerId: "speaker-11", personas: ["persona-tta"], technologyTracks: ["AI"], goals: ["Technical Confidence"], addedCount: 5, savedCount: 2 },
  // content-7 Inside SKOop
  { contentId: "content-7", startTime: "00:01:40", title: "Peer proof travels faster than policy", teaserQuote: "…sellers trust what peers have already tried…", whyItMatters: "Explains why SKOop community matters post-event.", suggestedAction: "Share one SKO takeaway in your geo Slack channel.", speakerId: "speaker-12", personas: ["persona-ece"], technologyTracks: ["Hybrid Cloud"], goals: ["Client Engagement"], addedCount: 4, savedCount: 2 },
  { contentId: "content-7", startTime: "00:06:15", title: "Community turns SKO into habit", teaserQuote: "…momentum continues when sellers stay connected…", whyItMatters: "Encourages ongoing engagement beyond the event week.", suggestedAction: "Join one SKOop circle aligned to your persona.", speakerId: "speaker-3", personas: ["persona-cei"], technologyTracks: ["Automation"], goals: ["Product Knowledge"], addedCount: 3, savedCount: 1 },
  // content-8 Platform Sessions
  { contentId: "content-8", startTime: "00:04:30", title: "Architecture proof unlocks platform deals", teaserQuote: "…clients buy platforms when architecture risk is addressed…", whyItMatters: "Critical for ATLs and technical sellers in platform motions.", suggestedAction: "Prepare an architecture one-pager for your top platform deal.", speakerId: "speaker-5", personas: ["persona-tta"], technologyTracks: ["Hybrid Cloud"], goals: ["Technical Confidence"], addedCount: 11, savedCount: 6 },
  { contentId: "content-8", startTime: "00:12:10", title: "Reference patterns shorten sales cycles", teaserQuote: "…reusable patterns beat bespoke proposals…", whyItMatters: "Speeds up technical validation in complex deals.", suggestedAction: "Reuse one reference pattern in an active opportunity.", speakerId: "speaker-7", personas: ["persona-tta"], technologyTracks: ["Transaction Processing"], goals: ["Pipeline Growth"], addedCount: 8, savedCount: 4 },
  { contentId: "content-8", startTime: "00:22:35", title: "Platform growth needs client engineering", teaserQuote: "…engineering-led workshops create platform conviction…", whyItMatters: "Connects Client Engineering to platform revenue.", suggestedAction: "Propose a workshop for your next platform prospect.", speakerId: "speaker-11", personas: ["persona-cei"], technologyTracks: ["Hybrid Cloud"], goals: ["Client Engagement"], addedCount: 6, savedCount: 3 },
  // content-9 Partner Ecosystem
  { contentId: "content-9", startTime: "00:03:05", title: "Co-sell starts with joint value", teaserQuote: "…partners engage when the story is shared, not borrowed…", whyItMatters: "Foundation for credible partner-led conversations.", suggestedAction: "Draft a joint value statement with your top partner.", speakerId: "speaker-4", personas: ["persona-peb"], technologyTracks: ["Hybrid Cloud"], goals: ["Partner Selling"], addedCount: 10, savedCount: 6 },
  { contentId: "content-9", startTime: "00:08:40", title: "Ecosystem deals need orchestration", teaserQuote: "…someone must coordinate IBM, partner, and client…", whyItMatters: "Highlights seller role in multi-party deals.", suggestedAction: "Assign an orchestration owner on your next ecosystem deal.", speakerId: "speaker-6", personas: ["persona-peb"], technologyTracks: ["AI"], goals: ["Pipeline Growth"], addedCount: 7, savedCount: 3 },
  { contentId: "content-9", startTime: "00:15:20", title: "Partner proof reduces client risk", teaserQuote: "…joint references lower the cost of saying yes…", whyItMatters: "Practical argument for bringing partners early.", suggestedAction: "Invite a partner reference into your next client session.", speakerId: "speaker-8", personas: ["persona-pgs"], technologyTracks: ["Hybrid Cloud"], goals: ["Value Creation"], addedCount: 5, savedCount: 2 },
  // content-10 Recharge Lounge
  { contentId: "content-10", startTime: "00:02:20", title: "Synthesis turns SKO into action", teaserQuote: "…take three moments and turn them into one client plan…", whyItMatters: "Helps sellers convert SKO content into immediate next steps.", suggestedAction: "Write three actions from SKO before end of week.", speakerId: "speaker-10", personas: ["persona-pgs"], technologyTracks: ["Automation"], goals: ["Value Creation"], addedCount: 6, savedCount: 4 },
  { contentId: "content-10", startTime: "00:07:50", title: "Personal brief beats generic recap", teaserQuote: "…your brief should reflect your accounts, not the agenda…", whyItMatters: "Connects Explore SKO to My Compass personalization.", suggestedAction: "Add two moments to My Brief before leaving SKO.", speakerId: "speaker-12", personas: ["persona-fl"], technologyTracks: ["Hybrid Cloud"], goals: ["Client Engagement"], addedCount: 4, savedCount: 2 },
];

export const SKO_CLIPS: SkoContentClip[] = CLIP_CATALOG.map((c, i) => ({
  id: `clip-${i + 1}`,
  ...c,
}));

const ASSET_TYPES: SkoContentAsset["type"][] = ["video", "pdf", "pptx", "docx", "newsroom"];
const ASSET_LABELS: Record<SkoContentAsset["type"], string> = {
  video: "Video",
  pdf: "PDF",
  pptx: "PPTX",
  docx: "DOCX",
  newsroom: "News",
  seismic: "Seismic",
  transcript: "Transcript",
};

export const SKO_ASSETS: SkoContentAsset[] = AGENDA_CATALOG.flatMap((item, i) => {
  const contentId = `content-${i + 1}`;
  return ASSET_TYPES.map((type, j) => ({
    id: `asset-${i + 1}-${type}`,
    contentId,
    type,
    label: ASSET_LABELS[type],
    url: type === "pdf" ? "#" : type === "video" ? item.mediaCenterUrl : "#",
    sourceSystem: type === "video" ? "media_center" : "compass",
    icon: `line-${type}`,
  }));
});

export const SKO_INGEST_JOBS: SkoIngestJob[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ingest-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: ["EMEA", "APAC", "Americas", "Japan"][i % 4],
  contentItemId: `content-${(i % 10) + 1}`,
  status: (["published", "narratives_ready", "knowledge_built", "assets_uploaded"] as const)[i % 4],
  videoUrl: AGENDA_CATALOG[i % 10].mediaCenterUrl,
  mp4FileUrl: "",
  mp3FileUrl: "",
  transcriptFileUrl: "",
  agendaValidated: true,
  speakerValidated: true,
  transcriptSegmented: i > 1,
  aiTagged: i > 2,
  clipsGenerated: i > 3,
  narrativesGenerated: i > 4,
  podcastGenerated: i > 5,
  published: i === 0,
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
}));

export const SKO_PULSE_METRICS: SkoPulseMetrics[] = [
  { id: "pulse-emea", editionId: SKO_EDITION_ID, geoId: "EMEA", nps: 72, attendanceRate: 94, watchedLiveRate: 81, participationRate: 67, narrativesGenerated: 1240, minutesDelivered: 18600, topMarket: "DACH", topAgendaSegments: ["Expand Value", "AI Tools & RevTech"], updatedAt: "2026-07-08T10:00:00.000Z", sourceLabel: "SKO post-show reporting" },
  { id: "pulse-apac", editionId: SKO_EDITION_ID, geoId: "APAC", nps: null, attendanceRate: null, watchedLiveRate: null, participationRate: null, narrativesGenerated: null, minutesDelivered: null, updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "pulse-americas", editionId: SKO_EDITION_ID, geoId: "Americas", nps: null, attendanceRate: null, watchedLiveRate: null, participationRate: null, narrativesGenerated: null, minutesDelivered: null, updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "pulse-japan", editionId: SKO_EDITION_ID, geoId: "Japan", nps: null, attendanceRate: null, watchedLiveRate: null, participationRate: null, narrativesGenerated: null, minutesDelivered: null, updatedAt: "2026-06-01T00:00:00.000Z" },
];

export const SKO_PULSE_QUOTES: SkoPulseQuote[] = Array.from({ length: 8 }, (_, i) => ({
  id: `pq-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: ["EMEA", "APAC", "Americas", "Japan"][i % 4],
  quote: [
    "Compass turned SKO into a briefing I could use the same day with clients.",
    "The podcast format helped me replay key moments on my commute.",
    "I finally had a clear next step after every major session.",
    "Chinese summary options made APAC enablement feel intentional.",
  ][i % 4],
  attributionLabel: `Seller, ${["DACH", "Singapore", "USA", "Tokyo"][i % 4]}`,
  roleLabel: "Account Executive",
  approved: true,
  sortOrder: i + 1,
}));

export const SKO_BRIEFS: SkoBrief[] = Array.from({ length: 5 }, (_, i) => ({
  id: `brief-${i + 1}`,
  userId: `seller-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: ["EMEA", "APAC", "Americas", "Japan", "EMEA"][i],
  marketId: ["m-dach", "m-sg", "m-usa", "m-japan", "m-uki"][i],
  title: `Your SKO Briefing — Day ${i + 1}`,
  summary: "Personalized recap of GM Opening, Expand Value, and AI Tools & RevTech with seller actions.",
  generatedAt: "2026-07-08T12:00:00.000Z",
  sourceContentIds: ["content-1", "content-3", "content-6"],
  sourceClipIds: ["clip-1", "clip-3", "clip-4"],
  status: "ready",
}));

export const SKO_PODCASTS: SkoPodcast[] = [
  { id: "pod-1", briefId: "brief-1", userId: "seller-1", editionId: SKO_EDITION_ID, geoId: "EMEA", language: "en-US", format: "seller_podcast_15min", voice: "Warm narrator", script: "Welcome to your SKO briefing…", audioUrl: "", durationMinutes: 15, generatedAt: "2026-07-08T12:00:00.000Z" },
  { id: "pod-2", briefId: "brief-2", userId: "seller-2", editionId: SKO_EDITION_ID, geoId: "APAC", language: "zh-CN", format: "quick_brief_3min", voice: "Executive brief", script: "您的 SKO 简报…", audioUrl: "", durationMinutes: 3, generatedAt: "2026-07-08T12:00:00.000Z" },
  { id: "pod-3", userId: "seller-3", editionId: SKO_EDITION_ID, geoId: "Americas", language: "en-US", format: "executive_brief_10min", durationMinutes: 10, generatedAt: "2026-07-08T12:00:00.000Z" },
  { id: "pod-4", userId: "seller-4", editionId: SKO_EDITION_ID, geoId: "Japan", language: "en-US", format: "deep_dive_45min", durationMinutes: 45, generatedAt: "2026-07-08T12:00:00.000Z" },
  { id: "pod-5", userId: "seller-5", editionId: SKO_EDITION_ID, geoId: "EMEA", language: "en-US", format: "quick_brief_3min", durationMinutes: 3, generatedAt: "2026-07-08T12:00:00.000Z" },
];

const SE_TEAM: Partial<SkoUserProfile>[] = [
  { uid: "se-kevin", firstName: "Kevin", lastName: "Peters", displayName: "Kevin Peters", email: "kevin.peters@ibm.com", accessType: "se_team", jobTitle: "Offering Manager" },
  { uid: "se-cassy", firstName: "Cassy", lastName: "Lalan", displayName: "Cassy Lalan", email: "cassy.lalan@ibm.com", accessType: "se_team", jobTitle: "Content Strategist" },
  { uid: "se-teagan", firstName: "Teagan", lastName: "Clark", displayName: "Teagan Clark", email: "teagan.clark@ibm.com", accessType: "se_team", jobTitle: "SKO Project Manager" },
  { uid: "se-trent", firstName: "Trent", lastName: "Wogon", displayName: "Trent Wogon", email: "trent.wogon@ibm.com", accessType: "se_team", jobTitle: "SE Finance Lead" },
  { uid: "se-rebecca", firstName: "Rebecca", lastName: "Reyes", displayName: "Rebecca Reyes", email: "rebecca.reyes@ibm.com", accessType: "se_team", jobTitle: "VP, Sales Enablement" },
  { uid: "se-aravind", firstName: "Aravind", lastName: "Ragupathi", displayName: "Aravind Ragupathi", email: "aravind.ragupathi@ibm.com", accessType: "se_team", jobTitle: "Compass Product Lead" },
  { uid: "se-todd", firstName: "Todd", lastName: "Tuttle", displayName: "Todd Tuttle", email: "todd.tuttle@ibm.com", accessType: "se_team", jobTitle: "Enablement Tool Lead" },
  { uid: "se-celina", firstName: "Celina", lastName: "Brumec", displayName: "Celina Brumec", email: "celina.brumec@ibm.com", accessType: "se_team", jobTitle: "EMEA SKO Lead" },
];

const SELLER_CITIES = [
  { city: "Riyadh", marketId: "m-saudi", geoId: "EMEA" },
  { city: "Dubai", marketId: "m-uae", geoId: "EMEA" },
  { city: "London", marketId: "m-uki", geoId: "EMEA" },
  { city: "Dublin", marketId: "m-uki", geoId: "EMEA" },
  { city: "Madrid", marketId: "m-spain", geoId: "EMEA" },
  { city: "Rome", marketId: "m-italy", geoId: "EMEA" },
  { city: "Paris", marketId: "m-france", geoId: "EMEA" },
  { city: "Frankfurt", marketId: "m-dach", geoId: "EMEA" },
  { city: "Bangalore", marketId: "m-isa", geoId: "APAC" },
  { city: "Singapore", marketId: "m-sg", geoId: "APAC" },
  { city: "Sydney", marketId: "m-anz", geoId: "APAC" },
  { city: "Melbourne", marketId: "m-anz", geoId: "APAC" },
  { city: "Tokyo", marketId: "m-japan", geoId: "Japan" },
  { city: "Toronto", marketId: "m-canada", geoId: "Americas" },
  { city: "New York", marketId: "m-usa", geoId: "Americas" },
  { city: "Chicago", marketId: "m-usa", geoId: "Americas" },
  { city: "Mexico City", marketId: "m-mx", geoId: "Americas" },
  { city: "São Paulo", marketId: "m-br", geoId: "Americas" },
];

export function buildSkoSellerUsers(): SkoUserProfile[] {
  const personas = ["persona-tta", "persona-pgs", "persona-ss", "persona-tgs", "persona-peb", "persona-cei", "persona-ece", "persona-fl"];
  const sellers: SkoUserProfile[] = SELLER_CITIES.map((loc, i) => ({
    uid: `seller-${i + 1}`,
    firstName: `Seller${i + 1}`,
    lastName: loc.city.replace(/\s/g, ""),
    displayName: `Seller ${i + 1} ${loc.city}`,
    email: `seller${i + 1}.${loc.city.toLowerCase().replace(/\s/g, "")}@ibm.com`,
    slackHandle: `@seller${i + 1}`,
    accessType: i % 12 === 0 ? "partner" : "seller",
    geoId: loc.geoId,
    marketId: loc.marketId,
    personaId: personas[i % personas.length],
    jobTitle: "Account Executive",
    domain: "Technology",
    technologyTracks: ["Hybrid Cloud", "AI"].slice(0, (i % 2) + 1) as SkoUserProfile["technologyTracks"],
    goals: ["Pipeline Growth", "Client Engagement"],
    experienceLevel: "Experienced Seller",
    product: "sko",
    profileComplete: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }));

  while (sellers.length < 100) {
    const i = sellers.length;
    sellers.push({
      ...sellers[i % SELLER_CITIES.length],
      uid: `seller-${i + 1}`,
      email: `seller${i + 1}@ibm.com`,
      displayName: `Seller ${i + 1}`,
    });
  }

  const team: SkoUserProfile[] = SE_TEAM.map(m => ({
    uid: m.uid!,
    firstName: m.firstName!,
    lastName: m.lastName!,
    displayName: m.displayName!,
    email: m.email!,
    accessType: "se_team",
    jobTitle: m.jobTitle,
    product: "sko",
    profileComplete: true,
    technologyTracks: [],
    goals: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }));

  return [...team, ...sellers];
}

export const SKO_SELLER_USERS = buildSkoSellerUsers();
