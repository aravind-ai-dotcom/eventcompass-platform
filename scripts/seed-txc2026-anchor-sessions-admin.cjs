cat > scripts/seed-txc2026-anchor-sessions-admin.cjs <<'EOF'
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";

const anchors = [
  {
    id: "ANCHOR-MON-PARTNER-KICKOFF",
    title: "Partner Day Kickoff",
    activity_type: "Special Program",
    session_type: "Partner Day",
    summary: "Partner Day opening moment for registered IBM Business Partners.",
    date: "2026-10-26",
    schedule: { day: "Monday", date: "2026-10-26", start_time: "09:00 AM", end_time: "10:00 AM", room: "Partner Day" },
    tracks: { primary_track: "Partner", topics: ["Partner Day", "Business Partners"], products: [] },
    audience: { roles: ["Partner"], industries: [] },
    recommendation_rules: { everyone_encouraged: false, executive_relevant: true, hands_on: false },
    compass_intelligence: { intent_tags: ["network with peers"], need_tags: ["partner strategy"], matching_keywords: ["partner", "business partner", "partner day"] },
    visibility: "partner_only",
    anchor_event: true,
  },
  {
    id: "ANCHOR-MON-COMMUNITY-KICKOFF",
    title: "Community Day Kickoff",
    activity_type: "Special Program",
    session_type: "Community Day",
    summary: "Community Day opening moment for attendees focused on peer connection, communities, and shared learning.",
    date: "2026-10-26",
    schedule: { day: "Monday", date: "2026-10-26", start_time: "01:00 PM", end_time: "02:00 PM", room: "Community Day" },
    tracks: { primary_track: "Community", topics: ["Community Day", "Community", "Networking"], products: [] },
    audience: { roles: ["Developer", "Architect", "Champion", "Student"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: false },
    compass_intelligence: { intent_tags: ["network with peers", "meet ibm champions"], need_tags: ["community connection"], matching_keywords: ["community", "champions", "networking", "peer connection"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-MON-BLOCK-PARTY",
    title: "Opening Night Block Party at Sandbox Expo",
    activity_type: "Reception",
    session_type: "Networking",
    summary: "Opening night celebration inside the Sandbox Expo.",
    date: "2026-10-26",
    schedule: { day: "Monday", date: "2026-10-26", start_time: "06:30 PM", end_time: "09:30 PM", room: "Sandbox Expo" },
    tracks: { primary_track: "Fun", topics: ["Opening Night", "Sandbox Expo", "Networking"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: false },
    compass_intelligence: { intent_tags: ["network with peers", "fun"], need_tags: ["community connection"], matching_keywords: ["block party", "sandbox", "networking", "opening night"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-TUE-GENERAL-SESSION",
    title: "Opening General Session",
    activity_type: "General Session",
    session_type: "Keynote",
    summary: "Tuesday morning keynote and announcements.",
    date: "2026-10-27",
    schedule: { day: "Tuesday", date: "2026-10-27", start_time: "09:00 AM", end_time: "09:45 AM", room: "Main Stage" },
    tracks: { primary_track: "General Session", topics: ["Keynote", "Announcements", "IBM Strategy"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: true, hands_on: false },
    compass_intelligence: { intent_tags: ["understand ibm roadmap", "discover customer stories"], need_tags: ["strategic insights", "product roadmap"], matching_keywords: ["keynote", "general session", "announcements", "ibm roadmap"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-TUE-SANDBOX-EXPO",
    title: "Sandbox Expo",
    activity_type: "Expo",
    session_type: "Sandbox",
    summary: "Explore hands-on demos, experiences, IBM Arcade, and IBM Archives inside the Sandbox.",
    date: "2026-10-27",
    schedule: { day: "Tuesday", date: "2026-10-27", start_time: "10:00 AM", end_time: "06:00 PM", room: "Sandbox Expo" },
    tracks: { primary_track: "Fun", topics: ["Sandbox", "IBM Arcade", "IBM Archives", "Demos"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: true },
    compass_intelligence: { intent_tags: ["explore", "hands-on learning", "fun"], need_tags: ["demos", "discovery"], matching_keywords: ["sandbox", "arcade", "archives", "demos", "mainframe", "selectric", "line printer"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-WED-SANDBOX-EXPO",
    title: "Sandbox Expo",
    activity_type: "Expo",
    session_type: "Sandbox",
    summary: "Explore hands-on demos, experiences, IBM Arcade, and IBM Archives inside the Sandbox.",
    date: "2026-10-28",
    schedule: { day: "Wednesday", date: "2026-10-28", start_time: "09:00 AM", end_time: "06:00 PM", room: "Sandbox Expo" },
    tracks: { primary_track: "Fun", topics: ["Sandbox", "IBM Arcade", "IBM Archives", "Demos"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: true },
    compass_intelligence: { intent_tags: ["explore", "hands-on learning", "fun"], need_tags: ["demos", "discovery"], matching_keywords: ["sandbox", "arcade", "archives", "demos", "mainframe", "selectric", "line printer"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-WED-NETWORKING-EVENT",
    title: "Networking Event",
    activity_type: "Networking",
    session_type: "Reception",
    summary: "Wednesday evening networking event for attendees.",
    date: "2026-10-28",
    schedule: { day: "Wednesday", date: "2026-10-28", start_time: "06:30 PM", end_time: "09:30 PM", room: "Event Venue" },
    tracks: { primary_track: "Community", topics: ["Networking", "Community", "Fun"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: false },
    compass_intelligence: { intent_tags: ["network with peers", "fun"], need_tags: ["community connection"], matching_keywords: ["networking", "community", "evening event"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-THU-SANDBOX-EXPO",
    title: "Sandbox Expo",
    activity_type: "Expo",
    session_type: "Sandbox",
    summary: "Final Sandbox Expo hours, including IBM Arcade and IBM Archives.",
    date: "2026-10-29",
    schedule: { day: "Thursday", date: "2026-10-29", start_time: "09:00 AM", end_time: "01:30 PM", room: "Sandbox Expo" },
    tracks: { primary_track: "Fun", topics: ["Sandbox", "IBM Arcade", "IBM Archives", "Demos"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: true },
    compass_intelligence: { intent_tags: ["explore", "hands-on learning", "fun"], need_tags: ["demos", "discovery"], matching_keywords: ["sandbox", "arcade", "archives", "demos", "mainframe", "selectric", "line printer"] },
    visibility: "public",
    anchor_event: true,
  },
  {
    id: "ANCHOR-THU-DEPARTURES",
    title: "Departures — Grab & Go Lunch",
    activity_type: "Logistics",
    session_type: "Departure",
    summary: "Thursday departure window with grab-and-go lunch. No closing ceremony is scheduled.",
    date: "2026-10-29",
    schedule: { day: "Thursday", date: "2026-10-29", start_time: "12:00 PM", end_time: "01:00 PM", room: "Departure Area" },
    tracks: { primary_track: "Logistics", topics: ["Departures", "Grab & Go Lunch"], products: [] },
    audience: { roles: ["All attendees"], industries: [] },
    recommendation_rules: { everyone_encouraged: true, executive_relevant: false, hands_on: false },
    compass_intelligence: { intent_tags: ["departure"], need_tags: ["logistics"], matching_keywords: ["departure", "grab and go", "lunch", "travel"] },
    visibility: "public",
    anchor_event: true,
  }
];

async function run() {
  console.log("\nSeeding TechXchange 2026 anchor sessions…\n");

  for (const s of anchors) {
    await db.doc(`${BASE}/sessions/${s.id}`).set(
      {
        ...s,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        source: "anchor_schedule_seed",
      },
      { merge: true }
    );
    console.log(`✓ ${s.id} — ${s.title}`);
  }

  console.log("\nDone. Anchor sessions repaired.\n");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
EOF