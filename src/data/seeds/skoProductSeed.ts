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
  { id: "geo-emea", editionId: SKO_EDITION_ID, name: "EMEA", date: "2026-07-07", deliveryType: "Live", cityLabel: "Madrid", status: "completed", imageUrl: "/geo/madrid.jpg" },
  { id: "geo-apac", editionId: SKO_EDITION_ID, name: "APAC", date: "2026-07-13", deliveryType: "Live", cityLabel: "Singapore", status: "upcoming", imageUrl: "/geo/singapore-marina-bay.jpg" },
  { id: "geo-americas", editionId: SKO_EDITION_ID, name: "Americas", date: "2026-07-27", deliveryType: "Virtual", cityLabel: "Virtual studio", status: "upcoming", imageUrl: "/geo/americas-virtual.jpg" },
  { id: "geo-japan", editionId: SKO_EDITION_ID, name: "Japan", date: "2026-07-30", deliveryType: "Live", cityLabel: "Tokyo", status: "upcoming", imageUrl: "/geo/tokyo-tower-day.jpg" },
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

const AGENDA_TITLES = [
  "General Manager Opening",
  "General Manager Conversation with Client",
  "Expand Value",
  "Must Win Frontiers",
  "IBM Bob",
  "AI Tools & RevTech",
  "Inside SKOop",
  "Platform Sessions",
  "Partner Ecosystem",
  "Recharge Lounge",
];

const MEDIA_CENTER = [
  "https://mediacenter.ibm.com/media/Agentic+AI+in+enterprise+planning:+Hype,+hesitation,+and+what+actually+matters/1_ujyjssu3",
  "https://mediacenter.ibm.com/media/Tech+Mahindra+|+Revolutionizing+Document+Management+with+watsonx.ai/1_l9gw1gz6/233881412",
  "https://mediacenter.ibm.com/media/Rhode+Island+College+Brings+IBM+Cyber+Campus+to+Life+Through+Immersive+Cyber+Training/1_yil3farx/233881412",
];

const YOUTUBE_FALLBACK = [
  "https://www.youtube.com/watch?v=nYQqTPlVLKo",
  "https://www.youtube.com/watch?v=4Hx15WVxvII",
  "https://www.youtube.com/watch?v=-jspxYPCLBY",
  "https://www.youtube.com/watch?v=xA4QWwaweWA",
  "https://www.youtube.com/watch?v=wGNuTdIQ-nk",
];

export const SKO_CONTENT_ITEMS: SkoContentItem[] = AGENDA_TITLES.map((title, i) => ({
  id: `content-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: "global",
  agendaOrder: i + 1,
  title,
  agendaType: ["opening", "conversation", "strategy", "frontiers", "product", "tools", "community", "platform", "partner", "recharge"][i],
  description: `${title} — SKO2H 2026 session briefing.`,
  durationMinutes: [25, 30, 35, 40, 20, 30, 15, 45, 35, 20][i],
  videoProvider: i < 3 ? "media_center" : "youtube",
  mediaCenterUrl: MEDIA_CENTER[i % MEDIA_CENTER.length],
  fallbackYoutubeUrl: YOUTUBE_FALLBACK[i % YOUTUBE_FALLBACK.length],
  transcriptStatus: i < 4 ? "ready" : "pending",
  speakerIds: [`speaker-${(i % 12) + 1}`],
  technologyTracks: (["Hybrid Cloud", "AI", "Automation", "Transaction Processing"] as const).slice(0, (i % 2) + 1),
  personas: [`persona-${["tta", "pgs", "ss", "tgs"][i % 4]}`],
  goals: (["Pipeline Growth", "Technical Confidence", "Client Engagement"] as const).slice(0, 2),
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
}));

export const SKO_SPEAKERS: SkoSpeaker[] = Array.from({ length: 12 }, (_, i) => ({
  id: `speaker-${i + 1}`,
  firstName: ["Jordan", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Taylor", "Reese", "Skyler", "Dakota", "Jamie", "Blake"][i],
  lastName: ["Chen", "Okonkwo", "Santos", "Nguyen", "Patel", "Kowalski", "Andersson", "Morales", "Kim", "Fischer", "Ali", "Brooks"][i],
  displayName: `${["Jordan", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Taylor", "Reese", "Skyler", "Dakota", "Jamie", "Blake"][i]} ${["Chen", "Okonkwo", "Santos", "Nguyen", "Patel", "Kowalski", "Andersson", "Morales", "Kim", "Fischer", "Ali", "Brooks"][i]}`,
  title: ["General Manager", "Client Executive", "Technology Leader", "AI Specialist", "Architecture Lead", "Partner Executive", "Sales Enablement Lead", "Client Engineering Lead", "Marketplace Lead", "SME", "Brand Technical Specialist", "Ecosystem Seller"][i],
  organization: i % 3 === 0 ? "IBM" : i % 3 === 1 ? "Client Partner" : "Ecosystem Partner",
  type: ["General Manager", "Client Executive", "Technology Leader", "AI Specialist", "Architecture Lead", "Partner Executive", "Sales Enablement Lead", "Client Engineering Lead", "Marketplace Lead", "SME", "Brand Technical Specialist", "Partner Executive"][i],
  geoId: ["EMEA", "APAC", "Americas", "Japan"][i % 4],
}));

function buildClips(): SkoContentClip[] {
  const clips: SkoContentClip[] = [];
  const samples = [
    { startTime: "00:03:22", title: "Expansion begins with proof of value", teaserQuote: "…expansion starts when the first deployment proves value…", whyItMatters: "Connects leadership strategy to measurable client outcomes.", suggestedAction: "Use this framing when discussing expansion with existing clients." },
    { startTime: "00:11:48", title: "AI creates advantage when it changes work", teaserQuote: "…AI matters when it changes how teams operate…", whyItMatters: "Helps sellers move the AI conversation from hype to practical execution.", suggestedAction: "Connect AI to workflow improvement, not generic transformation." },
    { startTime: "00:04:15", title: "The win does not end at close", teaserQuote: "…the real growth begins when deployment creates satisfaction…", whyItMatters: "Reframes seller success around client outcomes and renewal opportunity.", suggestedAction: "Identify one account where deployment success can lead to expansion." },
    { startTime: "00:06:40", title: "AI tools should remove selling friction", teaserQuote: "…the tool is valuable when it gives time back to the seller…", whyItMatters: "Clarifies why productivity tools matter to daily execution.", suggestedAction: "Choose one workflow where AI can reduce manual follow-up." },
  ];
  for (let i = 0; i < 40; i++) {
    const s = samples[i % samples.length];
    const contentId = `content-${(i % 10) + 1}`;
    clips.push({
      id: `clip-${i + 1}`,
      contentId,
      startTime: s.startTime,
      endTime: "00:15:00",
      title: `${s.title} (${i + 1})`,
      teaserQuote: s.teaserQuote,
      whyItMatters: s.whyItMatters,
      suggestedAction: s.suggestedAction,
      speakerId: `speaker-${(i % 12) + 1}`,
      sourceAudioUrl: "",
      clipAudioUrl: "",
      personas: ["persona-pgs"],
      technologyTracks: ["AI"],
      goals: ["Pipeline Growth"],
      addedCount: i % 5,
      savedCount: i % 3,
    });
  }
  return clips;
}

export const SKO_CLIPS = buildClips();

export const SKO_ASSETS: SkoContentAsset[] = Array.from({ length: 20 }, (_, i) => ({
  id: `asset-${i + 1}`,
  contentId: `content-${(i % 10) + 1}`,
  type: (["video", "pdf", "pptx", "transcript", "newsroom"] as const)[i % 5],
  label: `Asset ${i + 1}`,
  url: MEDIA_CENTER[i % MEDIA_CENTER.length],
  sourceSystem: i % 2 === 0 ? "media_center" : "youtube",
  icon: "line-video",
}));

export const SKO_INGEST_JOBS: SkoIngestJob[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ingest-${i + 1}`,
  editionId: SKO_EDITION_ID,
  geoId: ["EMEA", "APAC", "Americas", "Japan"][i % 4],
  contentItemId: `content-${(i % 10) + 1}`,
  status: (["published", "narratives_ready", "knowledge_built", "assets_uploaded"] as const)[i % 4],
  videoUrl: MEDIA_CENTER[0],
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
