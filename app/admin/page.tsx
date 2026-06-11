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
  | "ingest"    | "exports"     | "audit"
  | "participants" | "sessions-table" | "quality";

const NAV: { id: AdminView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard",   icon: "◈" },
  { id: "content",   label: "Content",     icon: "✎" },
  { id: "ingest",    label: "Data Ingest", icon: "⬆" },
  { id: "personas",  label: "Personas",    icon: "◎" },
  { id: "champions", label: "Champions",   icon: "★" },
  { id: "snapshots", label: "Snapshots",   icon: "◷" },
  { id: "capacity",  label: "Capacity",    icon: "▦" },
  { id: "consent",        label: "Consent",      icon: "◻" },
  { id: "participants",   label: "Participants", icon: "▤" },
  { id: "sessions-table", label: "Sessions",     icon: "▣" },
  { id: "quality",        label: "Data Quality", icon: "⚑" },
  { id: "activity",       label: "Activity",     icon: "◉" },
  { id: "exports",   label: "Exports",     icon: "⬇" },
  { id: "audit",     label: "Audit Log",   icon: "≡" },
];

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

const CONTENT_DEFAULTS = [
  { page: "Home",          title: "Compass. Your TechXchange Advantage.",              body: "The first event intelligence platform that knows who you are, what you need, and who you should meet.",         cta: "Build My Compass",      dest: "/enroll"     },
  { page: "Explore",       title: "Your personal TechXchange starts here.",            body: "Compass maps your goals, tracks, and career into a personalised four-day plan.",                                 cta: "See the full schedule", dest: "/sessions"   },
  { page: "Sessions",      title: "Every session. Scored for you.",                    body: "2,481 attendees navigating 600+ sessions. Compass finds your signal.",                                           cta: "Browse all sessions",   dest: "/sessions"   },
  { page: "Champions",     title: "Meet the people who make TechXchange extraordinary.", body: "IBM Champions bring practical knowledge, generosity, and peer guidance.",                                     cta: "See matched Champions", dest: "/champions"  },
  { page: "Pulse",         title: "The heartbeat of TechXchange.",                     body: "Live signal from the event floor — sessions, people, and momentum in one view.",                                cta: "View Pulse",            dest: "/pulse"      },
  { page: "My Experience", title: "TechXchange, built for you.",                       body: "Your personalised four-day plan, scored sessions, and Champion matches — all in one place.",                    cta: "Open My Compass",       dest: "/experience" },
];

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
    sessionsMissingDateTime:   sessionRows.filter(s => !s.day && !s.startTime).length,
    sessionsMissingRoom:       sessionRows.filter(s => !s.room).length,
    championsMissingDomains:   championRows.filter(c => c.domains === "—").length,
    participantsMissingPersona: participantRows.filter(p => !p.persona).length,
    participantsMissingConsent: participantRows.filter(
      p => !p.publicProfile && !p.linkedinOptIn
    ).length,
    duplicateSessionTitles:    Object.values(titleCounts).filter(c => c > 1).length,
  };

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

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: S.panel, border: `1px solid ${S.line}`, padding: "20px", ...style }}>
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

      {/* Sidebar */}
      <aside style={{ width: "232px", background: S.sideBg, borderRight: `1px solid ${S.line}`,
        display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${S.line}` }}>
          <p style={{ color: S.accent, fontSize: "0.62rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 3px" }}>Compass</p>
          <p style={{ color: S.text, fontSize: "1rem", fontWeight: 650,
            margin: "0 0 2px", letterSpacing: "-0.02em" }}>Admin Console</p>
          <p style={{ color: S.dim, fontSize: "0.72rem", margin: "0 0 10px" }}>IBM TechXchange 2026</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "0.62rem", color: IBM.green, fontWeight: 650,
            letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%",
              background: IBM.green, display: "inline-block" }} />
            Live
          </span>
        </div>

        <nav style={{ flex: 1, padding: "10px 0" }} aria-label="Admin navigation">
          {NAV.map(item => {
            const active = view === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setView(item.id)} style={{
                width: "100%", padding: "9px 20px", border: "none",
                borderLeft: `3px solid ${active ? S.accent : "transparent"}`,
                background: active ? "rgba(120,169,255,0.07)" : "transparent",
                color: active ? S.accent : S.muted,
                fontSize: "0.86rem", fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "10px",
                fontWeight: active ? 600 : 400, textAlign: "left" as const,
                transition: "background 0.1s, color 0.1s" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.85, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
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
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <h1 style={{ color: S.text, fontSize: "0.9rem", fontWeight: 650,
              margin: 0, letterSpacing: "-0.01em" }}>Event Intelligence Center</h1>
            <span style={{ color: S.dim, fontSize: "0.78rem" }}>
              {NAV.find(n => n.id === view)?.label}
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
  const [pages, setPages] = useState(CONTENT_DEFAULTS.map(p => ({ ...p })));
  const [saved, setSaved] = useState<string | null>(null);

  const update = (i: number, key: string, val: string) => {
    setPages(ps => ps.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
    setSaved(null);
  };

  const inp: CSSProperties = { width: "100%", height: "36px", padding: "0 10px",
    background: "#262626", border: `1px solid ${S.line}`, color: S.text,
    fontSize: "0.88rem", fontFamily: "inherit", boxSizing: "border-box" };
  const ta: CSSProperties = { ...inp, height: "64px", padding: "8px 10px", resize: "vertical" as const };

  return (
    <div>
      <SectionHead kicker="Content Management" title="Hero copy for every Compass page."
        sub="Edit titles, body copy, and CTAs. Local state — wire to Firestore for persistence." />
      <div style={{ display: "grid", gap: "14px" }}>
        {pages.map((p, i) => (
          <Panel key={p.page}>
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>{p.page}</p>
                <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0 }}>{p.dest}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {saved === p.page && (
                  <span style={{ color: IBM.green, fontSize: "0.76rem", fontWeight: 650 }}>✓ Saved</span>
                )}
                <button type="button" onClick={() => setSaved(p.page)}
                  style={{ padding: "6px 14px", background: IBM.blue, border: "none",
                    color: "#fff", fontSize: "0.8rem", fontFamily: "inherit",
                    cursor: "pointer", fontWeight: 600 }}>Save</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { key: "title", label: "Hero Title",      el: "input"    },
                { key: "body",  label: "Hero Body",        el: "textarea" },
                { key: "cta",   label: "CTA Label",        el: "input"    },
                { key: "dest",  label: "CTA Destination",  el: "input"    },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: S.muted, fontSize: "0.72rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", display: "block", marginBottom: "5px" }}>
                    {f.label}
                  </label>
                  {f.el === "textarea"
                    ? <textarea style={ta} value={(p as Record<string, string>)[f.key]}
                        onChange={e => update(i, f.key, e.target.value)} />
                    : <input style={inp} value={(p as Record<string, string>)[f.key]}
                        onChange={e => update(i, f.key, e.target.value)} />
                  }
                </div>
              ))}
            </div>
          </Panel>
        ))}
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
    ingest:           <IngestView            data={data} />,
    exports:          <ExportsView />,
    audit:            <AuditView />,
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