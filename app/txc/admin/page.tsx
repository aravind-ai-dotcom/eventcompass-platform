"use client";
// =============================================================================
// EventCompass — Admin Console   /admin
// Event Intelligence Center · IBM TechXchange 2026
//
// Route:   /admin  (direct URL only — never in attendee navigation)
// Auth:    sessionStorage  (admin / Compass1234!)
// Data:    Client-side Firestore reads — organizations/ibm/events/txc2026
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import {
  VOICE_TONE_OPTIONS,
  getVoiceNameForTone,
  type VoiceToneId,
} from "@/lib/voiceTtsOptions";

// ─── Version ──────────────────────────────────────────────────────────────────
const COMPASS_VERSION = "1.0.4";

// ─── Firestore path ───────────────────────────────────────────────────────────
const BASE = "organizations/ibm/events/txc2026";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const SESSION_KEY = "compass_admin_v1";
function checkCredentials(u: string, p: string) { return u === "admin" && p === "Compass1234!"; }
function persistSession() { if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1"); }
function clearSession()   { if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY); }
function hasSession()     { return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1"; }

// ─── Navigation ───────────────────────────────────────────────────────────────
type AdminView =
  | "dashboard" | "personas"    | "champions"     | "snapshots"
  | "capacity"  | "consent"     | "activity"      | "content"
  | "credits"   | "voice"       | "signals"       | "access"    | "ingest"    | "exports"     | "audit"
  | "participants" | "sessions-table" | "quality"
  | "health" | "command" | "champion-intel" | "consent-intel"
  | "heatmap" | "data-quality" | "exec-snapshot" | "right-now";

interface NavItem {
  id: AdminView;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  description: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "event-status",
    label: "Event status",
    description: "Monitor the live health and operating picture of TechXchange.",
    items: [
      { id: "dashboard",     label: "Dashboard"      },
      { id: "exec-snapshot", label: "Exec Snapshot"  },
      { id: "command",       label: "Command Center" },
      { id: "right-now",     label: "Right Now"      },
      { id: "health",        label: "Health Center"  },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    description: "Control what attendees see, hear, and read across Compass.",
    items: [
      { id: "content", label: "Content"       },
      { id: "voice",   label: "Voice"         },
      { id: "credits", label: "Credits"       },
      { id: "access",  label: "Admin Access"  },
    ],
  },
  {
    id: "attendees",
    label: "Attendees",
    description: "Understand participant signals, intent, consent, and audience patterns.",
    items: [
      { id: "participants",  label: "Participants"   },
      { id: "signals",       label: "Signals"        },
      { id: "personas",      label: "Personas"       },
      { id: "consent",       label: "Consent"        },
      { id: "consent-intel", label: "Consent Intel"  },
      { id: "heatmap",       label: "TXC Heat Map"   },
    ],
  },
  {
    id: "champions",
    label: "Champions",
    description: "Manage expert, mentor, and community-leader intelligence.",
    items: [
      { id: "champions",      label: "Champions"      },
      { id: "champion-intel", label: "Champion Intel" },
    ],
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Review session catalog, capacity, snapshots, and recommendation inputs.",
    items: [
      { id: "sessions-table", label: "Sessions"   },
      { id: "capacity",       label: "Capacity"   },
      { id: "snapshots",      label: "Snapshots"  },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Manage ingest, quality, exports, audit trail, and system activity.",
    items: [
      { id: "ingest",       label: "Data Ingest"    },
      { id: "quality",      label: "Data Quality"   },
      { id: "data-quality", label: "Quality Center" },
      { id: "activity",     label: "Activity"       },
      { id: "exports",      label: "Exports"        },
      { id: "audit",        label: "Audit Log"      },
    ],
  },
];

function findNavItem(view: AdminView): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(i => i.id === view);
    if (item) return item;
  }
  return undefined;
}

function findNavGroup(view: AdminView): NavGroup | undefined {
  return NAV_GROUPS.find(g => g.items.some(i => i.id === view));
}

// ─── IBM colours ──────────────────────────────────────────────────────────────
const IBM = {
  blue:      "#0f62fe",
  blueLight: "#78a9ff",
  purple:    "#6929c4",
  cyan:      "#009d9a",
  green:     "#24a148",
  red:       "#da1e28",
  yellow:    "#f1c21b",
  orange:    "#ff832b",
  maroon:    "#9f1853",
  teal:      "#007d79",
};

// ─── Style tokens ─────────────────────────────────────────────────────────────
const S = {
  bg:     "#161616",
  sideBg: "#0f0f0f",
  panel:  "#1f1f1f",
  text:   "#f4f4f4",
  soft:   "#e0e0e0",
  muted:  "#a8a8a8",
  dim:    "#6f6f6f",
  line:   "#393939",
  accent: "#78a9ff",
};

/** Shared form + surface tokens — single Carbon-inspired admin surface. */
const A = {
  field: {
    width: "100%",
    height: "36px",
    padding: "0 12px",
    background: "transparent",
    border: `1px solid ${S.line}`,
    color: S.text,
    fontSize: "0.88rem",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  } satisfies CSSProperties,
  textarea: {
    width: "100%",
    minHeight: "72px",
    padding: "8px 12px",
    background: "transparent",
    border: `1px solid ${S.line}`,
    color: S.text,
    fontSize: "0.88rem",
    fontFamily: "inherit",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  } satisfies CSSProperties,
  fieldLabel: {
    color: S.muted,
    fontSize: "0.72rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    display: "block" as const,
    marginBottom: "5px",
  } satisfies CSSProperties,
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: `1px solid ${S.line}`,
  } satisfies CSSProperties,
  divider: {
    height: "1px",
    background: S.line,
    margin: "16px 0",
    border: "none",
  } satisfies CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// Static / synthetic data — views that do NOT require Firestore
// ─────────────────────────────────────────────────────────────────────────────

type ActivityType = "profile" | "session" | "champion" | "reco" | "voice";

const ACTIVITY_SEED: { id: number; time: string; event: string; type: ActivityType; persona: string }[] = [
  { id: 1,  time: "2 sec ago",  event: "Sarah K. built her Compass profile",        type: "profile",  persona: "Developer"  },
  { id: 2,  time: "8 sec ago",  event: "Michael T. saved AI Strategy Workshop",     type: "session",  persona: "Architect"  },
  { id: 3,  time: "19 sec ago", event: "Priya S. connected with Champion match",    type: "champion", persona: "Executive"  },
  { id: 4,  time: "31 sec ago", event: "Kevin M. refined Compass profile",          type: "profile",  persona: "IBMer"      },
  { id: 5,  time: "45 sec ago", event: "John A. accepted 3 recommendations",        type: "reco",     persona: "Client"     },
  { id: 6,  time: "58 sec ago", event: "Amy L. saved Red Hat Migration Lab",        type: "session",  persona: "Architect"  },
  { id: 7,  time: "1 min ago",  event: "Rajesh P. built his Compass profile",       type: "profile",  persona: "Developer"  },
  { id: 8,  time: "1 min ago",  event: "Elena K. requested a Champion 1:1",         type: "champion", persona: "Student"    },
  { id: 9,  time: "2 min ago",  event: "David C. used Voice Compass",               type: "voice",    persona: "Executive"  },
  { id: 10, time: "2 min ago",  event: "Mei L. built her Compass profile",          type: "profile",  persona: "Partner"    },
];

const AUDIT_LOG = [
  { time: "2026-10-28 14:32:11", user: "admin", action: "Content Updated",   before: "Old hero copy",              after: "New hero copy"                 },
  { time: "2026-10-28 13:18:44", user: "admin", action: "Session Ingested",  before: "0 sessions",                 after: "124 sessions imported"         },
  { time: "2026-10-28 11:02:19", user: "admin", action: "Champion Ingested", before: "0 champions",                after: "486 champions imported"        },
  { time: "2026-10-28 09:44:01", user: "admin", action: "Snapshot Created",  before: "—",                          after: "Before Tuesday Keynote"        },
  { time: "2026-10-27 22:11:38", user: "admin", action: "Content Updated",   before: "Explore hero v1",            after: "Explore hero v2"               },
  { time: "2026-10-27 18:08:54", user: "admin", action: "Snapshot Created",  before: "—",                          after: "Community Day Close"           },
  { time: "2026-10-27 16:41:22", user: "admin", action: "Export Generated",  before: "—",                          after: "Persona export (all personas)" },
  { time: "2026-10-27 12:24:10", user: "admin", action: "Session Ingested",  before: "124 sessions (capacity v1)", after: "124 sessions (capacity v2)"    },
];

const SNAPSHOTS = [
  { name: "Day 0 — Pre-Event",       time: "Oct 26, 08:00", profiles: 7326, saved: 12481, reco: 89421,  active: 641  },
  { name: "Community Day Close",     time: "Oct 26, 18:00", profiles: 7891, saved: 18234, reco: 121342, active: 2481 },
  { name: "Before Tuesday Keynote",  time: "Oct 28, 08:00", profiles: 8124, saved: 21847, reco: 138492, active: 4812 },
  { name: "After Tuesday Keynote",   time: "Oct 28, 10:30", profiles: 8312, saved: 28491, reco: 162841, active: 6241 },
  { name: "Before Sandbox",          time: "Oct 28, 17:45", profiles: 8419, saved: 31284, reco: 178421, active: 5821 },
  { name: "Day 2 End",               time: "Oct 29, 22:00", profiles: 8641, saved: 34921, reco: 198421, active: 3124 },
];

// Future Firestore path (not wired):
// organizations/ibm/events/txc2026/admin_content/pages/{page_id}

interface ContentPageData {
  page: string;
  pageId: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  dest: string;
  secondaryCta: string;
  secondaryDest: string;
}

const CONTENT_DEFAULTS: ContentPageData[] = [
  {
    page: "Home",
    pageId: "home",
    kicker: "IBM TechXchange 2026",
    title: "See who is here, what is moving, and where opportunities are forming.",
    body: "Compass starts before the event and continues after you return home — prepare, meet, experience, and continue your momentum.",
    cta: "Build My Compass",
    dest: "/enroll",
    secondaryCta: "How Compass works",
    secondaryDest: "/explore",
  },
  {
    page: "Explore",
    pageId: "explore",
    kicker: "How Compass works",
    title: "How Compass helps you succeed.",
    body: "Five paths through TechXchange — each mapped to sessions, people, and outcomes aligned to what you came to achieve.",
    cta: "Browse sessions",
    dest: "/sessions",
    secondaryCta: "Build My Compass",
    secondaryDest: "/enroll",
  },
  {
    page: "Journey Maps",
    pageId: "journey-maps",
    kicker: "How Compass works",
    title: "How Compass helps you succeed.",
    body: "Journey maps live on Explore — milestone pathways for learning, certification, networking, and more.",
    cta: "Open Explore",
    dest: "/explore",
    secondaryCta: "View journey maps",
    secondaryDest: "/journey-maps",
  },
  {
    page: "Pulse",
    pageId: "pulse",
    kicker: "Event pulse",
    title: "The room is taking shape.",
    body: "Communities forming, conversations beginning, opportunities emerging across TechXchange.",
    cta: "View Pulse",
    dest: "/txc/pulse",
    secondaryCta: "Build My Compass",
    secondaryDest: "/enroll",
  },
  {
    page: "Sessions",
    pageId: "sessions",
    kicker: "Session intelligence",
    title: "Sessions that fit your week.",
    body: "Compass reads sessions against your profile and surfaces what to prioritize.",
    cta: "Browse all sessions",
    dest: "/sessions",
    secondaryCta: "Open My Compass",
    secondaryDest: "/experience",
  },
  {
    page: "Champions",
    pageId: "champions",
    kicker: "People intelligence",
    title: "Find your people before you arrive.",
    body: "Experts, mentors, peers, and community leaders matched to your interests.",
    cta: "See matched Champions",
    dest: "/champions",
    secondaryCta: "Build My Compass",
    secondaryDest: "/enroll",
  },
  {
    page: "Enroll",
    pageId: "enroll",
    kicker: "Build your Compass",
    title: "Tell Compass what matters to you.",
    body: "Your goals, tracks, and background shape every session score and champion match.",
    cta: "Build My Compass",
    dest: "/enroll",
    secondaryCta: "Sign in",
    secondaryDest: "/login",
  },
  {
    page: "My Compass",
    pageId: "experience",
    kicker: "My Compass",
    title: "TechXchange, built for you.",
    body: "Your personalized four-day plan, scored sessions, and Champion matches — all in one place.",
    cta: "Open My Compass",
    dest: "/experience",
    secondaryCta: "Refine My Compass",
    secondaryDest: "/enroll?mode=edit",
  },
];

interface AdminAccessUser {
  name: string;
  email: string;
  role: string;
  accessLevel: "Owner" | "Event Admin" | "Content Editor" | "Read Only";
  status: "Active" | "Invited";
  lastActive: string;
}

const ADMIN_ACCESS_USERS: AdminAccessUser[] = [
  {
    name: "Aravind Ragupathi",
    email: "aravind@media",
    role: "Owner / Product Admin",
    accessLevel: "Owner",
    status: "Active",
    lastActive: "Just now",
  },
  {
    name: "Angie Borman",
    email: "angie.borman@ibm.com",
    role: "Event Admin",
    accessLevel: "Event Admin",
    status: "Active",
    lastActive: "2 hours ago",
  },
];

interface TechCreditItem {
  id: string;
  label: string;
  enabled: boolean;
}

interface CreditsFormData {
  productName: string;
  productTagline: string;
  productCredit: string;
  createdBy: string;
  eventContext: string;
  technologyCredits: TechCreditItem[];
  aiVoiceCredit: string;
  copyrightNotice: string;
  confidentiality: string;
  version: string;
  contact: string;
  disclaimer: string;
}

const CREDITS_DEFAULTS: CreditsFormData = {
  productName: "Compass",
  productTagline: "AI-powered attendee intelligence platform",
  productCredit:
    "Compass is an AI-powered attendee intelligence platform designed to help TechXchange participants discover relevant sessions, people, communities, certifications, and live opportunities.",
  createdBy: "Aravind Ragupathi",
  eventContext:
    "Built for IBM TechXchange 2026 experience exploration and attendee journey personalization.",
  technologyCredits: [
    { id: "firebase", label: "Firebase", enabled: true },
    { id: "firestore", label: "Firestore", enabled: true },
    { id: "nextjs", label: "Next.js", enabled: true },
    { id: "typescript", label: "TypeScript", enabled: true },
    { id: "vercel", label: "Vercel", enabled: true },
    { id: "google-tts", label: "Google Cloud Text-to-Speech", enabled: true },
    { id: "carbon", label: "IBM Carbon Design inspiration", enabled: true },
    { id: "elevenlabs", label: "Future Voice Evaluation: ElevenLabs", enabled: true },
  ],
  aiVoiceCredit:
    "Ask Compass uses Google Cloud Text-to-Speech for spoken responses. Guide (Aoede) and Studio (Charon) voices are available for attendee selection.",
  copyrightNotice: "© 2026 Aravind Ragupathi. All rights reserved.",
  confidentiality:
    "Compass contains proprietary concepts, recommendation logic, attendee intelligence, and experience orchestration workflows.\n\nConfidential and proprietary.",
  version: "Compass Beta",
  contact: "aravind.media",
  disclaimer:
    "Compass is a product prototype and experience concept. All event data, recommendations, and integrations should be validated with official event systems before production use.",
};

const PERSONA_COLORS: Record<string, string> = {
  Developer: IBM.blue, Architect: IBM.purple, Executive: IBM.maroon,
  Champion: IBM.yellow, Student: IBM.cyan, Partner: IBM.red,
  Client: IBM.blueLight, IBMer: IBM.teal,
};
const PERSONA_ORDER = ["Developer","Architect","Executive","Champion","Student","Partner","Client","IBMer"];

// ─────────────────────────────────────────────────────────────────────────────
// AdminData types + empty state
// ─────────────────────────────────────────────────────────────────────────────

interface ConsentCounts {
  public_profile: number;
  linkedin: number;
  alumni: number;
  employer: number;
  university: number;
  sms: number;
  intro: number;
}

interface CapacityRow {
  session: string;
  capacity: number;
  saved: number;
  rec: number;
  risk: "HIGH" | "MED" | "LOW" | "WATCH";
  action: string;
}

interface ParticipantRow {
  id: string;
  name: string;
  persona: string;
  organization: string;
  industry: string;
  signalStatus: string;
  publicProfile: boolean;
  linkedinOptIn: boolean;
  savedSessions: number;
  savedPeople: number;
  meetRequests: number;
}

interface ChampionRow {
  id: string;
  name: string;
  title: string;
  organization: string;
  domains: string;
  attending: boolean;
  availableMeet: boolean;
  hasLinkedIn: boolean;
}

interface SessionRow {
  id: string;
  title: string;
  day: string;
  startTime: string;
  type: string;
  track: string;
  room: string;
  anchorEvent: string;
  capacity: number | null;
}

interface DataQuality {
  sessionsMissingDateTime: number;
  sessionsMissingRoom: number;
  championsMissingDomains: number;
  participantsMissingPersona: number;
  participantsMissingConsent: number;
  duplicateSessionTitles: number;
}

interface AdminData {
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  // Participants
  totalParticipants: number;
  compassBuilt: number;
  consentCounts: ConsentCounts;
  personaCounts: Record<string, number>;
  roleCounts: Record<string, number>;
  // Compass usage
  totalSessionsSaved: number;
  totalSessionsHidden: number;
  totalPeopleSaved: number;
  totalMeetRequests: number;
  totalHiddenPeople: number;
  totalViewedSessions: number;
  totalViewedPeople: number;
  hasUsageData: boolean;
  // Sessions
  totalSessions: number;
  sessionsByTrack: Record<string, number>;
  sessionsByType: Record<string, number>;
  capacitySessions: CapacityRow[];
  hasCapacityData: boolean;
  // Champions
  totalChampions: number;
  championsAttending: number;
  championsAvailableMeet: number;
  expertiseCounts: Record<string, number>;
  topChampions: { name: string; domains: string }[];
  // Drilldown rows
  participantRows: ParticipantRow[];
  championRows: ChampionRow[];
  sessionRows: SessionRow[];
  dq: DataQuality;
  // Extended analytics
  participantGoals: Record<string, number>;
  participantNeeds: Record<string, number>;
  participantCareerInterests: Record<string, number>;
  participantWithGoals: number;
  participantWithTracks: number;
  participantWithNetworking: number;
  healthScore: number;
  healthReasons: string[];
  championsByTrack: Record<string, number>;
  lowEngagementRows: ParticipantRow[];
  highEngagementRows: ParticipantRow[];
  topGoals: [string, number][];
  topNeeds: [string, number][];
  topCareerInterests: [string, number][];
}

function emptyData(): AdminData {
  return {
    loading: false, error: null, lastRefresh: null,
    totalParticipants: 0, compassBuilt: 0,
    consentCounts: { public_profile: 0, linkedin: 0, alumni: 0, employer: 0, university: 0, sms: 0, intro: 0 },
    personaCounts: {}, roleCounts: {},
    totalSessionsSaved: 0, totalSessionsHidden: 0,
    totalPeopleSaved: 0, totalMeetRequests: 0,
    totalHiddenPeople: 0, totalViewedSessions: 0, totalViewedPeople: 0,
    hasUsageData: false,
    totalSessions: 0, sessionsByTrack: {}, sessionsByType: {},
    capacitySessions: [], hasCapacityData: false,
    totalChampions: 0, championsAttending: 0, championsAvailableMeet: 0,
    expertiseCounts: {}, topChampions: [],
    participantRows: [], championRows: [], sessionRows: [],
    dq: { sessionsMissingDateTime: 0, sessionsMissingRoom: 0, championsMissingDomains: 0, participantsMissingPersona: 0, participantsMissingConsent: 0, duplicateSessionTitles: 0 },
    participantGoals: {}, participantNeeds: {}, participantCareerInterests: {},
    participantWithGoals: 0, participantWithTracks: 0, participantWithNetworking: 0,
    healthScore: 0, healthReasons: [],
    championsByTrack: {},
    lowEngagementRows: [], highEngagementRows: [],
    topGoals: [], topNeeds: [], topCareerInterests: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore compute helpers
// ─────────────────────────────────────────────────────────────────────────────

function readBool(d: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    if (d[k] === true) return true;
    const parts = k.split(".");
    if (parts.length === 2) {
      const parent = d[parts[0]];
      if (parent && typeof parent === "object" && (parent as Record<string, unknown>)[parts[1]] === true) return true;
    }
  }
  return false;
}

function normalizeDomain(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s.includes("ai") || s.includes("ml") || s.includes("machine") || s.includes("watson")) return "AI & Machine Learning";
  if (s.includes("cloud") || s.includes("hybrid")) return "Cloud & Hybrid";
  if (s.includes("red hat") || s.includes("openshift") || s.includes("open source") || s.includes("linux")) return "Red Hat & Open Source";
  if (s.includes("autom") || s.includes("rpa")) return "Automation";
  if (s.includes("data") || s.includes("analytic") || s.includes("sql")) return "Data & Analytics";
  if (s.includes("security") || s.includes("cyber") || s.includes("iam")) return "Security";
  return raw.trim();
}

type RawDoc = QueryDocumentSnapshot<DocumentData>;

function computeMetrics(parts: RawDoc[], sessions: RawDoc[], champions: RawDoc[]): AdminData {
  // ── Participants ─────────────────────────────────────────────────────────
  const totalParticipants = parts.length;
  let compassBuilt = 0;
  const cc: ConsentCounts = { public_profile: 0, linkedin: 0, alumni: 0, employer: 0, university: 0, sms: 0, intro: 0 };
  const personaCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  let ss_total = 0, hs_total = 0, vs_total = 0;
  let sp_total = 0, mp_total = 0, hp_total = 0, vp_total = 0;
  let hasUsageData = false;
  const sessionSaveMap: Record<string, number> = {};
  const participantRows: ParticipantRow[] = [];
  const participantGoals: Record<string, number> = {};
  const participantNeeds: Record<string, number> = {};
  const participantCareerInterests: Record<string, number> = {};
  let participantWithGoals = 0;
  let participantWithTracks = 0;
  let participantWithNetworking = 0;

  for (const doc of parts) {
    const d = (doc.data() ?? {}) as Record<string, unknown>;

    // Profile built: has non-empty persona (set during enrollment)
    const persona = typeof d.persona === "string" ? d.persona.trim() : "";
    if (persona) {
      compassBuilt++;
      personaCounts[persona] = (personaCounts[persona] ?? 0) + 1;
    }

    // Role
    const role = typeof d.role === "string" ? d.role.trim()
               : typeof d.primary_role === "string" ? d.primary_role.trim() : "";
    if (role) roleCounts[role] = (roleCounts[role] ?? 0) + 1;

    // Consent — support flat (consent_linkedin) and nested (consent.linkedin)
    if (readBool(d, "consent_public_profile", "consent.public_profile")) cc.public_profile++;
    if (readBool(d, "consent_linkedin", "consent.linkedin"))             cc.linkedin++;
    if (readBool(d, "consent_alumni", "consent.alumni", "consent_alumni_matching", "consent.alumni_matching")) cc.alumni++;
    if (readBool(d, "consent_employer", "consent.employer", "consent_employer_matching", "consent.employer_matching")) cc.employer++;
    if (readBool(d, "consent_university", "consent.university", "consent_university_matching")) cc.university++;
    if (readBool(d, "consent_sms", "consent.sms"))                       cc.sms++;
    if (readBool(d, "consent_intro", "consent.intro", "consent_intro_request", "consent.intro_request")) cc.intro++;

    // Usage arrays
    const saved_sessions  = Array.isArray(d.saved_sessions)  ? (d.saved_sessions  as string[]) : [];
    const hidden_sessions = Array.isArray(d.hidden_sessions) ? (d.hidden_sessions as string[]) : [];
    const viewed_sessions = Array.isArray(d.viewed_sessions) ? (d.viewed_sessions as string[]) : [];
    const saved_people    = Array.isArray(d.saved_people)    ? (d.saved_people    as string[]) : [];
    const meet_people     = Array.isArray(d.meet_people)     ? (d.meet_people     as string[]) : [];
    const hidden_people   = Array.isArray(d.hidden_people)   ? (d.hidden_people   as string[]) : [];
    const viewed_people   = Array.isArray(d.viewed_people)   ? (d.viewed_people   as string[]) : [];

    ss_total += saved_sessions.length;
    hs_total += hidden_sessions.length;
    vs_total += viewed_sessions.length;
    sp_total += saved_people.length;
    mp_total += meet_people.length;
    hp_total += hidden_people.length;
    vp_total += viewed_people.length;

    if (saved_sessions.length + hidden_sessions.length + saved_people.length + meet_people.length > 0) {
      hasUsageData = true;
    }

    for (const sid of saved_sessions) {
      sessionSaveMap[sid] = (sessionSaveMap[sid] ?? 0) + 1;
    }

    // Goals, needs, career interests (new analytics)
    const rawGoals = Array.isArray(d.goals) ? (d.goals as string[])
      : Array.isArray(d.learning_goals) ? (d.learning_goals as string[]) : [];
    const rawNeeds = Array.isArray(d.needs) ? (d.needs as string[])
      : Array.isArray(d.primary_needs) ? (d.primary_needs as string[]) : [];
    const rawCareer = Array.isArray(d.career_interests) ? (d.career_interests as string[])
      : Array.isArray(d.career_tracks) ? (d.career_tracks as string[])
      : typeof d.career_interest === "string" ? [d.career_interest] : [];
    const rawTracks = Array.isArray(d.preferred_tracks) ? (d.preferred_tracks as string[])
      : Array.isArray(d.tracks) ? (d.tracks as string[]) : [];

    if (rawGoals.length > 0) {
      participantWithGoals++;
      for (const g of rawGoals) { if (g) participantGoals[g] = (participantGoals[g] ?? 0) + 1; }
    }
    if (rawNeeds.length > 0) {
      for (const n of rawNeeds) { if (n) participantNeeds[n] = (participantNeeds[n] ?? 0) + 1; }
    }
    if (rawTracks.length > 0) participantWithTracks++;
    for (const ci of rawCareer) { if (ci) participantCareerInterests[ci] = (participantCareerInterests[ci] ?? 0) + 1; }

    // Participant row for drilldown table
    const pName = typeof d.display_name === "string" ? d.display_name
                : typeof d.name === "string" ? d.name
                : typeof d.first_name === "string"
                  ? `${d.first_name as string} ${typeof d.last_name === "string" ? d.last_name : ""}`.trim()
                : doc.id;
    const pOrg = typeof d.organization === "string" ? d.organization
               : typeof d.company === "string" ? d.company : "";
    const pIndustry = typeof d.industry === "string" ? d.industry : "";
    const pPublic = readBool(d, "consent_public_profile", "consent.public_profile");
    const pLinkedIn = readBool(d, "consent_linkedin", "consent.linkedin");
    const pHasActivity = saved_sessions.length + saved_people.length + meet_people.length > 0;
    const pSignal = pHasActivity ? "Active" : (persona ? "Enrolled" : "Pending");
    // Networking signal
    const hasNetworking = saved_people.length > 0 || meet_people.length > 0 ||
      readBool(d, "consent_intro", "consent.intro");
    if (hasNetworking) participantWithNetworking++;
    participantRows.push({
      id: doc.id, name: pName, persona, organization: pOrg, industry: pIndustry,
      signalStatus: pSignal, publicProfile: pPublic, linkedinOptIn: pLinkedIn,
      savedSessions: saved_sessions.length, savedPeople: saved_people.length, meetRequests: meet_people.length,
    });
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const sessionsByTrack: Record<string, number> = {};
  const sessionsByType:  Record<string, number> = {};
  const capacitySessions: CapacityRow[] = [];
  const sessionRows: SessionRow[] = [];
  let hasCapacityData = false;

  for (const doc of sessions) {
    const d = (doc.data() ?? {}) as Record<string, unknown>;
    const id = doc.id;

    const tracksRaw = Array.isArray(d.tracks) ? (d.tracks as string[])
      : typeof d.tracks === "string" ? d.tracks.split(",")
      : typeof d.track  === "string" ? [d.track]
      : [];
    for (const t of tracksRaw) {
      const tk = t.trim();
      if (tk) sessionsByTrack[tk] = (sessionsByTrack[tk] ?? 0) + 1;
    }

    const type = typeof d.type          === "string" ? d.type.trim()
               : typeof d.activity_type === "string" ? d.activity_type.trim()
               : typeof d.session_type  === "string" ? d.session_type.trim()
               : "";
    if (type) sessionsByType[type] = (sessionsByType[type] ?? 0) + 1;

    const cap = typeof d.capacity === "number" ? d.capacity : 0;
    if (cap > 0) {
      hasCapacityData = true;
      const saved = sessionSaveMap[id] ?? 0;
      const pct = saved / cap;
      const risk: CapacityRow["risk"] =
        pct >= 1.0 ? "HIGH" : pct >= 0.8 ? "MED" : pct >= 0.5 ? "WATCH" : "LOW";
      const action =
        risk === "HIGH"  ? "Open overflow room" :
        risk === "MED"   ? "Monitor closely"    :
        risk === "WATCH" ? "Monitor capacity"   : "No action needed";
      capacitySessions.push({
        session: typeof d.title === "string" ? d.title : id,
        capacity: cap, saved, rec: 0, risk, action,
      });
    }

    // Session row for drilldown table
    const sTitle = typeof d.title === "string" ? d.title : id;
    const sDay = typeof d.day === "string" ? d.day
               : typeof d.date === "string" ? d.date : "";
    const sTime = typeof d.start_time === "string" ? d.start_time
                : typeof d.time === "string" ? d.time : "";
    const sRoom = typeof d.room === "string" ? d.room
                : typeof d.location === "string" ? d.location : "";
    const sAnchor = typeof d.anchor_event === "string" ? d.anchor_event : "";
    const sTrack = tracksRaw[0]?.trim() ?? "";
    sessionRows.push({
      id, title: sTitle, day: sDay, startTime: sTime, type, track: sTrack,
      room: sRoom, anchorEvent: sAnchor, capacity: cap > 0 ? cap : null,
    });
  }

  capacitySessions.sort((a, b) => {
    const o: Record<string, number> = { HIGH: 0, MED: 1, WATCH: 2, LOW: 3 };
    return (o[a.risk] ?? 4) - (o[b.risk] ?? 4);
  });

  // ── Champions ──────────────────────────────────────────────────────────────
  const totalChampions = champions.length;
  let championsAttending = 0;
  let championsAvailableMeet = 0;
  const expertiseCounts: Record<string, number> = {};
  const topChampions: { name: string; domains: string }[] = [];
  const championRows: ChampionRow[] = [];
  const championsByTrack: Record<string, number> = {};

  for (const doc of champions) {
    const d = (doc.data() ?? {}) as Record<string, unknown>;

    if (readBool(d, "attending", "is_attending") ||
        d.attendance === true || d.attendance === "attending") {
      championsAttending++;
    }
    if (readBool(d, "available_for_meet", "open_to_meeting", "open_for_meeting", "available")) {
      championsAvailableMeet++;
    }

    const rawDomains: string[] = Array.isArray(d.domains)   ? (d.domains   as string[])
      : typeof d.domains   === "string" ? d.domains.split(",")
      : Array.isArray(d.expertise) ? (d.expertise as string[])
      : typeof d.expertise === "string" ? d.expertise.split(",")
      : [];

    const cleanDomains = rawDomains.map(r => normalizeDomain(r)).filter(Boolean);
    for (const dm of cleanDomains) {
      expertiseCounts[dm] = (expertiseCounts[dm] ?? 0) + 1;
      championsByTrack[dm] = (championsByTrack[dm] ?? 0) + 1;
    }
    // Champion tracks field
    const champTracks = Array.isArray(d.tracks) ? (d.tracks as string[])
      : typeof d.track === "string" ? [d.track] : [];
    for (const ct of champTracks) {
      const ctk = ct.trim();
      if (ctk) championsByTrack[ctk] = (championsByTrack[ctk] ?? 0) + 1;
    }

    const name = typeof d.display_name === "string" ? d.display_name
               : typeof d.name         === "string" ? d.name
               : doc.id;
    topChampions.push({ name, domains: cleanDomains.slice(0, 2).join(", ") || "—" });

    const cTitle = typeof d.title === "string" ? d.title : "";
    const cOrg = typeof d.organization === "string" ? d.organization
               : typeof d.company === "string" ? d.company : "";
    const cHasLinkedIn = typeof d.linkedin === "string" && d.linkedin.trim() !== "";
    const cAttending = readBool(d, "attending", "is_attending") ||
      d.attendance === true || d.attendance === "attending";
    const cAvailMeet = readBool(d, "available_for_meet", "open_to_meeting", "open_for_meeting", "available");
    championRows.push({
      id: doc.id, name, title: cTitle, organization: cOrg,
      domains: cleanDomains.join(", ") || "—",
      attending: cAttending, availableMeet: cAvailMeet, hasLinkedIn: cHasLinkedIn,
    });
  }

  // If no "attending" flag on any doc, default: all champions attending
  if (championsAttending === 0 && totalChampions > 0) {
    championsAttending = totalChampions;
  }

  // ── Data Quality ─────────────────────────────────────────────────────────────
  const titleCounts: Record<string, number> = {};
  for (const s of sessionRows) {
    if (s.title) titleCounts[s.title] = (titleCounts[s.title] ?? 0) + 1;
  }
  const dq: DataQuality = {
    sessionsMissingDateTime:   sessionRows.filter(s => {
      const t = s.type.toLowerCase();
      const isCert = t === "certification" || t.includes("certification exam");
      return !isCert && !s.day && !s.startTime;
    }).length,
    sessionsMissingRoom:       sessionRows.filter(s => {
      const t = s.type.toLowerCase();
      const isCert = t === "certification" || t.includes("certification exam");
      return !isCert && !s.room;
    }).length,
    championsMissingDomains:   championRows.filter(c => c.domains === "—").length,
    participantsMissingPersona: participantRows.filter(p => !p.persona).length,
    participantsMissingConsent: participantRows.filter(
      p => !p.publicProfile && !p.linkedinOptIn
    ).length,
    duplicateSessionTitles:    Object.values(titleCounts).filter(c => c > 1).length,
  };

  // ── Health score (0-100) ────────────────────────────────────────────────────
  const base = Math.max(totalParticipants, 1);
  const profilePct  = compassBuilt / base;
  const consentN    = participantRows.filter(p => p.publicProfile || p.linkedinOptIn).length;
  const consentPct  = consentN / base;
  const networkPct  = participantWithNetworking / base;
  const goalsPct    = participantWithGoals / base;
  const healthScore = Math.round(
    profilePct  * 40 +
    consentPct  * 20 +
    networkPct  * 20 +
    goalsPct    * 20
  );
  const healthReasons: string[] = [];
  if (profilePct < 0.5)  healthReasons.push(`Only ${Math.round(profilePct*100)}% of attendees have a Compass profile`);
  if (consentPct < 0.4)  healthReasons.push(`Low consent participation (${Math.round(consentPct*100)}%)`);
  if (networkPct < 0.3)  healthReasons.push(`Networking signals weak (${Math.round(networkPct*100)}% engaged)`);
  if (goalsPct < 0.3)    healthReasons.push(`Only ${Math.round(goalsPct*100)}% have set learning goals`);
  if (healthReasons.length === 0 && healthScore < 80)
    healthReasons.push("Overall engagement is below target — promote Compass onboarding");

  // ── Engagement tiers ─────────────────────────────────────────────────────────
  const engagementScore = (r: ParticipantRow) =>
    r.savedSessions * 1 + r.savedPeople * 2 + r.meetRequests * 3;
  const sortedByEngagement = [...participantRows].sort((a, b) => engagementScore(b) - engagementScore(a));
  const highEngagementRows = sortedByEngagement.slice(0, 10);
  const lowEngagementRows  = [...participantRows]
    .filter(r => engagementScore(r) === 0 && r.signalStatus !== "Pending")
    .slice(0, 10);

  // ── Top lists ─────────────────────────────────────────────────────────────────
  const topGoals = Object.entries(participantGoals).sort((a,b) => b[1]-a[1]).slice(0,10) as [string,number][];
  const topNeeds = Object.entries(participantNeeds).sort((a,b) => b[1]-a[1]).slice(0,10) as [string,number][];
  const topCareerInterests = Object.entries(participantCareerInterests).sort((a,b) => b[1]-a[1]).slice(0,10) as [string,number][];

  return {
    loading: false, error: null, lastRefresh: new Date(),
    totalParticipants, compassBuilt, consentCounts: cc,
    personaCounts, roleCounts,
    totalSessionsSaved: ss_total, totalSessionsHidden: hs_total,
    totalPeopleSaved: sp_total, totalMeetRequests: mp_total,
    totalHiddenPeople: hp_total, totalViewedSessions: vs_total,
    totalViewedPeople: vp_total, hasUsageData,
    totalSessions, sessionsByTrack, sessionsByType,
    capacitySessions, hasCapacityData,
    totalChampions, championsAttending, championsAvailableMeet,
    expertiseCounts, topChampions: topChampions.slice(0, 5),
    participantRows, championRows, sessionRows, dq,
    participantGoals, participantNeeds, participantCareerInterests,
    participantWithGoals, participantWithTracks, participantWithNetworking,
    healthScore, healthReasons, championsByTrack,
    lowEngagementRows, highEngagementRows,
    topGoals, topNeeds, topCareerInterests,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useAdminData hook
// ─────────────────────────────────────────────────────────────────────────────

function useAdminData(enabled: boolean) {
  const [data, setData] = useState<AdminData>({ ...emptyData(), loading: false });

  const load = useCallback(async () => {
    if (!enabled) return;
    setData(d => ({ ...d, loading: true, error: null }));
    try {
      const [pSnap, sSnap, cSnap] = await Promise.all([
        getDocs(collection(db, BASE + "/participants")),
        getDocs(collection(db, BASE + "/sessions")),
        getDocs(collection(db, BASE + "/champions")),
      ]);
      setData(computeMetrics(pSnap.docs, sSnap.docs, cSnap.docs));
    } catch (err) {
      setData(d => ({ ...d, loading: false, error: String(err) }));
    }
  }, [enabled]);

  useEffect(() => { void load(); }, [load]);

  return { data, reload: load };
}

// ─────────────────────────────────────────────────────────────────────────────
// Atom components
// ─────────────────────────────────────────────────────────────────────────────

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <Kicker>{kicker}</Kicker>
      <h2 style={{ color: S.text, fontSize: "1.65rem", fontWeight: 520,
        letterSpacing: "-0.035em", margin: "0 0 6px" }}>{title}</h2>
      {sub && <p style={{ color: S.muted, fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function Panel({ children, style, noPad }: { children: ReactNode; style?: CSSProperties; noPad?: boolean }) {
  return (
    <div style={{
      background: S.panel,
      border: `1px solid ${S.line}`,
      padding: noPad ? 0 : "20px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: S.muted, fontSize: "0.68rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

function HBar({ label, value, maxVal, color, suffix = "" }: {
  label: string; value: number; maxVal: number; color: string; suffix?: string;
}) {
  const pct = maxVal > 0 ? Math.min(100, Math.round((value / maxVal) * 100)) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "baseline", marginBottom: "5px" }}>
        <span style={{ fontSize: "0.84rem", color: S.soft }}>{label}</span>
        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: S.text,
          fontVariantNumeric: "tabular-nums" }}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div style={{ height: "6px", background: S.line, borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color,
          transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

function Donut({ pct, color, size = 68 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={S.line} strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt" />
    </svg>
  );
}

function Risk({ level }: { level: CapacityRow["risk"] }) {
  const cfg = {
    HIGH:  { bg: "rgba(218,30,40,0.12)",  border: "#da1e28", color: "#ff8389"  },
    MED:   { bg: "rgba(241,194,27,0.10)", border: "#f1c21b", color: "#f1c21b"  },
    LOW:   { bg: "rgba(36,161,72,0.10)",  border: "#24a148", color: "#42be65"  },
    WATCH: { bg: "rgba(255,131,43,0.10)", border: "#ff832b", color: "#ff832b"  },
  }[level];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px",
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em" }}>
      {level}
    </span>
  );
}

function LoadingShimmer({ label = "Loading from Firestore…" }: { label?: string }) {
  return (
    <div style={{ padding: "32px", textAlign: "center" as const, color: S.dim, fontSize: "0.84rem" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: S.accent,
        display: "inline-block", marginRight: "8px", opacity: 0.7 }} />
      {label}
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p style={{ color: S.dim, fontSize: "0.8rem", fontStyle: "italic",
      margin: "12px 0 0", padding: "10px 14px",
      border: `1px dashed ${S.line}` }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Login
// ─────────────────────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (checkCredentials(username, password)) { persistSession(); onSuccess(); }
      else { setError("The username or password you entered is incorrect."); setLoading(false); }
    }, 400);
  }, [username, password, onSuccess]);

  const field: CSSProperties = { width: "100%", height: "40px", padding: "0 12px",
    background: "#262626", border: `1px solid ${S.line}`, color: S.text,
    fontSize: "0.92rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const lbl: CSSProperties = { display: "block", color: S.muted, fontSize: "0.78rem",
    fontWeight: 600, marginBottom: "6px" };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: S.panel,
        border: `1px solid ${S.line}`, borderTop: `3px solid ${IBM.blue}`,
        padding: "40px 36px 36px" }}>
        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: S.muted, fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>IBM</p>
          <h1 style={{ color: S.text, fontSize: "1.35rem", fontWeight: 600,
            letterSpacing: "-0.025em", margin: "0 0 4px" }}>Compass</h1>
          <p style={{ color: S.muted, fontSize: "0.88rem", margin: 0 }}>Event Intelligence Center</p>
        </div>
        <p style={{ color: S.soft, fontSize: "0.92rem", margin: "0 0 24px", fontWeight: 500 }}>
          Administrator sign-in
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={lbl} htmlFor="adm-user">Username</label>
            <input id="adm-user" type="text" autoComplete="username" value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              style={field} required />
          </div>
          <div>
            <label style={lbl} htmlFor="adm-pass">Password</label>
            <input id="adm-pass" type="password" autoComplete="current-password" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              style={field} required />
          </div>
          {error && <p style={{ color: "#ff8389", fontSize: "0.82rem", margin: 0,
            background: "rgba(218,30,40,0.08)", border: "1px solid rgba(218,30,40,0.3)",
            padding: "8px 12px" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ height: "44px",
            background: loading ? "#4c4c4c" : IBM.blue, color: "#fff", border: "none",
            fontSize: "0.92rem", fontWeight: 650, fontFamily: "inherit",
            cursor: loading ? "default" : "pointer", marginTop: "8px" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${S.line}` }}>
          <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0, lineHeight: 1.5 }}>
            IBM SSO / IBMid access coming soon. Authorised event operations staff only.
          </p>
        </div>
      </div>
      <p style={{ color: S.dim, fontSize: "0.72rem", marginTop: "20px" }}>
        Compass v{COMPASS_VERSION} · IBM TechXchange 2026
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Layout
// ─────────────────────────────────────────────────────────────────────────────

function AdminLayout({ children, view, setView, onLogout, onRefresh, lastRefresh, loading }: {
  children: ReactNode; view: AdminView; setView: (v: AdminView) => void;
  onLogout: () => void; onRefresh: () => void;
  lastRefresh: Date | null; loading: boolean;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", background: S.bg,
      overflow: "hidden", fontFamily: "IBM Plex Sans, system-ui, sans-serif" }}>

      {/* Sidebar — grouped operator navigation */}
      <aside style={{ width: "248px", background: S.sideBg, borderRight: `1px solid ${S.line}`,
        display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${S.line}` }}>
          <p style={{ color: S.accent, fontSize: "0.62rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 3px" }}>Compass</p>
          <p style={{ color: S.text, fontSize: "1rem", fontWeight: 650,
            margin: "0 0 2px", letterSpacing: "-0.02em" }}>Operator Console</p>
          <p style={{ color: S.dim, fontSize: "0.72rem", margin: "0 0 10px" }}>IBM TechXchange 2026</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "0.62rem", color: IBM.green, fontWeight: 650,
            letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%",
              background: IBM.green, display: "inline-block" }} />
            Live
          </span>
        </div>

        <nav style={{ flex: 1, padding: "8px 0 12px" }} aria-label="Admin navigation">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? "4px" : 0 }}>
              <div style={{ padding: "14px 20px 6px" }}>
                <p style={{
                  color: S.soft, fontSize: "0.62rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px",
                }}>
                  {group.label}
                </p>
                <p style={{
                  color: S.dim, fontSize: "0.68rem", margin: 0,
                  lineHeight: 1.4, maxWidth: "200px",
                }}>
                  {group.description}
                </p>
              </div>
              {group.items.map(item => {
                const active = view === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setView(item.id)} style={{
                    width: "100%", padding: "8px 20px 8px 24px", border: "none",
                    borderLeft: `3px solid ${active ? S.accent : "transparent"}`,
                    background: active ? "rgba(120,169,255,0.07)" : "transparent",
                    color: active ? S.accent : S.muted,
                    fontSize: "0.84rem", fontFamily: "inherit", cursor: "pointer",
                    display: "flex", alignItems: "center",
                    fontWeight: active ? 600 : 400, textAlign: "left" as const,
                    transition: "background 0.1s, color 0.1s",
                  }}>
                    {item.label}
                  </button>
                );
              })}
              {gi < NAV_GROUPS.length - 1 && (
                <hr style={{ ...A.divider, margin: "10px 20px 0" }} />
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${S.line}` }}>
          <p style={{ color: S.dim, fontSize: "0.7rem", margin: "0 0 10px" }}>v{COMPASS_VERSION}</p>
          <button type="button" onClick={onLogout} style={{ width: "100%", padding: "7px 12px",
            border: `1px solid ${S.line}`, background: "transparent", color: S.muted,
            fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer", textAlign: "left" as const }}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "52px", background: S.bg, borderBottom: `1px solid ${S.line}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
            <h1 style={{ color: S.text, fontSize: "0.9rem", fontWeight: 650,
              margin: 0, letterSpacing: "-0.01em" }}>Event Intelligence Center</h1>
            <span style={{ color: S.dim, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
              {findNavGroup(view)?.label ?? "Admin"}
              <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
              {findNavItem(view)?.label ?? view}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {lastRefresh && (
              <span style={{ color: S.dim, fontSize: "0.72rem" }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button type="button" onClick={onRefresh} disabled={loading}
              style={{ padding: "5px 12px", border: `1px solid ${S.line}`,
                background: "transparent", color: loading ? S.dim : S.muted,
                fontSize: "0.76rem", fontFamily: "inherit", cursor: loading ? "default" : "pointer" }}>
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>Atlanta · Oct 26–30</p>
          </div>
        </div>
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>{children}</main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard view — Firestore-powered
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const total = data.totalParticipants;
  const base  = Math.max(total, 1);

  const kpiCards = [
    { label: "Total Participants",     value: total.toLocaleString(),                warn: false },
    { label: "Compass Profiles Built", value: data.compassBuilt.toLocaleString(),    warn: false },
    { label: "Not Built Compass",      value: (total - data.compassBuilt).toLocaleString(), warn: true },
    { label: "Sessions Saved",         value: data.hasUsageData ? data.totalSessionsSaved.toLocaleString() : "—", warn: false },
    { label: "People Saved",           value: data.hasUsageData ? data.totalPeopleSaved.toLocaleString()   : "—", warn: false },
    { label: "Meet Requested",         value: data.hasUsageData ? data.totalMeetRequests.toLocaleString()  : "—", warn: false },
    { label: "Champions",              value: data.totalChampions.toLocaleString(),  warn: false },
  ];

  const cc = data.consentCounts;
  const consentSnap = [
    { label: "Public profile",   pct: Math.round((cc.public_profile / base) * 100), color: IBM.blue     },
    { label: "LinkedIn",         pct: Math.round((cc.linkedin        / base) * 100), color: IBM.purple   },
    { label: "Alumni matching",  pct: Math.round((cc.alumni          / base) * 100), color: IBM.cyan     },
    { label: "Employer match",   pct: Math.round((cc.employer        / base) * 100), color: IBM.teal     },
    { label: "University match", pct: Math.round((cc.university      / base) * 100), color: IBM.blueLight },
    { label: "SMS opt-in",       pct: Math.round((cc.sms             / base) * 100), color: IBM.yellow   },
    { label: "Intro request",    pct: Math.round((cc.intro           / base) * 100), color: IBM.green    },
  ];

  const personaSnap = PERSONA_ORDER
    .filter(p => (data.personaCounts[p] ?? 0) > 0)
    .map(p => ({ label: p, value: data.personaCounts[p] ?? 0, color: PERSONA_COLORS[p] ?? IBM.blue }));
  const personaMax = personaSnap.reduce((m, p) => Math.max(m, p.value), 0);

  const compassValueRows = [
    { label: "Profiles Created",          value: data.compassBuilt.toLocaleString()                                                },
    { label: "Sessions Saved",            value: data.hasUsageData ? data.totalSessionsSaved.toLocaleString()  : "—"               },
    { label: "People Saved",              value: data.hasUsageData ? data.totalPeopleSaved.toLocaleString()    : "—"               },
    { label: "Meet Requests",             value: data.hasUsageData ? data.totalMeetRequests.toLocaleString()   : "—"               },
    { label: "Sessions Hidden",           value: data.hasUsageData ? data.totalSessionsHidden.toLocaleString() : "—"               },
    { label: "Views (sessions)",          value: data.hasUsageData ? data.totalViewedSessions.toLocaleString() : "—"               },
    { label: "Views (people)",            value: data.hasUsageData ? data.totalViewedPeople.toLocaleString()   : "—"               },
    { label: "Total Sessions in Catalog", value: data.totalSessions.toLocaleString()                                               },
    { label: "Total Champions",           value: data.totalChampions.toLocaleString()                                              },
  ];

  const execInsights = [
    {
      question: "How many Champions registered?",
      count: data.totalChampions > 0 ? data.totalChampions.toLocaleString() : "—",
      note: data.totalChampions > 0 ? "Champions registered in program." : "Champions not yet loaded.",
      color: IBM.blue, live: false,
    },
    {
      question: "How many have not built Compass?",
      count: (total - data.compassBuilt).toLocaleString(),
      note: total > 0 ? `${Math.round(((total - data.compassBuilt) / base) * 100)}% yet to activate.` : "No participants yet.",
      color: IBM.yellow, live: false,
    },
    {
      question: "How many clients want AI roadmap sessions?",
      count: "—",
      note: "Requires session-preference tag filter. Not yet computed.",
      color: IBM.blue, live: false,
    },
    {
      question: "How many architects are interested in Red Hat?",
      count: data.personaCounts["Architect"] ? (data.personaCounts["Architect"]).toLocaleString() : "—",
      note: data.personaCounts["Architect"]
        ? `${data.personaCounts["Architect"]} architects registered. Domain interest requires session-tag filter.`
        : "Requires session-preference cross-reference.",
      color: IBM.red, live: false,
    },
    {
      question: "How many students want mentoring?",
      count: data.personaCounts["Student"] ? (data.personaCounts["Student"]).toLocaleString() : "—",
      note: data.personaCounts["Student"]
        ? `${data.personaCounts["Student"]} students registered. Mentoring intent requires goal filter.`
        : "Requires goal-tag filter.",
      color: IBM.purple, live: false,
    },
    {
      question: "How many partners want customer stories?",
      count: data.personaCounts["Partner"] ? (data.personaCounts["Partner"]).toLocaleString() : "—",
      note: data.personaCounts["Partner"]
        ? `${data.personaCounts["Partner"]} partners registered.`
        : "Requires goal-tag filter.",
      color: IBM.cyan, live: false,
    },
    {
      question: "Total registered participants?",
      count: total.toLocaleString(),
      note: total > 0
        ? `${data.compassBuilt} have built Compass (${Math.round((data.compassBuilt / base) * 100)}% adoption).`
        : "No participants yet.",
      color: IBM.green, live: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* KPI Row */}
      <div>
        <Kicker>Live metrics · from Firestore</Kicker>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
          gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
          {kpiCards.map(k => (
            <div key={k.label} style={{ background: S.panel, padding: "20px 18px" }}>
              <p style={{ color: S.muted, fontSize: "0.72rem", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em",
                margin: "0 0 10px", lineHeight: 1.3 }}>
                {k.label}
              </p>
              <span style={{ fontSize: "2.2rem", fontWeight: 520,
                letterSpacing: "-0.04em",
                color: k.warn ? IBM.yellow : S.text,
                lineHeight: 1, display: "block" }}>
                {k.value}
              </span>
            </div>
          ))}
        </div>
        {!data.hasUsageData && total > 0 && (
          <EmptyNote>Sessions saved / people saved / meet requests: no activity captured yet — arrays will populate as attendees use Compass.</EmptyNote>
        )}
      </div>

      {/* Executive Insights */}
      <div>
        <SectionHead kicker="Executive Insights" title="What matters right now."
          sub="Plain language signals for leadership, operations, and community teams." />
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {execInsights.map(ins => (
            <Panel key={ins.question} style={{ borderTop: `3px solid ${ins.color}` }}>
              <p style={{ color: S.muted, fontSize: "0.78rem", margin: "0 0 14px", lineHeight: 1.4 }}>
                {ins.question}
              </p>
              <div style={{ display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 520,
                  letterSpacing: "-0.05em", color: ins.color, lineHeight: 1 }}>
                  {ins.count}
                </span>
                {ins.live && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px",
                    fontSize: "0.68rem", color: IBM.green, fontWeight: 650 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%",
                      background: IBM.green, display: "inline-block" }} />
                    LIVE
                  </span>
                )}
              </div>
              <p style={{ color: S.dim, fontSize: "0.78rem", margin: 0,
                fontStyle: "italic", lineHeight: 1.4 }}>
                &ldquo;{ins.note}&rdquo;
              </p>
            </Panel>
          ))}
        </div>
      </div>

      {/* Compass Value */}
      <div>
        <SectionHead kicker="Compass Value" title="Proving the platform."
          sub="Direct outputs of Compass — trackable, reportable, real." />
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
          {compassValueRows.map(m => (
            <div key={m.label} style={{ background: S.panel, padding: "18px 20px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0, lineHeight: 1.3 }}>
                {m.label}
              </p>
              <p style={{ fontSize: "1.55rem", fontWeight: 520, letterSpacing: "-0.03em",
                color: m.value === "—" ? S.dim : S.text, margin: 0, lineHeight: 1, flexShrink: 0 }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Persona + Consent row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <Panel>
          <PanelLabel>Persona Adoption · Registered</PanelLabel>
          {personaSnap.length > 0
            ? personaSnap.map(p => (
                <HBar key={p.label} label={p.label} value={p.value} maxVal={personaMax} color={p.color} />
              ))
            : <EmptyNote>No persona data yet — participants populate on enrollment.</EmptyNote>
          }
        </Panel>
        <Panel>
          <PanelLabel>Consent Participation %</PanelLabel>
          {total > 0
            ? consentSnap.map(c => (
                <HBar key={c.label} label={c.label} value={c.pct} maxVal={100} color={c.color} suffix="%" />
              ))
            : <EmptyNote>No consent data yet.</EmptyNote>
          }
        </Panel>
      </div>

      {/* Build Info */}
      <Panel style={{ borderLeft: `3px solid ${IBM.blue}` }}>
        <PanelLabel>Build Information</PanelLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 650, color: S.text, letterSpacing: "-0.02em" }}>Compass</span>
          <span style={{ fontSize: "0.78rem", color: S.muted, fontVariantNumeric: "tabular-nums" }}>v{COMPASS_VERSION}</span>
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px 32px" }}>
          {[
            { label: "Product Creator",          items: ["Aravind Ragupathi"],                              color: S.soft  },
            { label: "Status",                   items: ["Prototype · Internal Demo"],                     color: IBM.yellow },
            { label: "Built Using",              items: ["IBM technologies including Bob","Firebase","Next.js","TypeScript"], color: S.muted },
            { label: "AI Development Assistants",items: ["OpenAI ChatGPT","Anthropic Claude Sonnet"],      color: S.muted },
            { label: "Voice Services",           items: ["ElevenLabs (planned)"],                          color: S.muted },
          ].map(block => (
            <div key={block.label}>
              <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 4px" }}>{block.label}</p>
              {block.items.map(t => (
                <p key={t} style={{ color: block.color, fontSize: "0.82rem", margin: "0 0 2px" }}>
                  {block.items.length > 1 ? `· ${t}` : t}
                </p>
              ))}
            </div>
          ))}
        </div>
        <p style={{ color: S.dim, fontSize: "0.72rem", margin: "18px 0 0",
          paddingTop: "14px", borderTop: `1px solid ${S.line}` }}>
          Parts of Compass were accelerated using IBM Bob.
        </p>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Personas view — Firestore-powered
// ─────────────────────────────────────────────────────────────────────────────

function PersonasView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const total = data.totalParticipants;
  const knownPersonas = PERSONA_ORDER;
  const extraPersonas = Object.keys(data.personaCounts).filter(p => !knownPersonas.includes(p));
  const allPersonas   = [...knownPersonas, ...extraPersonas];
  const activePersonas = allPersonas.filter(p => (data.personaCounts[p] ?? 0) > 0);
  const maxReg = activePersonas.reduce((m, p) => Math.max(m, data.personaCounts[p] ?? 0), 0);

  return (
    <div>
      <SectionHead kicker="Persona Intelligence" title="Who is at TechXchange 2026."
        sub="Registered attendees broken down by persona — computed from Firestore participants." />

      {activePersonas.length === 0 && (
        <Panel>
          <EmptyNote>No persona data yet. Participants will appear here once they enroll with a persona.</EmptyNote>
        </Panel>
      )}

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
        {activePersonas.map(label => {
          const registered = data.personaCounts[label] ?? 0;
          if (registered === 0) return null;
          const color = PERSONA_COLORS[label] ?? IBM.blue;
          const pctOfTotal = total > 0 ? Math.round((registered / total) * 100) : 0;
          return (
            <Panel key={label} style={{ borderTop: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <p style={{ color: S.text, fontSize: "1.05rem", fontWeight: 600,
                    margin: "0 0 3px", letterSpacing: "-0.01em" }}>{label}</p>
                  <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0 }}>
                    {pctOfTotal}% of all participants
                  </p>
                </div>
                <span style={{ fontSize: "1.8rem", fontWeight: 520,
                  letterSpacing: "-0.04em", color, lineHeight: 1 }}>
                  {registered.toLocaleString()}
                </span>
              </div>
              <HBar label="Share of total" value={registered} maxVal={maxReg} color={color} />
              <div style={{ marginTop: "12px", paddingTop: "12px",
                borderTop: `1px solid ${S.line}`, display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", margin: "0 0 2px" }}>Registered</p>
                  <p style={{ color: S.soft, fontSize: "0.92rem", fontWeight: 600, margin: 0 }}>
                    {registered.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", margin: "0 0 2px" }}>% of event</p>
                  <p style={{ color: S.soft, fontSize: "0.92rem", fontWeight: 600, margin: 0 }}>
                    {pctOfTotal}%
                  </p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {Object.keys(data.roleCounts).length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <SectionHead kicker="Role Breakdown" title="Registration roles."
            sub="Roles from participant records." />
          <Panel>
            <PanelLabel>By Role</PanelLabel>
            {Object.entries(data.roleCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([role, count]) => (
                <HBar key={role} label={role} value={count}
                  maxVal={Object.values(data.roleCounts).reduce((m, v) => Math.max(m, v), 0)}
                  color={IBM.blueLight} />
              ))}
          </Panel>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Champions view — Firestore-powered
// ─────────────────────────────────────────────────────────────────────────────

function ChampionsView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const total = data.totalChampions;
  const notUsing = total > 0 ? total - data.championsAttending : 0;

  const championMetrics = [
    { label: "Champions Registered",  value: total,                        color: IBM.blue   },
    { label: "Attending",             value: data.championsAttending,      color: IBM.green  },
    { label: "Available for 1:1",     value: data.championsAvailableMeet,  color: IBM.purple },
    { label: "Not Using Compass",     value: notUsing,                     color: IBM.yellow },
  ];

  const expertiseSorted = Object.entries(data.expertiseCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const expertiseMax = expertiseSorted.reduce((m, [, v]) => Math.max(m, v), 0);
  const expertiseColors = [IBM.blue, IBM.blueLight, IBM.red, IBM.purple, IBM.cyan, IBM.maroon, IBM.teal, IBM.orange];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Champion Intelligence"
        title="The people who make TechXchange extraordinary."
        sub="Registrations, availability, and expertise breakdown — from Firestore champions collection." />

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
        {championMetrics.map(m => (
          <div key={m.label} style={{ background: S.panel, padding: "18px 16px" }}>
            <p style={{ color: S.muted, fontSize: "0.72rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 8px", lineHeight: 1.3 }}>{m.label}</p>
            <span style={{ fontSize: "2.1rem", fontWeight: 520,
              letterSpacing: "-0.04em", color: m.color, lineHeight: 1 }}>
              {m.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
        {[
          { q: "How many attending?",           v: data.championsAttending, sub: `of ${total} registered`,       color: IBM.blue   },
          { q: "Available for 1:1 meeting?",    v: data.championsAvailableMeet, sub: "open_to_meeting = true",   color: IBM.purple },
          { q: "Champions not using Compass?",  v: notUsing, sub: total > 0 ? `${Math.round((notUsing / Math.max(total, 1)) * 100)}% gap` : "—", color: IBM.yellow },
          { q: "Total in program?",             v: total, sub: "from champions collection",                       color: IBM.cyan   },
        ].map(item => (
          <Panel key={item.q} style={{ borderTop: `3px solid ${item.color}` }}>
            <p style={{ color: S.muted, fontSize: "0.78rem", margin: "0 0 12px", lineHeight: 1.4 }}>
              {item.q}
            </p>
            <p style={{ fontSize: "2.4rem", fontWeight: 520,
              letterSpacing: "-0.05em", color: item.color, margin: "0 0 4px", lineHeight: 1 }}>
              {item.v > 0 ? item.v.toLocaleString() : "—"}
            </p>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>{item.sub}</p>
          </Panel>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <Panel>
          <PanelLabel>Top Expertise Areas</PanelLabel>
          {expertiseSorted.length > 0
            ? expertiseSorted.map(([area, count], i) => (
                <HBar key={area} label={area} value={count}
                  maxVal={expertiseMax} color={expertiseColors[i % expertiseColors.length]} />
              ))
            : <EmptyNote>No expertise/domain data found in champions collection. Add a &ldquo;domains&rdquo; or &ldquo;expertise&rdquo; field to each champion doc.</EmptyNote>
          }
        </Panel>

        <Panel>
          <PanelLabel>Champions</PanelLabel>
          {data.topChampions.length > 0 ? (
            <>
              <div style={{ display: "grid", gap: "1px", background: S.line, marginBottom: "16px" }}>
                {data.topChampions.map((c, i) => (
                  <div key={c.name} style={{ background: S.bg, padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: S.dim, fontSize: "0.76rem",
                      fontVariantNumeric: "tabular-nums", width: "16px", flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <div>
                      <p style={{ color: S.soft, fontSize: "0.86rem", fontWeight: 550, margin: 0 }}>
                        {c.name}
                      </p>
                      <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>{c.domains}</p>
                    </div>
                  </div>
                ))}
              </div>
              <PanelLabel>Adoption Funnel</PanelLabel>
              <HBar label="Total"        value={total}                       maxVal={total} color={IBM.blue}   />
              <HBar label="Attending"    value={data.championsAttending}     maxVal={total} color={IBM.green}  />
              <HBar label="Avail. 1:1"   value={data.championsAvailableMeet} maxVal={total} color={IBM.purple} />
            </>
          ) : (
            <EmptyNote>No champions loaded yet. Check champions collection path.</EmptyNote>
          )}
          {total > 0 && data.championsAvailableMeet === 0 && (
            <EmptyNote>1:1 availability: add &ldquo;available_for_meet: true&rdquo; to champion docs to track this metric.</EmptyNote>
          )}
          {total === 0 && (
            <EmptyNote>Pending live activity — champions will appear once the collection is populated.</EmptyNote>
          )}
        </Panel>
      </div>

      {/* Champion drilldown table */}
      {data.championRows.length > 0 && (
        <div>
          <PanelLabel>All Champions</PanelLabel>
          <div style={{ overflowX: "auto", border: `1px solid ${S.line}` }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "760px",
              background: S.panel }}>
              <thead>
                <tr>
                  {["Name","Title","Organisation","Domains","Attending","Avail 1:1","LinkedIn"]
                    .map(h => (
                      <th key={h} style={{ color: S.dim, fontSize: "0.66rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.09em", padding: "8px 12px",
                        background: S.bg, borderBottom: `1px solid ${S.line}`,
                        whiteSpace: "nowrap" as const, textAlign: "left" as const }}>
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.championRows.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? S.panel : "#1a1a1a" }}>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px", color: S.text,
                      fontWeight: 550, borderBottom: `1px solid ${S.line}`,
                      whiteSpace: "nowrap" as const }}>{c.name}</td>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px", color: S.muted,
                      borderBottom: `1px solid ${S.line}`, maxWidth: "160px",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const }}>{c.title || "—"}</td>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px", color: S.soft,
                      borderBottom: `1px solid ${S.line}`, maxWidth: "160px",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const }}>{c.organization || "—"}</td>
                    <td style={{ fontSize: "0.76rem", padding: "9px 12px", color: IBM.blueLight,
                      borderBottom: `1px solid ${S.line}`, maxWidth: "200px",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const }}>{c.domains}</td>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px",
                      borderBottom: `1px solid ${S.line}`, textAlign: "center" as const }}>
                      {c.attending
                        ? <span style={{ color: IBM.green, fontWeight: 600 }}>✓</span>
                        : <span style={{ color: S.dim }}>—</span>}
                    </td>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px",
                      borderBottom: `1px solid ${S.line}`, textAlign: "center" as const }}>
                      {c.availableMeet
                        ? <span style={{ color: IBM.green, fontWeight: 600 }}>✓</span>
                        : <span style={{ color: S.dim }}>—</span>}
                    </td>
                    <td style={{ fontSize: "0.8rem", padding: "9px 12px",
                      borderBottom: `1px solid ${S.line}`, textAlign: "center" as const }}>
                      {c.hasLinkedIn
                        ? <span style={{ color: IBM.blueLight, fontWeight: 600 }}>✓</span>
                        : <span style={{ color: S.dim }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Participants table view
// ─────────────────────────────────────────────────────────────────────────────

function ParticipantsTableView({ data }: { data: AdminData }) {
  const [q, setQ] = useState("");
  if (data.loading) return <LoadingShimmer />;

  const rows = data.participantRows
    .filter(r => {
      if (!q) return true;
      const s = q.toLowerCase();
      return r.name.toLowerCase().includes(s) ||
        r.persona.toLowerCase().includes(s) ||
        r.organization.toLowerCase().includes(s) ||
        r.industry.toLowerCase().includes(s);
    })
    .slice(0, 200);

  const th: CSSProperties = {
    color: S.dim, fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.09em", padding: "8px 12px", background: S.bg,
    borderBottom: `1px solid ${S.line}`, whiteSpace: "nowrap" as const,
    textAlign: "left" as const,
  };
  const td: CSSProperties = {
    fontSize: "0.8rem", padding: "9px 12px", color: S.soft,
    borderBottom: `1px solid ${S.line}`, whiteSpace: "nowrap" as const,
  };
  const bool = (v: boolean) => v
    ? <span style={{ color: IBM.green, fontWeight: 600 }}>✓</span>
    : <span style={{ color: S.dim }}>—</span>;

  const sigColor: Record<string, string> = { Active: IBM.green, Enrolled: IBM.blue, Pending: S.dim };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHead kicker="Participants" title="All registered attendees."
        sub={`${data.totalParticipants.toLocaleString()} participants from Firestore. Showing up to 200 rows.`} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <input
          type="text"
          placeholder="Search by name, persona, organisation, industry…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1, maxWidth: "420px", height: "36px", padding: "0 12px",
            background: "#262626", border: `1px solid ${S.line}`, color: S.text,
            fontSize: "0.86rem", fontFamily: "inherit", outline: "none" }}
        />
        <span style={{ color: S.dim, fontSize: "0.78rem" }}>
          {rows.length} of {data.participantRows.length} shown
        </span>
      </div>
      {rows.length === 0 ? (
        <Panel><EmptyNote>No participants match your filter, or no participants loaded yet.</EmptyNote></Panel>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${S.line}` }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "900px",
            background: S.panel }}>
            <thead>
              <tr>
                {["Name","Persona","Organisation","Industry","Signal","Public Profile","LinkedIn","Saved Sessions","Saved People","Meet Requests"]
                  .map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? S.panel : "#1a1a1a" }}>
                  <td style={{ ...td, color: S.text, fontWeight: 500 }}>{r.name || <span style={{ color: S.dim }}>—</span>}</td>
                  <td style={{ ...td }}>
                    {r.persona
                      ? <span style={{ color: PERSONA_COLORS[r.persona] ?? IBM.blueLight, fontWeight: 550 }}>{r.persona}</span>
                      : <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.organization || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.industry || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td }}>
                    <span style={{ color: sigColor[r.signalStatus] ?? S.muted, fontWeight: 550, fontSize: "0.74rem",
                      textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {r.signalStatus}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "center" as const }}>{bool(r.publicProfile)}</td>
                  <td style={{ ...td, textAlign: "center" as const }}>{bool(r.linkedinOptIn)}</td>
                  <td style={{ ...td, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                    {r.savedSessions > 0 ? r.savedSessions : <span style={{ color: S.dim }}>0</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                    {r.savedPeople > 0 ? r.savedPeople : <span style={{ color: S.dim }}>0</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                    {r.meetRequests > 0
                      ? <span style={{ color: IBM.green, fontWeight: 600 }}>{r.meetRequests}</span>
                      : <span style={{ color: S.dim }}>0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions table view
// ─────────────────────────────────────────────────────────────────────────────

function SessionsTableView({ data }: { data: AdminData }) {
  const [q, setQ] = useState("");
  if (data.loading) return <LoadingShimmer />;

  const rows = data.sessionRows
    .filter(r => {
      if (!q) return true;
      const s = q.toLowerCase();
      return r.title.toLowerCase().includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.track.toLowerCase().includes(s) ||
        r.room.toLowerCase().includes(s);
    })
    .slice(0, 200);

  const th: CSSProperties = {
    color: S.dim, fontSize: "0.66rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.09em", padding: "8px 12px", background: S.bg,
    borderBottom: `1px solid ${S.line}`, whiteSpace: "nowrap" as const,
    textAlign: "left" as const,
  };
  const td: CSSProperties = {
    fontSize: "0.8rem", padding: "9px 12px", color: S.soft,
    borderBottom: `1px solid ${S.line}`, whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionHead kicker="Sessions" title="Full session catalog."
        sub={`${data.totalSessions.toLocaleString()} sessions from Firestore. Showing up to 200 rows.`} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <input
          type="text"
          placeholder="Search by title, type, track, room…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1, maxWidth: "420px", height: "36px", padding: "0 12px",
            background: "#262626", border: `1px solid ${S.line}`, color: S.text,
            fontSize: "0.86rem", fontFamily: "inherit", outline: "none" }}
        />
        <span style={{ color: S.dim, fontSize: "0.78rem" }}>
          {rows.length} of {data.sessionRows.length} shown
        </span>
      </div>
      {rows.length === 0 ? (
        <Panel><EmptyNote>No sessions match your filter, or no sessions loaded yet.</EmptyNote></Panel>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${S.line}` }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: "900px",
            background: S.panel }}>
            <thead>
              <tr>
                {["Title","Day","Start","Type","Track","Room","Anchor Event","Capacity"]
                  .map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? S.panel : "#1a1a1a" }}>
                  <td style={{ ...td, color: S.text, fontWeight: 500, maxWidth: "260px",
                    overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</td>
                  <td style={{ ...td }}>{r.day || <span style={{ color: S.dim }}>—</span>}</td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                    {r.startTime || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td }}>
                    {r.type
                      ? <span style={{ color: IBM.cyan }}>{r.type}</span>
                      : <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.track || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td }}>
                    {r.room || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td }}>
                    {r.anchorEvent || <span style={{ color: S.dim }}>—</span>}
                  </td>
                  <td style={{ ...td, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                    {r.capacity != null
                      ? <span style={{ color: IBM.blueLight }}>{r.capacity.toLocaleString()}</span>
                      : <span style={{ color: S.dim }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Quality view
// ─────────────────────────────────────────────────────────────────────────────

function DataQualityView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const dq = data.dq;
  const totalSessions = data.totalSessions;
  const totalChampions = data.totalChampions;
  const totalParticipants = data.totalParticipants;

  const warnings = [
    {
      label: "Sessions missing date/time",
      count: dq.sessionsMissingDateTime,
      total: totalSessions,
      color: IBM.yellow,
      fix: "Add day and start_time fields to session documents.",
    },
    {
      label: "Sessions missing room",
      count: dq.sessionsMissingRoom,
      total: totalSessions,
      color: IBM.orange,
      fix: "Add a room (or location) field to session documents.",
    },
    {
      label: "Champions missing domains",
      count: dq.championsMissingDomains,
      total: totalChampions,
      color: IBM.yellow,
      fix: "Add a domains[] or expertise[] field to champion documents.",
    },
    {
      label: "Participants missing persona",
      count: dq.participantsMissingPersona,
      total: totalParticipants,
      color: IBM.red,
      fix: "These attendees have not completed Compass enrollment.",
    },
    {
      label: "Participants with no consent recorded",
      count: dq.participantsMissingConsent,
      total: totalParticipants,
      color: IBM.yellow,
      fix: "Attendees who have not opted in to public_profile or LinkedIn.",
    },
    {
      label: "Duplicate session titles",
      count: dq.duplicateSessionTitles,
      total: totalSessions,
      color: IBM.red,
      fix: "Multiple sessions share the same title — check for import duplicates.",
    },
  ];

  const hasIssues = warnings.some(w => w.count > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Data Quality" title="Completeness and consistency check."
        sub="Warnings computed from live Firestore data. No writes. Refresh to re-run." />

      {!hasIssues && totalSessions + totalChampions + totalParticipants > 0 && (
        <Panel style={{ borderLeft: `3px solid ${IBM.green}` }}>
          <p style={{ color: IBM.green, fontWeight: 650, fontSize: "0.9rem", margin: "0 0 4px" }}>
            ✓ No issues detected
          </p>
          <p style={{ color: S.dim, fontSize: "0.8rem", margin: 0 }}>
            All fields look complete across participants, sessions, and champions.
          </p>
        </Panel>
      )}

      {(totalSessions + totalChampions + totalParticipants === 0) && (
        <Panel><EmptyNote>No data loaded yet — load Firestore data first.</EmptyNote></Panel>
      )}

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
        {warnings.map(w => {
          const pct = w.total > 0 ? Math.round((w.count / w.total) * 100) : 0;
          const ok = w.count === 0;
          return (
            <Panel key={w.label} style={{
              borderLeft: `3px solid ${ok ? IBM.green : w.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ color: ok ? S.muted : S.soft, fontSize: "0.86rem",
                  fontWeight: 550, margin: 0, lineHeight: 1.4, maxWidth: "200px" }}>
                  {w.label}
                </p>
                <span style={{ fontSize: "1.8rem", fontWeight: 520,
                  letterSpacing: "-0.04em", color: ok ? IBM.green : w.color, lineHeight: 1, flexShrink: 0 }}>
                  {ok ? "✓" : w.count.toLocaleString()}
                </span>
              </div>
              {!ok && (
                <>
                  <div style={{ height: "4px", background: S.line, marginBottom: "8px" }}>
                    <div style={{ width: Math.min(100, pct) + "%", height: "100%", background: w.color }} />
                  </div>
                  <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0, lineHeight: 1.5 }}>
                    {pct}% of {w.total.toLocaleString()} · {w.fix}
                  </p>
                </>
              )}
              {ok && (
                <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>No issues detected.</p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshots view — static
// ─────────────────────────────────────────────────────────────────────────────

function SnapshotsView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const base = Math.max(data.totalParticipants, 1);
  const topTracks = Object.entries(data.sessionsByTrack).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topDomains = Object.entries(data.expertiseCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const liveMetrics = [
    { label: "Participants",          value: data.totalParticipants.toLocaleString() },
    { label: "Compass Profiles",      value: data.compassBuilt.toLocaleString()      },
    { label: "Sessions Saved",        value: data.hasUsageData ? data.totalSessionsSaved.toLocaleString() : "—" },
    { label: "People Saved",          value: data.hasUsageData ? data.totalPeopleSaved.toLocaleString() : "—"   },
    { label: "Meet Requests",         value: data.hasUsageData ? data.totalMeetRequests.toLocaleString() : "—"  },
    { label: "Public Profile Opt-in", value: data.totalParticipants > 0
        ? `${Math.round((data.consentCounts.public_profile / base) * 100)}%` : "—" },
  ];

  const plannedMoments = [
    { name: "Before Keynote",  note: "Participant registration + Compass adoption baseline" },
    { name: "After Keynote",   note: "Post-keynote session saves spike" },
    { name: "Before Sandbox",  note: "Mid-event engagement check" },
    { name: "After Sandbox",   note: "Sandbox session preference signal" },
    { name: "Day 1 End",       note: "End-of-day cumulative activity" },
    { name: "Day 2 End",       note: "Peak conference signal" },
    { name: "Day 3 End",       note: "Final day + champion meeting completions" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <SectionHead kicker="Snapshot Intelligence" title="Moments captured in time."
        sub="Current live view + planned snapshot moments. Snapshot write-back is planned." />

      {/* Current live view */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%",
            background: IBM.green, display: "inline-block" }} />
          <span style={{ color: IBM.green, fontSize: "0.78rem", fontWeight: 650,
            letterSpacing: "0.06em", textTransform: "uppercase" }}>Current Live View</span>
          {data.lastRefresh && (
            <span style={{ color: S.dim, fontSize: "0.74rem" }}>
              as of {data.lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Panel style={{ borderTop: `3px solid ${IBM.green}` }}>
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1px", background: S.line, marginBottom: "20px" }}>
            {liveMetrics.map(m => (
              <div key={m.label} style={{ background: S.bg, padding: "16px" }}>
                <p style={{ color: S.muted, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.08em", margin: "0 0 8px", lineHeight: 1.3 }}>{m.label}</p>
                <p style={{ fontSize: "1.7rem", fontWeight: 520,
                  letterSpacing: "-0.04em", color: m.value === "—" ? S.dim : S.text,
                  margin: 0, lineHeight: 1 }}>{m.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <PanelLabel>Top Tracks</PanelLabel>
              {topTracks.length > 0
                ? topTracks.map(([t, n]) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ color: S.soft, fontSize: "0.8rem",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                        maxWidth: "120px" }}>{t}</span>
                      <span style={{ color: IBM.blueLight, fontSize: "0.8rem",
                        fontWeight: 600, flexShrink: 0 }}>{n}</span>
                    </div>
                  ))
                : <EmptyNote>No track data yet.</EmptyNote>
              }
            </div>
            <div>
              <PanelLabel>Top Champion Domains</PanelLabel>
              {topDomains.length > 0
                ? topDomains.map(([d, n]) => (
                    <div key={d} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ color: S.soft, fontSize: "0.8rem",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                        maxWidth: "120px" }}>{d}</span>
                      <span style={{ color: IBM.purple, fontSize: "0.8rem",
                        fontWeight: 600, flexShrink: 0 }}>{n}</span>
                    </div>
                  ))
                : <EmptyNote>No domain data yet.</EmptyNote>
              }
            </div>
            <div>
              <PanelLabel>Consent Participation</PanelLabel>
              {data.totalParticipants > 0 ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ color: S.soft, fontSize: "0.8rem" }}>Public profile</span>
                    <span style={{ color: IBM.cyan, fontSize: "0.8rem", fontWeight: 600 }}>
                      {Math.round((data.consentCounts.public_profile / base) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ color: S.soft, fontSize: "0.8rem" }}>LinkedIn</span>
                    <span style={{ color: IBM.cyan, fontSize: "0.8rem", fontWeight: 600 }}>
                      {Math.round((data.consentCounts.linkedin / base) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline" }}>
                    <span style={{ color: S.soft, fontSize: "0.8rem" }}>Intro request</span>
                    <span style={{ color: IBM.cyan, fontSize: "0.8rem", fontWeight: 600 }}>
                      {Math.round((data.consentCounts.intro / base) * 100)}%
                    </span>
                  </div>
                </>
              ) : (
                <EmptyNote>No consent data yet.</EmptyNote>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Planned snapshot moments */}
      <div>
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0, lineHeight: 1.6,
            fontStyle: "italic", borderLeft: `3px solid ${S.line}`, paddingLeft: "14px" }}>
            Snapshot write-back is planned. This view shows what Compass can capture at key event moments.
            The 7 moments below have not yet been recorded.
          </p>
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {plannedMoments.map(m => (
            <Panel key={m.name} style={{ borderTop: `2px solid ${S.line}`, opacity: 0.7 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "10px" }}>
                <p style={{ color: S.muted, fontSize: "0.88rem", fontWeight: 600, margin: 0 }}>
                  {m.name}
                </p>
                <span style={{ padding: "2px 8px", border: `1px solid ${S.line}`,
                  color: S.dim, fontSize: "0.64rem", fontWeight: 650,
                  letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Planned
                </span>
              </div>
              <p style={{ color: S.dim, fontSize: "0.76rem", margin: "0 0 12px", lineHeight: 1.4 }}>
                {m.note}
              </p>
              <div style={{ display: "grid",
                gridTemplateColumns: "1fr 1fr", gap: "1px", background: S.line }}>
                {["Participants","Sessions Saved","Meet Requests","Profiles"].map(lbl => (
                  <div key={lbl} style={{ background: "#181818", padding: "8px 10px" }}>
                    <p style={{ color: S.dim, fontSize: "0.62rem", textTransform: "uppercase",
                      letterSpacing: "0.07em", margin: "0 0 3px" }}>{lbl}</p>
                    <p style={{ color: "#383838", fontSize: "1.2rem", fontWeight: 520, margin: 0 }}>—</p>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity view — Firestore-powered
// ─────────────────────────────────────────────────────────────────────────────

function CapacityView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  if (!data.hasCapacityData) {
    return (
      <div>
        <SectionHead kicker="Capacity Risk Center" title="Where demand exceeds supply."
          sub="Sessions approaching or exceeding capacity — with attendee save pressure factored in." />
        <Panel>
          <p style={{ color: S.muted, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 8px" }}>
            No live capacity data yet.
          </p>
          <p style={{ color: S.dim, fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
            Add a{" "}
            <code style={{ background: "#2a2a2a", padding: "1px 5px", color: S.accent }}>capacity</code>
            {" "}field (number) to session documents in{" "}
            <code style={{ background: "#2a2a2a", padding: "1px 5px", color: S.accent }}>
              {BASE}/sessions
            </code>
            {" "}to enable this view.
            Session save counts are already being tracked from participant{" "}
            <code style={{ background: "#2a2a2a", padding: "1px 5px", color: S.accent }}>saved_sessions</code>
            {" "}arrays.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <SectionHead kicker="Capacity Risk Center" title="Where demand exceeds supply."
        sub="Sessions approaching or exceeding capacity — save counts computed from participant data." />
      <div style={{ display: "grid", gap: "10px" }}>
        {data.capacitySessions.map(c => {
          const savedPct = Math.round((c.saved / c.capacity) * 100);
          return (
            <Panel key={c.session}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <p style={{ color: S.text, fontSize: "0.97rem", fontWeight: 600, margin: "0 0 4px" }}>
                    {c.session}
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.78rem", margin: 0 }}>
                    Suggested action: {c.action}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" as const }}>
                    <p style={{ color: S.muted, fontSize: "0.68rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", margin: "0 0 2px" }}>
                      Capacity / Saved
                    </p>
                    <p style={{ color: S.soft, fontSize: "0.88rem", fontWeight: 600,
                      margin: 0, fontVariantNumeric: "tabular-nums" }}>
                      {c.capacity.toLocaleString()} · {c.saved.toLocaleString()}
                    </p>
                  </div>
                  <Risk level={c.risk} />
                </div>
              </div>
              <div style={{ position: "relative", height: "12px", background: S.line,
                borderRadius: "1px", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                  width: Math.min(100, savedPct) + "%",
                  background: c.risk === "HIGH" ? IBM.red
                    : c.risk === "MED" ? IBM.yellow
                    : c.risk === "WATCH" ? IBM.orange
                    : IBM.green,
                  transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                <span style={{ color: S.dim, fontSize: "0.68rem" }}>
                  Saved: {savedPct}% of capacity
                </span>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consent view — Firestore-powered
// ─────────────────────────────────────────────────────────────────────────────

function ConsentView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const base = Math.max(data.totalParticipants, 1);
  const cc = data.consentCounts;

  const consentItems = [
    { label: "Public profile opt-in",  pct: Math.round((cc.public_profile / base) * 100), n: cc.public_profile, color: IBM.blue     },
    { label: "LinkedIn opt-in",        pct: Math.round((cc.linkedin        / base) * 100), n: cc.linkedin,        color: IBM.purple   },
    { label: "Alumni matching",        pct: Math.round((cc.alumni          / base) * 100), n: cc.alumni,          color: IBM.cyan     },
    { label: "Employer matching",      pct: Math.round((cc.employer        / base) * 100), n: cc.employer,        color: IBM.teal     },
    { label: "University matching",    pct: Math.round((cc.university      / base) * 100), n: cc.university,      color: IBM.blueLight },
    { label: "SMS opt-in",             pct: Math.round((cc.sms             / base) * 100), n: cc.sms,             color: IBM.yellow   },
    { label: "Intro request opt-in",   pct: Math.round((cc.intro           / base) * 100), n: cc.intro,           color: IBM.green    },
  ];

  const totalConsentOptIns = Object.values(cc).reduce((a, b) => a + b, 0);

  return (
    <div>
      <SectionHead kicker="Consent & Trust" title="Privacy adoption at TechXchange 2026."
        sub="Opt-in rates across all consent dimensions — computed from participant records." />

      {data.totalParticipants === 0 && (
        <Panel>
          <EmptyNote>No participant consent data yet. Fields will populate as attendees enroll.</EmptyNote>
        </Panel>
      )}

      {data.totalParticipants > 0 && totalConsentOptIns === 0 && (
        <Panel style={{ marginBottom: "20px" }}>
          <p style={{ color: IBM.yellow, fontSize: "0.86rem", fontWeight: 600, margin: "0 0 6px" }}>
            Consent fields not detected
          </p>
          <p style={{ color: S.dim, fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
            {data.totalParticipants} participants found but no consent fields detected. Expected field names:
            <code style={{ display: "block", background: "#262626", padding: "8px 10px",
              marginTop: "8px", fontSize: "0.76rem", color: S.accent, lineHeight: 1.7 }}>
              consent_public_profile · consent_linkedin · consent_alumni · consent_employer
              · consent_university · consent_sms · consent_intro
            </code>
            <span style={{ display: "block", marginTop: "6px" }}>
              Or nested as{" "}
              <code style={{ color: S.accent }}>consent.public_profile</code> etc.
            </span>
          </p>
        </Panel>
      )}

      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {consentItems.map(c => (
          <Panel key={c.label} style={{ textAlign: "center" as const }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: "10px" }}>
              <Donut pct={c.pct} color={c.color} size={80} />
              <span style={{ position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "1.1rem", fontWeight: 600, color: S.text, pointerEvents: "none" }}>
                {c.pct}%
              </span>
            </div>
            <p style={{ color: S.soft, fontSize: "0.82rem", fontWeight: 550,
              margin: "0 0 3px", lineHeight: 1.3 }}>{c.label}</p>
            <p style={{ color: S.dim, fontSize: "0.74rem", margin: 0 }}>
              {c.n.toLocaleString()} opted in
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelLabel>Consent Opt-in Comparison</PanelLabel>
        {consentItems.map(c => (
          <HBar key={c.label} label={c.label} value={c.pct} maxVal={100} color={c.color} suffix="%" />
        ))}
        <p style={{ color: S.dim, fontSize: "0.76rem", margin: "14px 0 0", lineHeight: 1.5 }}>
          Based on {data.totalParticipants.toLocaleString()} participant records.
          {cc.sms < base * 0.5 && cc.sms > 0 && " SMS opt-in is below 50% — consider in-app prompt at check-in."}
        </p>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity view — simulated live feed
// ─────────────────────────────────────────────────────────────────────────────

function ActivityView() {
  const [feed, setFeed] = useState(ACTIVITY_SEED);
  const counterRef = useRef(ACTIVITY_SEED.length + 1);

  useEffect(() => {
    const names   = ["Alex N.", "Sofía M.", "Rahim A.", "Jing L.", "Lena H.", "Omar S.", "Yara B."];
    const actions: [string, ActivityType][] = [
      ["built Compass profile",         "profile"],
      ["saved a session",               "session"],
      ["added a Champion",              "champion"],
      ["accepted recommendations",      "reco"],
      ["used Voice Compass",            "voice"],
      ["refined Compass profile",       "profile"],
    ];
    const personas = ["Developer","Architect","Executive","Champion","Student","Partner","Client","IBMer"];

    const timer = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const [action, type] = actions[Math.floor(Math.random() * actions.length)];
      const persona = personas[Math.floor(Math.random() * personas.length)];
      setFeed(f => [{
        id: counterRef.current++, time: "just now",
        event: `${name} ${action}`, type, persona,
      }, ...f.slice(0, 29)]);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const typeColor: Record<ActivityType, string> = {
    profile: IBM.blue, session: IBM.cyan, champion: IBM.purple, reco: IBM.green, voice: IBM.orange,
  };
  const typeLabel: Record<ActivityType, string> = {
    profile: "Profile", session: "Session", champion: "Champion", reco: "Recommendation", voice: "Voice",
  };

  return (
    <div>
      <SectionHead kicker="Activity Center" title="Live Compass activity."
        sub="Simulated real-time stream — wire to Firestore onSnapshot for production telemetry." />
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%",
          background: IBM.green, display: "inline-block" }} />
        <span style={{ color: IBM.green, fontSize: "0.78rem", fontWeight: 650,
          letterSpacing: "0.06em", textTransform: "uppercase" }}>Live — updating</span>
        <span style={{ color: S.dim, fontSize: "0.78rem" }}>Showing last 30 actions</span>
      </div>
      <div style={{ display: "grid", gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
        {feed.map(item => (
          <div key={item.id} style={{
            background: item.time === "just now" ? "rgba(36,161,72,0.04)" : S.panel,
            padding: "10px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px", transition: "background 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <span style={{ display: "inline-flex", alignItems: "center",
                padding: "1px 8px", fontSize: "0.64rem", fontWeight: 650,
                letterSpacing: "0.06em", textTransform: "uppercase",
                background: typeColor[item.type] + "18",
                border: `1px solid ${typeColor[item.type]}44`,
                color: typeColor[item.type], flexShrink: 0 }}>
                {typeLabel[item.type]}
              </span>
              <p style={{ color: S.soft, fontSize: "0.86rem", margin: 0 }}>{item.event}</p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
              <span style={{ color: S.dim, fontSize: "0.72rem" }}>{item.persona}</span>
              <span style={{ color: S.dim, fontSize: "0.72rem",
                fontVariantNumeric: "tabular-nums", minWidth: "72px",
                textAlign: "right" as const }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content view
// ─────────────────────────────────────────────────────────────────────────────

function ContentView() {
  const [pages, setPages] = useState<ContentPageData[]>(() =>
    CONTENT_DEFAULTS.map(p => ({ ...p })),
  );
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState(false);

  const page = pages[selected];

  function update<K extends keyof ContentPageData>(key: K, val: ContentPageData[K]) {
    setPages(ps => ps.map((p, idx) => (idx === selected ? { ...p, [key]: val } : p)));
    setSaved(false);
  }

  return (
    <div>
      <SectionHead
        kicker="Experience"
        title="Attendee-facing hero copy."
        sub="Edit the kicker, headline, body, and CTAs that shape each Compass page. Local state — future path: organizations/ibm/events/txc2026/admin_content/pages/{page_id}"
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
        {pages.map((p, i) => (
          <button
            key={p.pageId}
            type="button"
            onClick={() => { setSelected(i); setSaved(false); }}
            style={{
              padding: "6px 12px",
              border: `1px solid ${selected === i ? IBM.blue : S.line}`,
              background: selected === i ? "rgba(15,98,254,0.10)" : "transparent",
              color: selected === i ? S.accent : S.muted,
              fontSize: "0.8rem",
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: selected === i ? 650 : 500,
            }}
          >
            {p.page}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "16px", alignItems: "start" }}>
        <Panel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>
                {page.page}
              </p>
              <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>
                page_id: {page.pageId}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {saved && (
                <span style={{ color: IBM.green, fontSize: "0.76rem", fontWeight: 650 }}>✓ Saved</span>
              )}
              <button
                type="button"
                onClick={() => setSaved(true)}
                style={{
                  padding: "6px 14px", background: IBM.blue, border: "none",
                  color: "#fff", fontSize: "0.8rem", fontFamily: "inherit",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={A.fieldLabel}>Hero kicker</label>
              <input style={A.field} value={page.kicker} onChange={e => update("kicker", e.target.value)} />
            </div>
            <div>
              <label style={A.fieldLabel}>Hero headline</label>
              <input style={A.field} value={page.title} onChange={e => update("title", e.target.value)} />
            </div>
            <div>
              <label style={A.fieldLabel}>Hero body</label>
              <textarea style={{ ...A.textarea, minHeight: "96px" }} value={page.body}
                onChange={e => update("body", e.target.value)} />
            </div>

            <hr style={A.divider} />
            <p style={{ color: S.muted, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Primary CTA
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={A.fieldLabel}>Label</label>
                <input style={A.field} value={page.cta} onChange={e => update("cta", e.target.value)} />
              </div>
              <div>
                <label style={A.fieldLabel}>Destination</label>
                <input style={A.field} value={page.dest} onChange={e => update("dest", e.target.value)} />
              </div>
            </div>

            <p style={{ color: S.muted, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Secondary CTA
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={A.fieldLabel}>Label</label>
                <input style={A.field} value={page.secondaryCta} onChange={e => update("secondaryCta", e.target.value)} />
              </div>
              <div>
                <label style={A.fieldLabel}>Destination</label>
                <input style={A.field} value={page.secondaryDest} onChange={e => update("secondaryDest", e.target.value)} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <p style={{ color: S.muted, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            Live preview
          </p>
          <div style={{ borderTop: `1px solid ${S.line}`, paddingTop: "18px" }}>
            <p style={{ color: S.accent, fontSize: "0.72rem", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
              {page.kicker || "Kicker"}
            </p>
            <h3 style={{ color: S.text, fontSize: "1.35rem", fontWeight: 520, letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.25 }}>
              {page.title || "Headline"}
            </h3>
            <p style={{ color: S.muted, fontSize: "0.9rem", lineHeight: 1.55, margin: "0 0 18px" }}>
              {page.body || "Body copy"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", background: IBM.blue, color: "#fff", fontSize: "0.84rem", fontWeight: 600 }}>
                {page.cta || "Primary CTA"}
              </span>
              {page.secondaryCta && (
                <span style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 16px", border: `1px solid ${S.line}`, color: S.soft, fontSize: "0.84rem" }}>
                  {page.secondaryCta}
                </span>
              )}
            </div>
          </div>
          <p style={{ color: S.dim, fontSize: "0.76rem", margin: "12px 0 0", lineHeight: 1.45 }}>
            Routes: {page.dest}{page.secondaryDest ? ` · ${page.secondaryDest}` : ""}
          </p>
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Access view
// ─────────────────────────────────────────────────────────────────────────────

function AccessAdminView() {
  const accessLevels = ["Owner", "Event Admin", "Content Editor", "Read Only"] as const;

  const credentials = [
    { label: "Authentication method", value: "Email / IBMid-ready" },
    { label: "SSO readiness", value: "Planned" },
    { label: "Admin role model", value: "Demo mode" },
    { label: "Data access", value: "Scoped by event" },
  ];

  return (
    <div>
      <SectionHead
        kicker="Admin access"
        title="Define who can operate Compass."
        sub="Define who can operate Compass, edit attendee-facing content, review signals, and manage event intelligence."
      />

      <div style={{ display: "grid", gap: "16px" }}>
        <Panel noPad>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.line}` }}>
            <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Operators
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.line}`, color: S.muted, textAlign: "left" }}>
                  {["Name", "Email", "Role", "Access level", "Status", "Last active"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", fontWeight: 650, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADMIN_ACCESS_USERS.map(user => (
                  <tr key={user.email} style={{ borderBottom: `1px solid ${S.line}` }}>
                    <td style={{ padding: "12px 16px", color: S.text }}>{user.name}</td>
                    <td style={{ padding: "12px 16px", color: S.muted }}>{user.email}</td>
                    <td style={{ padding: "12px 16px", color: S.soft }}>{user.role}</td>
                    <td style={{ padding: "12px 16px", color: S.accent }}>{user.accessLevel}</td>
                    <td style={{ padding: "12px 16px", color: user.status === "Active" ? IBM.green : S.muted }}>{user.status}</td>
                    <td style={{ padding: "12px 16px", color: S.dim }}>{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Panel>
            <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
              Access levels
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "8px" }}>
              {accessLevels.map(level => (
                <li key={level} style={{ padding: "10px 12px", border: `1px solid ${S.line}`, color: S.soft, fontSize: "0.86rem" }}>
                  {level}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
              Credentials & access
            </p>
            <div>
              {credentials.map((row, i) => (
                <div key={row.label} style={{
                  ...A.statusRow,
                  borderBottom: i < credentials.length - 1 ? A.statusRow.borderBottom : "none",
                }}>
                  <span style={{ color: S.muted, fontSize: "0.84rem" }}>{row.label}</span>
                  <span style={{ color: S.text, fontSize: "0.84rem", fontWeight: 550 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice admin view
// ─────────────────────────────────────────────────────────────────────────────

function VoiceAdminView() {
  const [defaultTone, setDefaultTone] = useState<VoiceToneId>("guide");
  const [lastTest, setLastTest] = useState<"Successful" | "Failed" | "Not run">("Successful");
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  const statusRow: CSSProperties = {
    ...A.statusRow,
    padding: "12px 0",
  };

  async function runVoiceTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Compass voice test successful.",
          voiceName: getVoiceNameForTone(defaultTone),
        }),
      });
      setLastTest(res.ok ? "Successful" : "Failed");
    } catch {
      setLastTest("Failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <SectionHead
        kicker="Experience"
        title="Ask Compass voice configuration."
        sub="Default voice, TTS connectivity, and last test status for demo confidence."
      />

      <div style={{ display: "grid", gap: "14px" }}>
        <Panel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Default voice
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {saved && (
                <span style={{ color: IBM.green, fontSize: "0.76rem", fontWeight: 650 }}>✓ Saved</span>
              )}
              <button
                type="button"
                onClick={() => setSaved(true)}
                style={{
                  padding: "6px 14px", background: IBM.blue, border: "none",
                  color: "#fff", fontSize: "0.8rem", fontFamily: "inherit",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {VOICE_TONE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => { setDefaultTone(option.id); setSaved(false); }}
                style={{
                  padding: "8px 16px",
                  border: `1px solid ${defaultTone === option.id ? IBM.blue : S.line}`,
                  background: defaultTone === option.id ? "rgba(15,98,254,0.12)" : "transparent",
                  color: defaultTone === option.id ? S.accent : S.soft,
                  fontSize: "0.88rem",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  fontWeight: defaultTone === option.id ? 650 : 500,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p style={{ color: S.muted, fontSize: "0.82rem", margin: "12px 0 0", lineHeight: 1.5 }}>
            Guide → en-US-Chirp3-HD-Aoede · Studio → en-US-Chirp3-HD-Charon
          </p>
        </Panel>

        <Panel>
          <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
            Production status
          </p>
          <div>
            <div style={statusRow}>
              <span style={{ color: S.soft, fontSize: "0.88rem" }}>Google TTS</span>
              <span style={{ color: IBM.green, fontSize: "0.88rem", fontWeight: 650 }}>Connected ✓</span>
            </div>
            <div style={{ ...statusRow, borderBottom: "none" }}>
              <span style={{ color: S.soft, fontSize: "0.88rem" }}>Last voice test</span>
              <span style={{
                color: lastTest === "Successful" ? IBM.green : lastTest === "Failed" ? IBM.red : S.muted,
                fontSize: "0.88rem",
                fontWeight: 650,
              }}>
                {testing ? "Running…" : lastTest}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void runVoiceTest(); }}
            disabled={testing}
            style={{
              marginTop: "14px",
              padding: "8px 14px",
              background: "transparent",
              border: `1px solid ${S.line}`,
              color: S.soft,
              fontSize: "0.82rem",
              fontFamily: "inherit",
              cursor: testing ? "wait" : "pointer",
            }}
          >
            Run voice test
          </button>
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signals admin view
// ─────────────────────────────────────────────────────────────────────────────

function SignalsAdminView({ data }: { data: AdminData }) {
  const metrics = [
    { label: "Attendee profiles", value: data.totalParticipants.toLocaleString(), note: "Enrolled Compass profiles" },
    { label: "Session intelligence", value: data.totalSessions.toLocaleString(), note: "Scored against attendee signals" },
    { label: "Champion matches", value: data.totalChampions.toLocaleString(), note: "People intelligence index" },
    { label: "Connection signals", value: "14", note: "New mutual-interest signals today" },
    { label: "Live huddles", value: "6", note: "Conversations forming nearby" },
    { label: "Last refresh", value: data.lastRefresh ? data.lastRefresh.toLocaleTimeString() : "Moments ago", note: "Platform sync status" },
  ];

  return (
    <div>
      <SectionHead
        kicker="Attendees"
        title="Live intelligence at a glance."
        sub="Demo-ready summary of attendee signals, matches, and platform activity."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {metrics.map(m => (
          <Panel key={m.label}>
            <p style={{ color: S.muted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
              {m.label}
            </p>
            <p style={{ color: S.text, fontSize: "1.6rem", fontWeight: 520, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              {m.value}
            </p>
            <p style={{ color: S.dim, fontSize: "0.82rem", margin: 0, lineHeight: 1.45 }}>{m.note}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Credits view
// ─────────────────────────────────────────────────────────────────────────────

function CreditsView() {
  const [credits, setCredits] = useState<CreditsFormData>(() => ({
    ...CREDITS_DEFAULTS,
    technologyCredits: CREDITS_DEFAULTS.technologyCredits.map(item => ({ ...item })),
  }));
  const [saved, setSaved] = useState(false);

  const inp = A.field;
  const ta = { ...A.textarea, minHeight: "88px" };
  const fieldLabel = A.fieldLabel;

  function updateField<K extends keyof Omit<CreditsFormData, "technologyCredits">>(
    key: K,
    value: CreditsFormData[K],
  ) {
    setCredits(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateTech(id: string, patch: Partial<TechCreditItem>) {
    setCredits(prev => ({
      ...prev,
      technologyCredits: prev.technologyCredits.map(item =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
    setSaved(false);
  }

  return (
    <div>
      <SectionHead
        kicker="Experience"
        title="Product credits and confidentiality."
        sub="Product credit, technology acknowledgments, copyright, confidentiality, and prototype disclaimer."
      />

      <div style={{ display: "grid", gap: "14px" }}>
        <Panel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Product & ownership
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {saved && (
                <span style={{ color: IBM.green, fontSize: "0.76rem", fontWeight: 650 }}>✓ Saved</span>
              )}
              <button
                type="button"
                onClick={() => setSaved(true)}
                style={{
                  padding: "6px 14px", background: IBM.blue, border: "none",
                  color: "#fff", fontSize: "0.8rem", fontFamily: "inherit",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={fieldLabel}>Product name</label>
                <input
                  style={inp}
                  value={credits.productName}
                  onChange={e => updateField("productName", e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Version</label>
                <input
                  style={inp}
                  value={credits.version}
                  onChange={e => updateField("version", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Product tagline</label>
              <input
                style={inp}
                value={credits.productTagline}
                onChange={e => updateField("productTagline", e.target.value)}
              />
            </div>
            <div>
              <label style={fieldLabel}>Product description</label>
              <textarea
                style={ta}
                value={credits.productCredit}
                onChange={e => updateField("productCredit", e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={fieldLabel}>Created by</label>
                <input
                  style={inp}
                  value={credits.createdBy}
                  onChange={e => updateField("createdBy", e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Contact</label>
                <input
                  style={inp}
                  value={credits.contact}
                  onChange={e => updateField("contact", e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={fieldLabel}>Copyright notice</label>
                <input
                  style={inp}
                  value={credits.copyrightNotice}
                  onChange={e => updateField("copyrightNotice", e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Event / platform context</label>
                <input
                  style={inp}
                  value={credits.eventContext}
                  onChange={e => updateField("eventContext", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Confidentiality</label>
              <textarea
                style={{ ...ta, height: "96px" }}
                value={credits.confidentiality}
                onChange={e => updateField("confidentiality", e.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            Technology credits
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            {credits.technologyCredits.map(item => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "24px minmax(0, 1fr)",
                  gap: "10px",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderBottom: `1px solid ${S.line}`,
                  background: "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={e => updateTech(item.id, { enabled: e.target.checked })}
                  aria-label={`Include ${item.label}`}
                />
                <input
                  style={{ ...inp, height: "32px" }}
                  value={item.label}
                  onChange={e => updateTech(item.id, { label: e.target.value })}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            AI / voice & disclaimer
          </p>
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <label style={fieldLabel}>AI / voice credit</label>
              <textarea
                style={ta}
                value={credits.aiVoiceCredit}
                onChange={e => updateField("aiVoiceCredit", e.target.value)}
              />
            </div>
            <div>
              <label style={fieldLabel}>Disclaimer / prototype note</label>
              <textarea
                style={{ ...ta, height: "72px" }}
                value={credits.disclaimer}
                onChange={e => updateField("disclaimer", e.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <p style={{ color: S.muted, fontSize: "0.78rem", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Preview
          </p>
          <div style={{ display: "grid", gap: "10px", color: S.soft, fontSize: "0.88rem", lineHeight: 1.55 }}>
            <p style={{ margin: 0, fontWeight: 650, color: S.text }}>{credits.productName}</p>
            <p style={{ margin: 0 }}>{credits.productTagline}</p>
            <p style={{ margin: 0 }}>{credits.productCredit}</p>
            <p style={{ margin: 0 }}>Created by {credits.createdBy}</p>
            <p style={{ margin: 0 }}>{credits.eventContext}</p>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {credits.technologyCredits.filter(t => t.enabled).map(t => (
                <li key={t.id}>{t.label}</li>
              ))}
            </ul>
            <p style={{ margin: 0 }}>{credits.aiVoiceCredit}</p>
            <p style={{ margin: 0, color: S.accent }}>{credits.copyrightNotice}</p>
            <p style={{ margin: 0, whiteSpace: "pre-line" }}>{credits.confidentiality}</p>
            <p style={{ margin: 0 }}>{credits.version} · {credits.contact}</p>
            <p style={{ margin: 0, color: S.muted, fontSize: "0.82rem" }}>{credits.disclaimer}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ingest view
// ─────────────────────────────────────────────────────────────────────────────

function IngestView({ data }: { data: AdminData }) {
  const [status, setStatus] = useState<Record<string, "idle" | "loading" | "done">>({});
  const simulate = (id: string) => {
    setStatus(s => ({ ...s, [id]: "loading" }));
    setTimeout(() => setStatus(s => ({ ...s, [id]: "done" })), 1800);
  };

  const TYPES = [
    { id: "sessions",    label: "Sessions",    count: data.totalSessions,  schema: "title, type, day, start_time, room, tracks[], capacity"           },
    { id: "champions",   label: "Champions",   count: data.totalChampions, schema: "display_name, title, organization, domains[], available_for_meet"  },
    { id: "communities", label: "Communities", count: 0,                   schema: "name, type, lead, description, session_ids[]"                      },
    { id: "sponsors",    label: "Sponsors",    count: 0,                   schema: "name, tier, logo_url, booth, session_ids[]"                        },
  ];

  return (
    <div>
      <SectionHead kicker="Data Ingest" title="Upload and validate event data."
        sub="Upload CSV or JSON. Compass validates schema, previews rows, and reports errors before committing." />
      <div style={{ display: "grid", gap: "14px" }}>
        {TYPES.map(t => (
          <Panel key={t.id}>
            <div style={{ display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: S.text, fontSize: "0.97rem", fontWeight: 600, margin: "0 0 4px" }}>
                  {t.label}
                </p>
                <p style={{ color: S.dim, fontSize: "0.76rem", margin: "0 0 12px",
                  fontFamily: "IBM Plex Mono, monospace", lineHeight: 1.4 }}>
                  Schema: {t.schema}
                </p>
                <span style={{ color: t.count > 0 ? IBM.green : S.dim, fontSize: "0.78rem", fontWeight: 650 }}>
                  {t.count > 0 ? `✓ ${t.count} records in Firestore` : "No records yet"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {status[t.id] === "done" && (
                  <span style={{ color: IBM.green, fontSize: "0.8rem", fontWeight: 650, alignSelf: "center" }}>
                    ✓ Uploaded
                  </span>
                )}
                {status[t.id] === "loading" && (
                  <span style={{ color: S.muted, fontSize: "0.8rem", alignSelf: "center" }}>Validating…</span>
                )}
                <button type="button" onClick={() => simulate(t.id)}
                  disabled={status[t.id] === "loading"}
                  style={{ padding: "7px 16px", border: `1px solid ${S.line}`,
                    background: "transparent", color: S.soft,
                    fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" }}>
                  Upload {t.label}
                </button>
                <button type="button"
                  style={{ padding: "7px 16px", border: `1px solid ${IBM.blue}`,
                    background: "transparent", color: IBM.blueLight,
                    fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" }}>
                  Preview
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports view
// ─────────────────────────────────────────────────────────────────────────────

function ExportsView() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const simulate = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(null), 1600);
  };

  const EXPORTS = [
    { id: "sessions-csv",   format: "CSV",  label: "Session Catalog",        rows: "All sessions"      },
    { id: "champions-csv",  format: "CSV",  label: "Champion Registry",      rows: "All Champions"     },
    { id: "personas-csv",   format: "CSV",  label: "Persona Breakdown",      rows: "8 personas"        },
    { id: "consent-csv",    format: "CSV",  label: "Consent Export",         rows: "All participants"  },
    { id: "snapshots-json", format: "JSON", label: "Snapshot Export",        rows: "6 snapshots"       },
    { id: "activity-json",  format: "JSON", label: "Activity Log",           rows: "All events"        },
    { id: "champions-json", format: "JSON", label: "Champion Full Profile",  rows: "All Champions"     },
    { id: "full-json",      format: "JSON", label: "Full Platform Export",   rows: "Complete dataset"  },
  ];

  return (
    <div>
      <SectionHead kicker="Exports" title="Data portability for your team."
        sub="Export Compass data as CSV or JSON. All exports include a timestamp and version header." />
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
        {EXPORTS.map(ex => (
          <div key={ex.id} style={{ background: S.panel, padding: "18px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ padding: "1px 7px",
                  border: `1px solid ${ex.format === "CSV" ? IBM.cyan : IBM.purple}`,
                  color: ex.format === "CSV" ? IBM.cyan : IBM.purple,
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                  {ex.format}
                </span>
                <p style={{ color: S.soft, fontSize: "0.88rem", fontWeight: 550, margin: 0 }}>{ex.label}</p>
              </div>
              <p style={{ color: S.dim, fontSize: "0.74rem", margin: 0 }}>{ex.rows}</p>
            </div>
            <button type="button" onClick={() => simulate(ex.id)}
              disabled={downloading === ex.id}
              style={{ padding: "6px 14px", flexShrink: 0, border: `1px solid ${S.line}`,
                background: downloading === ex.id ? "rgba(36,161,72,0.1)" : "transparent",
                color: downloading === ex.id ? IBM.green : S.muted,
                fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer" }}>
              {downloading === ex.id ? "↓ Preparing…" : "↓ Download"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit log view
// ─────────────────────────────────────────────────────────────────────────────

function AuditView() {
  return (
    <div>
      <SectionHead kicker="Audit Log" title="Who changed what."
        sub="Every admin action is timestamped and recorded. Before and after values preserved." />
      <div style={{ background: S.panel, border: `1px solid ${S.line}` }}>
        <div style={{ display: "grid",
          gridTemplateColumns: "180px 80px 160px 1fr 1fr",
          gap: "16px", padding: "10px 16px",
          borderBottom: `1px solid ${S.line}`, background: S.bg }}>
          {["Timestamp","User","Action","Before","After"].map(h => (
            <p key={h} style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
              letterSpacing: "0.09em", fontWeight: 700, margin: 0 }}>{h}</p>
          ))}
        </div>
        {AUDIT_LOG.map((row, i) => (
          <div key={i} style={{ display: "grid",
            gridTemplateColumns: "180px 80px 160px 1fr 1fr",
            gap: "16px", padding: "12px 16px",
            borderBottom: `1px solid ${S.line}`,
            background: i % 2 === 0 ? S.panel : "#1a1a1a" }}>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace" }}>{row.time}</p>
            <p style={{ color: IBM.blueLight, fontSize: "0.78rem", fontWeight: 600, margin: 0 }}>
              {row.user}
            </p>
            <p style={{ color: S.soft, fontSize: "0.78rem", fontWeight: 550, margin: 0 }}>
              {row.action}
            </p>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{row.before}</p>
            <p style={{ color: S.muted, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{row.after}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Compass Health Center
// ─────────────────────────────────────────────────────────────────────────────

function CompassHealthView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const hs = data.healthScore;
  const color = hs >= 70 ? IBM.green : hs >= 40 ? IBM.yellow : IBM.red;
  const grade = hs >= 70 ? "Healthy" : hs >= 40 ? "At Risk" : "Critical";

  const base = Math.max(data.totalParticipants, 1);
  const profilePct  = Math.round((data.compassBuilt / base) * 100);
  const consentN    = data.participantRows.filter(p => p.publicProfile || p.linkedinOptIn).length;
  const consentPct  = Math.round((consentN / base) * 100);
  const networkPct  = Math.round((data.participantWithNetworking / base) * 100);
  const goalsPct    = Math.round((data.participantWithGoals / base) * 100);

  const dimensions = [
    { label: "Profile Completion",   weight: "40%", pct: profilePct,  score: Math.round(profilePct * 0.4),  color: IBM.blue   },
    { label: "Consent Participation", weight: "20%", pct: consentPct,  score: Math.round(consentPct * 0.2),  color: IBM.purple },
    { label: "Networking Signals",    weight: "20%", pct: networkPct,  score: Math.round(networkPct * 0.2),  color: IBM.cyan   },
    { label: "Goals & Tracks Set",    weight: "20%", pct: goalsPct,    score: Math.round(goalsPct   * 0.2),  color: IBM.teal   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Compass Health Center"
        title="Platform health score."
        sub="Weighted composite (profile 40%, consent 20%, networking 20%, goals 20%). Computed from live Firestore." />

      {/* Score hero */}
      <Panel style={{ borderTop: `3px solid ${color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={50} fill="none" stroke={S.line} strokeWidth={12} />
              <circle cx={60} cy={60} r={50} fill="none" stroke={color} strokeWidth={12}
                strokeDasharray={`${(hs / 100) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`}
                strokeLinecap="butt"
                style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", textAlign: "center" as const }}>
              <p style={{ fontSize: "1.8rem", fontWeight: 600, color, margin: 0, lineHeight: 1 }}>{hs}</p>
              <p style={{ fontSize: "0.6rem", color: S.dim, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>/ 100</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "1.4rem", fontWeight: 600, color, margin: "0 0 4px" }}>{grade}</p>
            <p style={{ color: S.muted, fontSize: "0.88rem", margin: "0 0 16px" }}>
              {data.totalParticipants.toLocaleString()} participants · last computed {data.lastRefresh?.toLocaleTimeString() ?? "—"}
            </p>
            {data.healthReasons.length > 0 && (
              <div>
                <p style={{ color: S.dim, fontSize: "0.72rem", textTransform: "uppercase",
                  letterSpacing: "0.08em", margin: "0 0 8px", fontWeight: 700 }}>Top reasons</p>
                {data.healthReasons.map(r => (
                  <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                    <span style={{ color: IBM.yellow, flexShrink: 0, marginTop: "1px" }}>▲</span>
                    <span style={{ color: S.soft, fontSize: "0.84rem" }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {data.healthReasons.length === 0 && data.totalParticipants > 0 && (
              <p style={{ color: IBM.green, fontSize: "0.86rem", fontWeight: 600 }}>
                ✓ All health dimensions are strong
              </p>
            )}
          </div>
        </div>
      </Panel>

      {/* Dimension breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {dimensions.map(d => (
          <Panel key={d.label} style={{ borderLeft: `3px solid ${d.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <p style={{ color: S.soft, fontSize: "0.88rem", fontWeight: 600, margin: "0 0 2px" }}>{d.label}</p>
                <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>Weight: {d.weight}</p>
              </div>
              <span style={{ fontSize: "1.5rem", fontWeight: 600, color: d.color, lineHeight: 1 }}>{d.pct}%</span>
            </div>
            <div style={{ height: "6px", background: S.line, marginBottom: "8px" }}>
              <div style={{ width: d.pct + "%", height: "100%", background: d.color }} />
            </div>
            <p style={{ color: S.dim, fontSize: "0.74rem", margin: 0 }}>
              Contributes <strong style={{ color: d.color }}>{d.score}</strong> pts to health score
            </p>
          </Panel>
        ))}
      </div>

      {data.totalParticipants === 0 && (
        <Panel><EmptyNote>No participant data loaded yet.</EmptyNote></Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Event Command Center
// ─────────────────────────────────────────────────────────────────────────────

function CommandCenterView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const topNetworkingDomains = Object.entries(data.expertiseCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topLearningTracks = Object.entries(data.sessionsByTrack)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDomain = topNetworkingDomains[0]?.[1] ?? 1;
  const maxTrack  = topLearningTracks[0]?.[1] ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Event Command Center"
        title="Engagement at a glance."
        sub="High/low engagement attendees, networking hotspots, learning hotspots — from live Firestore." />

      {/* Engagement tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* High engagement */}
        <Panel style={{ borderTop: `3px solid ${IBM.green}` }}>
          <PanelLabel>⬆ High Engagement — Top 10</PanelLabel>
          {data.highEngagementRows.length === 0 ? (
            <EmptyNote>No usage data yet.</EmptyNote>
          ) : (
            data.highEngagementRows.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center",
                gap: "10px", marginBottom: "10px",
                paddingBottom: "10px", borderBottom: i < data.highEngagementRows.length - 1 ? `1px solid ${S.line}` : "none" }}>
                <span style={{ color: IBM.green, fontSize: "0.72rem", fontWeight: 700,
                  minWidth: "18px", textAlign: "right" as const }}>#{i+1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.text, fontSize: "0.86rem", fontWeight: 550, margin: "0 0 2px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {r.name || r.id}
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>
                    {r.persona || "—"} · {r.organization || "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <p style={{ color: IBM.green, fontSize: "0.78rem", fontWeight: 600, margin: "0 0 1px" }}>
                    {r.savedSessions}s · {r.savedPeople}p · {r.meetRequests}m
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.66rem", margin: 0 }}>sessions · people · meets</p>
                </div>
              </div>
            ))
          )}
        </Panel>

        {/* Low engagement */}
        <Panel style={{ borderTop: `3px solid ${IBM.yellow}` }}>
          <PanelLabel>⬇ Low Engagement — Enrolled but Inactive</PanelLabel>
          {data.lowEngagementRows.length === 0 ? (
            <EmptyNote>No enrolled-but-inactive participants, or no usage data yet.</EmptyNote>
          ) : (
            data.lowEngagementRows.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center",
                gap: "10px", marginBottom: "10px",
                paddingBottom: "10px", borderBottom: i < data.lowEngagementRows.length - 1 ? `1px solid ${S.line}` : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.soft, fontSize: "0.86rem", fontWeight: 550, margin: "0 0 2px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {r.name || r.id}
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>
                    {r.persona || "—"} · {r.organization || "—"}
                  </p>
                </div>
                <span style={{ color: IBM.yellow, fontSize: "0.74rem", fontWeight: 600,
                  padding: "2px 8px", border: `1px solid ${IBM.yellow}44`, flexShrink: 0 }}>
                  Inactive
                </span>
              </div>
            ))
          )}
        </Panel>
      </div>

      {/* Hotspots */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Panel>
          <PanelLabel>🔥 Networking Hotspots — Top Champion Domains</PanelLabel>
          {topNetworkingDomains.length === 0 ? (
            <EmptyNote>No champion domain data yet.</EmptyNote>
          ) : (
            topNetworkingDomains.map(([domain, count]) => (
              <HBar key={domain} label={domain} value={count} maxVal={maxDomain} color={IBM.purple} />
            ))
          )}
        </Panel>
        <Panel>
          <PanelLabel>📚 Learning Hotspots — Most Active Session Tracks</PanelLabel>
          {topLearningTracks.length === 0 ? (
            <EmptyNote>No session track data yet.</EmptyNote>
          ) : (
            topLearningTracks.map(([track, count]) => (
              <HBar key={track} label={track} value={count} maxVal={maxTrack} color={IBM.cyan} />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Champion Intel
// ─────────────────────────────────────────────────────────────────────────────

function ChampionIntelView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const topDomains = Object.entries(data.expertiseCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxDomain = topDomains[0]?.[1] ?? 1;

  const trackCoverage = Object.entries(data.championsByTrack)
    .sort((a, b) => b[1] - a[1]);
  const coverageRisks = trackCoverage.filter(([, n]) => n < 3);
  const coverageGood  = trackCoverage.filter(([, n]) => n >= 3);

  const noProfile   = data.championRows.filter(c => c.domains === "—").length;
  const noLinkedIn  = data.championRows.filter(c => !c.hasLinkedIn).length;
  const unavailable = data.championRows.filter(c => !c.availableMeet).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Champion Intel"
        title="Coverage, gaps, and expertise."
        sub="Champion domain coverage with risk detection. <3 champions = coverage risk." />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px",
        background: S.line, border: `1px solid ${S.line}` }}>
        {[
          { label: "Total Champions",    value: data.totalChampions,         color: IBM.blueLight },
          { label: "Attending",          value: data.championsAttending,      color: IBM.green     },
          { label: "Available for Meet", value: data.championsAvailableMeet,  color: IBM.cyan      },
          { label: "Coverage Risks",     value: coverageRisks.length,         color: coverageRisks.length > 0 ? IBM.red : IBM.green },
        ].map(c => (
          <div key={c.label} style={{ background: S.bg, padding: "16px 20px" }}>
            <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 6px" }}>{c.label}</p>
            <p style={{ fontSize: "1.9rem", fontWeight: 520, color: c.color,
              letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
              {c.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Coverage risk */}
      {coverageRisks.length > 0 && (
        <Panel style={{ borderLeft: `3px solid ${IBM.red}` }}>
          <PanelLabel>⚠ Coverage Risk — tracks with fewer than 3 champions</PanelLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {coverageRisks.map(([track, n]) => (
              <span key={track} style={{ padding: "4px 12px",
                background: "rgba(218,30,40,0.08)", border: `1px solid ${IBM.red}44`,
                color: "#ff8389", fontSize: "0.8rem" }}>
                {track} ({n})
              </span>
            ))}
          </div>
        </Panel>
      )}
      {coverageRisks.length === 0 && trackCoverage.length > 0 && (
        <Panel style={{ borderLeft: `3px solid ${IBM.green}` }}>
          <p style={{ color: IBM.green, fontWeight: 650, fontSize: "0.9rem", margin: 0 }}>
            ✓ All covered tracks have 3+ champions
          </p>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Top domains */}
        <Panel>
          <PanelLabel>Top Champion Domains / Expertise</PanelLabel>
          {topDomains.length === 0
            ? <EmptyNote>No domain data — add domains[] or expertise[] to champion documents.</EmptyNote>
            : topDomains.map(([d, n]) => (
                <HBar key={d} label={d} value={n} maxVal={maxDomain} color={IBM.purple} />
              ))
          }
        </Panel>

        {/* Data completeness */}
        <Panel>
          <PanelLabel>Champion Profile Completeness</PanelLabel>
          {data.totalChampions > 0 ? (
            <>
              <div style={{ marginBottom: "20px" }}>
                {[
                  { label: "Missing domain/expertise",  count: noProfile,   color: IBM.yellow },
                  { label: "Missing LinkedIn URL",      count: noLinkedIn,  color: IBM.orange },
                  { label: "Not available for meeting", count: unavailable, color: IBM.red    },
                ].map(item => {
                  const pct = Math.round((item.count / data.totalChampions) * 100);
                  return (
                    <div key={item.label} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "baseline", marginBottom: "5px" }}>
                        <span style={{ color: S.soft, fontSize: "0.84rem" }}>{item.label}</span>
                        <span style={{ color: item.count > 0 ? item.color : IBM.green,
                          fontWeight: 600, fontSize: "0.88rem" }}>
                          {item.count > 0 ? item.count : "✓"}
                        </span>
                      </div>
                      {item.count > 0 && (
                        <div style={{ height: "5px", background: S.line }}>
                          <div style={{ width: pct + "%", height: "100%", background: item.color }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <PanelLabel>Good Coverage (3+ champions)</PanelLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {coverageGood.slice(0, 12).map(([track, n]) => (
                  <span key={track} style={{ padding: "3px 10px",
                    background: "rgba(36,161,72,0.08)", border: `1px solid ${IBM.green}33`,
                    color: IBM.green, fontSize: "0.76rem" }}>
                    {track} ({n})
                  </span>
                ))}
                {coverageGood.length === 0 && <EmptyNote>No coverage data yet.</EmptyNote>}
              </div>
            </>
          ) : (
            <EmptyNote>No champion data loaded yet.</EmptyNote>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Consent Intelligence
// ─────────────────────────────────────────────────────────────────────────────

function ConsentIntelView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const base = Math.max(data.totalParticipants, 1);
  const cc = data.consentCounts;

  const dimensions = [
    { id: "public_profile", label: "Public Profile",  n: cc.public_profile, color: IBM.blue,     rec: "Promote profile visibility during onboarding" },
    { id: "linkedin",       label: "LinkedIn",         n: cc.linkedin,       color: IBM.purple,   rec: "Add LinkedIn opt-in prompt at event check-in" },
    { id: "intro",          label: "Intro Request",    n: cc.intro,          color: IBM.green,    rec: "Highlight peer-to-peer value of intro requests" },
    { id: "alumni",         label: "Alumni Matching",  n: cc.alumni,         color: IBM.cyan,     rec: "Surface alumni connections during session browse" },
    { id: "employer",       label: "Employer Matching",n: cc.employer,       color: IBM.teal,     rec: "Explain employer matching benefits in Compass" },
    { id: "sms",            label: "SMS Opt-in",       n: cc.sms,            color: IBM.yellow,   rec: "SMS opt-in is low — consider post-event nudge" },
  ];

  const allOptin = data.participantRows.filter(p => p.publicProfile || p.linkedinOptIn).length;
  const zeroOptin = data.totalParticipants - allOptin;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Consent Intelligence"
        title="Privacy adoption + actionable recommendations."
        sub="6 consent dimensions with trend bars and prescriptive next steps." />

      {/* Headline numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px",
        background: S.line, border: `1px solid ${S.line}` }}>
        {[
          { label: "Participants",       value: data.totalParticipants.toLocaleString(), color: S.text    },
          { label: "Any Consent",        value: allOptin.toLocaleString(),               color: IBM.green  },
          { label: "No Consent at All",  value: zeroOptin.toLocaleString(),              color: zeroOptin > 0 ? IBM.red : IBM.green },
        ].map(c => (
          <div key={c.label} style={{ background: S.bg, padding: "16px 20px" }}>
            <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 6px" }}>{c.label}</p>
            <p style={{ fontSize: "1.9rem", fontWeight: 520, color: c.color,
              letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Dimension bars + recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {dimensions.map(d => {
          const pct = Math.round((d.n / base) * 100);
          const isLow = pct < 30;
          return (
            <Panel key={d.id} style={{ borderLeft: `3px solid ${isLow ? IBM.yellow : d.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <p style={{ color: S.text, fontSize: "0.9rem", fontWeight: 600, margin: "0 0 2px" }}>
                    {d.label}
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.74rem", margin: 0 }}>
                    {d.n.toLocaleString()} opted in
                  </p>
                </div>
                <span style={{ fontSize: "1.6rem", fontWeight: 600, color: d.color, lineHeight: 1 }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: "6px", background: S.line, marginBottom: "10px" }}>
                <div style={{ width: pct + "%", height: "100%", background: d.color }} />
              </div>
              {isLow && (
                <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                  <span style={{ color: IBM.yellow, fontSize: "0.72rem", flexShrink: 0 }}>→</span>
                  <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0, lineHeight: 1.4 }}>
                    {d.rec}
                  </p>
                </div>
              )}
              {!isLow && (
                <p style={{ color: IBM.green, fontSize: "0.76rem", margin: 0 }}>✓ Healthy opt-in rate</p>
              )}
            </Panel>
          );
        })}
      </div>

      {data.totalParticipants === 0 && (
        <Panel><EmptyNote>No participant data loaded yet.</EmptyNote></Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TXC Heat Map
// ─────────────────────────────────────────────────────────────────────────────

function HeatMapView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const topTracks   = Object.entries(data.sessionsByTrack).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const maxTrack    = topTracks[0]?.[1] ?? 1;
  const maxGoal     = data.topGoals[0]?.[1] ?? 1;
  const maxNeed     = data.topNeeds[0]?.[1] ?? 1;
  const maxCareer   = data.topCareerInterests[0]?.[1] ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="TXC Heat Map"
        title="What attendees care about."
        sub="Tracks, goals, needs, and career interests — computed from participant Compass profiles." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Panel>
          <PanelLabel>Session Tracks by Interest</PanelLabel>
          {topTracks.length === 0
            ? <EmptyNote>No track data — add tracks[] to session documents.</EmptyNote>
            : topTracks.map(([t, n]) => (
                <HBar key={t} label={t} value={n} maxVal={maxTrack} color={IBM.blue} />
              ))
          }
        </Panel>
        <Panel>
          <PanelLabel>Most Selected Learning Goals</PanelLabel>
          {data.topGoals.length === 0
            ? <EmptyNote>No goals data — add goals[] to participant documents.</EmptyNote>
            : data.topGoals.map(([g, n]) => (
                <HBar key={g} label={g} value={n} maxVal={maxGoal} color={IBM.green} />
              ))
          }
        </Panel>
        <Panel>
          <PanelLabel>Top Attendee Needs</PanelLabel>
          {data.topNeeds.length === 0
            ? <EmptyNote>No needs data — add needs[] to participant documents.</EmptyNote>
            : data.topNeeds.map(([n, v]) => (
                <HBar key={n} label={n} value={v} maxVal={maxNeed} color={IBM.cyan} />
              ))
          }
        </Panel>
        <Panel>
          <PanelLabel>Career Interests</PanelLabel>
          {data.topCareerInterests.length === 0
            ? <EmptyNote>No career_interests data — add career_interests[] to participant documents.</EmptyNote>
            : data.topCareerInterests.map(([c, n]) => (
                <HBar key={c} label={c} value={n} maxVal={maxCareer} color={IBM.purple} />
              ))
          }
        </Panel>
      </div>

      {data.totalParticipants > 0 && (
        <Panel>
          <PanelLabel>Engagement Coverage</PanelLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Have Goals Set",        n: data.participantWithGoals,      color: IBM.green  },
              { label: "Have Preferred Tracks", n: data.participantWithTracks,     color: IBM.blue   },
              { label: "Networking Signals",    n: data.participantWithNetworking, color: IBM.purple },
            ].map(item => {
              const pct = Math.round((item.n / Math.max(data.totalParticipants, 1)) * 100);
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: "6px" }}>
                    <span style={{ color: S.soft, fontSize: "0.84rem" }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: "6px", background: S.line }}>
                    <div style={{ width: pct + "%", height: "100%", background: item.color }} />
                  </div>
                  <p style={{ color: S.dim, fontSize: "0.72rem", margin: "4px 0 0" }}>
                    {item.n.toLocaleString()} of {data.totalParticipants.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Enhanced Data Quality Center
// ─────────────────────────────────────────────────────────────────────────────

function DataQualityCenterView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const dq = data.dq;
  const totalScore = [
    dq.sessionsMissingDateTime, dq.sessionsMissingRoom,
    dq.championsMissingDomains, dq.participantsMissingPersona,
    dq.participantsMissingConsent, dq.duplicateSessionTitles,
  ].reduce((a, v) => a + v, 0);

  const warnings = [
    {
      label: "Sessions missing date/time",
      count: dq.sessionsMissingDateTime,
      total: data.totalSessions,
      color: IBM.yellow,
      fix: 'Add day and start_time fields to session documents.',
      affectedView: "sessions-table" as AdminView,
      field: "day / start_time",
    },
    {
      label: "Sessions missing room",
      count: dq.sessionsMissingRoom,
      total: data.totalSessions,
      color: IBM.orange,
      fix: "Add a room or location field to session documents.",
      affectedView: "sessions-table" as AdminView,
      field: "room",
    },
    {
      label: "Champions missing domains",
      count: dq.championsMissingDomains,
      total: data.totalChampions,
      color: IBM.yellow,
      fix: "Add domains[] or expertise[] to champion documents.",
      affectedView: "champions" as AdminView,
      field: "domains / expertise",
    },
    {
      label: "Participants missing persona",
      count: dq.participantsMissingPersona,
      total: data.totalParticipants,
      color: IBM.red,
      fix: "These attendees have not completed Compass enrollment.",
      affectedView: "participants" as AdminView,
      field: "persona",
    },
    {
      label: "Participants with no consent",
      count: dq.participantsMissingConsent,
      total: data.totalParticipants,
      color: IBM.yellow,
      fix: "No public_profile or LinkedIn consent recorded.",
      affectedView: "consent" as AdminView,
      field: "consent_public_profile / consent_linkedin",
    },
    {
      label: "Duplicate session titles",
      count: dq.duplicateSessionTitles,
      total: data.totalSessions,
      color: IBM.red,
      fix: "Multiple sessions share the same title — check for import duplicates.",
      affectedView: "sessions-table" as AdminView,
      field: "title",
    },
  ];

  const hasIssues = warnings.some(w => w.count > 0);
  const qualityScore = data.totalSessions + data.totalChampions + data.totalParticipants > 0
    ? Math.max(0, 100 - Math.round((totalScore / Math.max(data.totalSessions + data.totalChampions + data.totalParticipants, 1)) * 100))
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Data Quality Center"
        title="Completeness, integrity, and field health."
        sub="Enhanced quality checks with affected record counts and direct links to fix views." />

      {/* Score header */}
      <Panel style={{ borderLeft: `3px solid ${qualityScore >= 80 ? IBM.green : qualityScore >= 50 ? IBM.yellow : IBM.red}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div>
            <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 4px" }}>Data Quality Score</p>
            <p style={{ fontSize: "2.4rem", fontWeight: 600, margin: 0, lineHeight: 1,
              color: qualityScore >= 80 ? IBM.green : qualityScore >= 50 ? IBM.yellow : IBM.red }}>
              {qualityScore}<span style={{ fontSize: "1rem", color: S.dim }}>/100</span>
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "Participants", n: data.totalParticipants },
                { label: "Sessions",    n: data.totalSessions     },
                { label: "Champions",   n: data.totalChampions    },
              ].map(c => (
                <div key={c.label}>
                  <p style={{ color: S.dim, fontSize: "0.66rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", margin: "0 0 3px" }}>{c.label}</p>
                  <p style={{ fontSize: "1.3rem", fontWeight: 520, color: S.text, margin: 0 }}>
                    {c.n.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {!hasIssues && data.totalSessions + data.totalChampions + data.totalParticipants > 0 && (
        <Panel style={{ borderLeft: `3px solid ${IBM.green}` }}>
          <p style={{ color: IBM.green, fontWeight: 650, fontSize: "0.9rem", margin: "0 0 4px" }}>
            ✓ No issues detected
          </p>
          <p style={{ color: S.dim, fontSize: "0.8rem", margin: 0 }}>
            All fields look complete across participants, sessions, and champions.
          </p>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
        {warnings.map(w => {
          const pct = w.total > 0 ? Math.round((w.count / w.total) * 100) : 0;
          const ok = w.count === 0;
          return (
            <Panel key={w.label} style={{ borderLeft: `3px solid ${ok ? IBM.green : w.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <p style={{ color: ok ? S.muted : S.soft, fontSize: "0.88rem",
                    fontWeight: 600, margin: "0 0 4px" }}>{w.label}</p>
                  <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>
                    Field: <code style={{ color: S.accent }}>{w.field}</code>
                  </p>
                </div>
                <span style={{ fontSize: "1.8rem", fontWeight: 600,
                  color: ok ? IBM.green : w.color, lineHeight: 1, flexShrink: 0 }}>
                  {ok ? "✓" : w.count.toLocaleString()}
                </span>
              </div>
              {!ok && (
                <>
                  <div style={{ height: "4px", background: S.line, marginBottom: "8px" }}>
                    <div style={{ width: Math.min(100, pct) + "%", height: "100%", background: w.color }} />
                  </div>
                  <p style={{ color: S.dim, fontSize: "0.76rem", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {pct}% of {w.total.toLocaleString()} — {w.fix}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: S.dim, fontSize: "0.72rem" }}>
                      {w.count.toLocaleString()} affected record{w.count !== 1 ? "s" : ""}
                    </span>
                    <span style={{ padding: "3px 10px", border: `1px solid ${S.line}`,
                      color: IBM.blueLight, fontSize: "0.72rem", cursor: "default" }}>
                      → View in {w.affectedView}
                    </span>
                  </div>
                </>
              )}
              {ok && (
                <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>No issues detected.</p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Executive Snapshot
// ─────────────────────────────────────────────────────────────────────────────

function ExecSnapshotView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const base = Math.max(data.totalParticipants, 1);
  const profileRate = Math.round((data.compassBuilt / base) * 100);
  const consentN    = data.participantRows.filter(p => p.publicProfile || p.linkedinOptIn).length;
  const consentRate = Math.round((consentN / base) * 100);
  const networkRate = Math.round((data.participantWithNetworking / base) * 100);
  const activeN     = data.participantRows.filter(p => p.signalStatus === "Active").length;
  const activeRate  = Math.round((activeN / base) * 100);

  const kpis = [
    { label: "Total Participants",    value: data.totalParticipants.toLocaleString(), sub: "registered in Firestore",            color: IBM.blueLight },
    { label: "Compass Profiles",      value: data.compassBuilt.toLocaleString(),       sub: `${profileRate}% enrollment rate`,    color: IBM.green     },
    { label: "Active Attendees",      value: activeN.toLocaleString(),                 sub: `${activeRate}% of registered`,       color: IBM.cyan      },
    { label: "Sessions in Catalog",   value: data.totalSessions.toLocaleString(),      sub: "from Firestore sessions collection", color: IBM.blue      },
    { label: "Champions Available",   value: data.championsAvailableMeet.toLocaleString(), sub: `of ${data.totalChampions.toLocaleString()} total`,  color: IBM.purple  },
    { label: "Networking Engaged",    value: data.participantWithNetworking.toLocaleString(), sub: `${networkRate}% have networking signals`, color: IBM.teal },
    { label: "Meet Requests",         value: data.hasUsageData ? data.totalMeetRequests.toLocaleString() : "—", sub: "total across all attendees", color: IBM.green },
    { label: "Consent Opt-in",        value: `${consentRate}%`,                        sub: `${consentN.toLocaleString()} participants`, color: IBM.yellow },
    { label: "Platform Health",       value: `${data.healthScore}/100`,                sub: data.healthScore >= 70 ? "Healthy" : data.healthScore >= 40 ? "At Risk" : "Critical",
      color: data.healthScore >= 70 ? IBM.green : data.healthScore >= 40 ? IBM.yellow : IBM.red },
  ];

  const topPersonas = Object.entries(data.personaCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topDomains = Object.entries(data.expertiseCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="Executive Snapshot"
        title="VP-level summary — TechXchange 2026."
        sub={`One-page view for leadership. Refreshed ${data.lastRefresh?.toLocaleTimeString() ?? "—"}.`} />

      {/* KPI grid */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1px", background: S.line, border: `1px solid ${S.line}` }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: S.bg, padding: "18px 20px" }}>
            <p style={{ color: S.dim, fontSize: "0.66rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 6px", lineHeight: 1.4 }}>{k.label}</p>
            <p style={{ fontSize: "1.8rem", fontWeight: 520, letterSpacing: "-0.04em",
              color: k.color, margin: "0 0 3px", lineHeight: 1 }}>{k.value}</p>
            <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Summary narrative */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <Panel>
          <PanelLabel>Event Intelligence Summary</PanelLabel>
          <p style={{ color: S.soft, fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 16px" }}>
            TechXchange 2026 has{" "}
            <strong style={{ color: IBM.blueLight }}>{data.totalParticipants.toLocaleString()} registered participants</strong>
            , of whom{" "}
            <strong style={{ color: IBM.green }}>{data.compassBuilt.toLocaleString()} ({profileRate}%)</strong>
            {" "}have completed a Compass profile. The platform health score is{" "}
            <strong style={{ color: data.healthScore >= 70 ? IBM.green : IBM.yellow }}>{data.healthScore}/100</strong>.
            {" "}{activeN.toLocaleString()} attendees ({activeRate}%) are actively engaging with Compass.
          </p>
          <p style={{ color: S.soft, fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
            The champion network has{" "}
            <strong style={{ color: IBM.purple }}>{data.totalChampions.toLocaleString()} champions</strong>
            , with{" "}
            <strong style={{ color: IBM.cyan }}>{data.championsAvailableMeet.toLocaleString()} available for 1:1 meetings</strong>.
            {" "}Consent opt-in across participants stands at{" "}
            <strong style={{ color: IBM.yellow }}>{consentRate}%</strong>.
            {data.hasUsageData && ` Attendees have made ${data.totalMeetRequests.toLocaleString()} meet requests.`}
          </p>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Panel>
            <PanelLabel>Top Personas</PanelLabel>
            {topPersonas.map(([p, n]) => (
              <div key={p} style={{ display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ color: PERSONA_COLORS[p] ?? S.soft, fontSize: "0.84rem",
                  fontWeight: 550 }}>{p}</span>
                <span style={{ color: S.text, fontSize: "0.84rem",
                  fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString()}</span>
              </div>
            ))}
            {topPersonas.length === 0 && <EmptyNote>No persona data.</EmptyNote>}
          </Panel>
          <Panel>
            <PanelLabel>Top Champion Domains</PanelLabel>
            {topDomains.map(([d, n]) => (
              <div key={d} style={{ display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ color: S.soft, fontSize: "0.84rem",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                  maxWidth: "130px" }}>{d}</span>
                <span style={{ color: IBM.purple, fontSize: "0.84rem",
                  fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{n}</span>
              </div>
            ))}
            {topDomains.length === 0 && <EmptyNote>No domain data.</EmptyNote>}
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. "If TechXchange Started Right Now"
// ─────────────────────────────────────────────────────────────────────────────

function RightNowView({ data }: { data: AdminData }) {
  if (data.loading) return <LoadingShimmer />;

  const topPersonas    = Object.entries(data.personaCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topTracks      = Object.entries(data.sessionsByTrack).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topDomains     = Object.entries(data.expertiseCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topSessions    = data.sessionRows
    .map(s => ({ title: s.title, track: s.track, saved: 0 }))
    .slice(0, 10);

  const base = Math.max(data.totalParticipants, 1);
  const profileRate = Math.round((data.compassBuilt / base) * 100);
  const networkRate = Math.round((data.participantWithNetworking / base) * 100);
  const hs = data.healthScore;

  // Brief narrative
  const topPersonaName = topPersonas[0]?.[0] ?? "—";
  const topTrackName   = topTracks[0]?.[0] ?? "—";
  const topDomainName  = topDomains[0]?.[0] ?? "—";
  const brief = data.totalParticipants > 0 ? [
    `TechXchange 2026 Compass has ${data.totalParticipants.toLocaleString()} registered participants with a ${profileRate}% profile completion rate.`,
    `The event is ${hs >= 70 ? "healthy" : hs >= 40 ? "at risk" : "in critical health"} with a platform health score of ${hs}/100.`,
    `The dominant attendee persona is ${topPersonaName}. The most-requested topic area is ${topTrackName}.`,
    `${data.totalChampions} IBM Champions are in the network — ${data.championsAvailableMeet} available for 1:1 meetings. Top domain: ${topDomainName}.`,
    `${networkRate}% of attendees have activated networking signals. ${data.totalMeetRequests > 0 ? `${data.totalMeetRequests} meet requests have been made.` : "No meet request data yet."}`,
    data.topGoals.length > 0 ? `Top learning goal: "${data.topGoals[0][0]}" (${data.topGoals[0][1]} attendees).` : "",
  ].filter(Boolean).join(" ") : "No participant data loaded yet — load Firestore data first.";

  function Top10Panel({ title, items, color }: { title: string; items: [string, number][]; color: string }) {
    return (
      <Panel>
        <PanelLabel>{title}</PanelLabel>
        {items.length === 0 ? (
          <EmptyNote>No data available yet.</EmptyNote>
        ) : (
          items.map(([label, value], i) => (
            <div key={label} style={{ display: "flex", alignItems: "center",
              gap: "8px", marginBottom: "8px" }}>
              <span style={{ color: S.dim, fontSize: "0.7rem", minWidth: "16px",
                fontWeight: 700, textAlign: "right" as const }}>{i+1}</span>
              <span style={{ flex: 1, color: S.soft, fontSize: "0.84rem",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {label}
              </span>
              {value > 0 && (
                <span style={{ color, fontSize: "0.82rem", fontWeight: 600,
                  flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {value.toLocaleString()}
                </span>
              )}
            </div>
          ))
        )}
      </Panel>
    );
  }

  const topSessionPairs: [string, number][] = topSessions.map(s => [s.title, 0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead kicker="If TechXchange Started Right Now"
        title="Top 10 lists + Compass Executive Brief."
        sub="Snapshot of the current state of TechXchange 2026 — based on live Firestore data." />

      {/* Executive Brief */}
      <Panel style={{ borderLeft: `3px solid ${IBM.blue}` }}>
        <p style={{ color: IBM.blueLight, fontSize: "0.68rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
          Compass Executive Brief
        </p>
        <p style={{ color: S.soft, fontSize: "0.97rem", lineHeight: 1.8, margin: 0 }}>
          {brief}
        </p>
      </Panel>

      {/* Top 10 grids */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
        <Top10Panel title="Top 10 Attendee Personas"  items={topPersonas}        color={IBM.blue}   />
        <Top10Panel title="Top 10 Session Tracks"     items={topTracks}          color={IBM.cyan}   />
        <Top10Panel title="Top 10 Champion Domains"   items={topDomains}         color={IBM.purple} />
        <Top10Panel title="Top 10 Learning Goals"     items={data.topGoals}      color={IBM.green}  />
        <Top10Panel title="Top 10 Attendee Needs"     items={data.topNeeds}      color={IBM.teal}   />
        <Top10Panel title="Top 10 Sessions in Catalog" items={topSessionPairs}   color={IBM.orange} />
      </div>

      {data.totalParticipants === 0 && (
        <Panel><EmptyNote>Load Firestore data to generate this view.</EmptyNote></Panel>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main — auth gate + view router
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view,     setView]     = useState<AdminView>("dashboard");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); setLoggedIn(hasSession()); }, []);

  const handleLogin  = useCallback(() => setLoggedIn(true), []);
  const handleLogout = useCallback(() => { clearSession(); setLoggedIn(false); }, []);

  const { data, reload } = useAdminData(loggedIn && mounted);

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#0f0f0f" }} />;
  if (!loggedIn) return <AdminLogin onSuccess={handleLogin} />;

  const VIEW_MAP: Record<AdminView, ReactNode> = {
    dashboard:        <DashboardView         data={data} />,
    personas:         <PersonasView          data={data} />,
    champions:        <ChampionsView         data={data} />,
    snapshots:        <SnapshotsView         data={data} />,
    capacity:         <CapacityView          data={data} />,
    consent:          <ConsentView           data={data} />,
    participants:     <ParticipantsTableView data={data} />,
    "sessions-table": <SessionsTableView     data={data} />,
    quality:          <DataQualityView       data={data} />,
    activity:         <ActivityView />,
    content:          <ContentView />,
    voice:            <VoiceAdminView />,
    credits:          <CreditsView />,
    access:           <AccessAdminView />,
    signals:          <SignalsAdminView data={data} />,
    ingest:           <IngestView            data={data} />,
    exports:          <ExportsView />,
    audit:            <AuditView />,
    // 8 new views
    health:           <CompassHealthView     data={data} />,
    command:          <CommandCenterView     data={data} />,
    "champion-intel": <ChampionIntelView     data={data} />,
    "consent-intel":  <ConsentIntelView      data={data} />,
    heatmap:          <HeatMapView           data={data} />,
    "data-quality":   <DataQualityCenterView data={data} />,
    "exec-snapshot":  <ExecSnapshotView      data={data} />,
    "right-now":      <RightNowView          data={data} />,
  };

  return (
    <AdminLayout view={view} setView={setView}
      onLogout={handleLogout} onRefresh={reload}
      lastRefresh={data.lastRefresh} loading={data.loading}>
      {data.error && (
        <div style={{ background: "rgba(218,30,40,0.08)", border: "1px solid rgba(218,30,40,0.3)",
          padding: "10px 16px", marginBottom: "20px" }}>
          <p style={{ color: "#ff8389", fontSize: "0.82rem", margin: 0 }}>
            Firestore error: {data.error}
          </p>
        </div>
      )}
      {VIEW_MAP[view]}
    </AdminLayout>
  );
}