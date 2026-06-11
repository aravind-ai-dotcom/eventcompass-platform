"use client";
// =============================================================================
// EventCompass — Admin Console   /admin
// Event Intelligence Center · IBM TechXchange 2026
//
// Route:   /admin  (direct URL only — never linked from attendee navigation)
// Auth:    Local session  (admin / Compass1234!)
// Future:  IBMid / SSO — swap ADMIN_CREDENTIALS + checkSession() only
//
// File usage:
//   Copy to  app/admin/page.tsx  in the Next.js project.
//   Admin has its own layout; do NOT wrap in the main site layout.
//   Add  app/admin/layout.tsx  with:  export default function AdminLayout
//     ({ children }) { return <>{children}</>; }
//   to prevent the global CompassHeader from rendering on /admin.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Version  — bump here for every release
// ─────────────────────────────────────────────────────────────────────────────

const COMPASS_VERSION = "1.0.4";

// ─────────────────────────────────────────────────────────────────────────────
// Auth  — replace body of checkCredentials() with IBMid SSO when ready
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = "compass_admin_v1";

function checkCredentials(u: string, p: string): boolean {
  return u === "admin" && p === "Compass1234!";
}
function persistSession()  { if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1"); }
function clearSession()    { if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY); }
function hasSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

type AdminView =
  | "dashboard" | "personas"  | "champions" | "snapshots"
  | "capacity"  | "consent"   | "activity"  | "content"
  | "ingest"    | "exports"   | "audit";

const NAV: { id: AdminView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard",   icon: "◈"  },
  { id: "content",   label: "Content",     icon: "✎"  },
  { id: "ingest",    label: "Data Ingest", icon: "⬆"  },
  { id: "personas",  label: "Personas",    icon: "◎"  },
  { id: "champions", label: "Champions",   icon: "★"  },
  { id: "snapshots", label: "Snapshots",   icon: "◷"  },
  { id: "capacity",  label: "Capacity",    icon: "▦"  },
  { id: "consent",   label: "Consent",     icon: "◻"  },
  { id: "activity",  label: "Activity",    icon: "◉"  },
  { id: "exports",   label: "Exports",     icon: "⬇"  },
  { id: "audit",     label: "Audit Log",   icon: "≡"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// IBM colour palette
// ─────────────────────────────────────────────────────────────────────────────

const IBM = {
  blue:    "#0f62fe",
  blueLight: "#78a9ff",
  purple:  "#6929c4",
  cyan:    "#009d9a",
  green:   "#24a148",
  red:     "#da1e28",
  yellow:  "#f1c21b",
  orange:  "#ff832b",
  maroon:  "#9f1853",
  teal:    "#007d79",
};

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic data — realistic TechXchange 2026 numbers
// ─────────────────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { label: "Active Right Now",        value: "2,481",  trend: "+4.2%", up: true,  live: true  },
  { label: "Compass Profiles Built",  value: "7,326",  trend: "+8.1%", up: true              },
  { label: "Champions Registered",    value: "486",    trend: "+8%",   up: true              },
  { label: "Schedules Created",       value: "5,122",  trend: "+12%",  up: true              },
  { label: "Sessions Saved",          value: "34,921", trend: "+18%",  up: true              },
  { label: "Connections Sparked",     value: "8,743",  trend: "+9%",   up: true              },
  { label: "Consent Participation",   value: "84%",    trend: "+3%",   up: true              },
];

const EXEC_INSIGHTS = [
  {
    question: "How many Champions registered?",
    count: "486", trend: "+8%", up: true,
    note: "Champion registrations tracking well ahead of prior year.",
    color: IBM.blue,
  },
  {
    question: "How many have not built Compass?",
    count: "142", trend: "−5%", up: false,
    note: "Most Champions are engaging. 29% still to activate.",
    color: IBM.yellow,
  },
  {
    question: "How many clients want AI roadmap sessions?",
    count: "1,284", trend: "+12%", up: true,
    note: "AI strategy demand continues to rise this week.",
    color: IBM.blue,
  },
  {
    question: "How many architects are interested in Red Hat?",
    count: "842", trend: "+15%", up: true,
    note: "Red Hat interest among architects is accelerating.",
    color: IBM.red,
  },
  {
    question: "How many students want mentoring?",
    count: "312", trend: "+18%", up: true,
    note: "Student mentoring demand is highest in 3 years.",
    color: IBM.purple,
  },
  {
    question: "How many partners want customer stories?",
    count: "224", trend: "+7%", up: true,
    note: "Partners are actively seeking proof points and case studies.",
    color: IBM.cyan,
  },
  {
    question: "How many are active right now?",
    count: "2,481", trend: "LIVE", up: true,
    note: "Peak activity window is underway — Tuesday afternoon surge.",
    color: IBM.green, live: true,
  },
];

const COMPASS_VALUE = [
  { label: "Profiles Created",             value: "7,326",   trend: "+8.1%",  note: ""               },
  { label: "Schedules Built",              value: "5,122",   trend: "+12%",   note: ""               },
  { label: "Recommendations Generated",    value: "284,731", trend: "+22%",   note: ""               },
  { label: "Recommendations Accepted",     value: "108,198", trend: "+18%",   note: "38.0% rate"     },
  { label: "Sessions Saved",               value: "34,921",  trend: "+18%",   note: ""               },
  { label: "People Saved",                 value: "8,743",   trend: "+9%",    note: ""               },
  { label: "Voice Requests",               value: "2,841",   trend: "+31%",   note: ""               },
  { label: "Refine My Compass Actions",    value: "12,482",  trend: "+14%",   note: ""               },
  { label: "Repeat Visits (2+ sessions)",  value: "4,921",   trend: "+7%",    note: ""               },
];

const PERSONA_DATA = [
  { label: "Developer",  registered: 2841, compass: 1943, active: 892,  color: IBM.blue    },
  { label: "Architect",  registered: 1942, compass: 1221, active: 642,  color: IBM.purple  },
  { label: "Executive",  registered: 986,  compass: 612,  active: 284,  color: IBM.maroon  },
  { label: "Champion",   registered: 486,  compass: 344,  active: 198,  color: IBM.yellow  },
  { label: "Student",    registered: 721,  compass: 489,  active: 312,  color: IBM.cyan    },
  { label: "Partner",    registered: 612,  compass: 398,  active: 187,  color: IBM.red     },
  { label: "Client",     registered: 1847, compass: 1103, active: 489,  color: IBM.blueLight },
  { label: "IBMer",      registered: 2421, compass: 1847, active: 943,  color: IBM.teal    },
];

const CHAMPION_METRICS = [
  { label: "Champions Registered",      value: 486,  color: IBM.blue   },
  { label: "Built Compass",             value: 344,  color: IBM.green  },
  { label: "Active Today",              value: 198,  color: IBM.cyan   },
  { label: "Not Using Compass",         value: 142,  color: IBM.yellow },
  { label: "Available for 1:1",         value: 186,  color: IBM.purple },
  { label: "Schedules Created",         value: 224,  color: IBM.teal   },
];

const CHAMPION_EXPERTISE = [
  { area: "AI & Machine Learning",  count: 186, pct: 83, color: IBM.blue    },
  { area: "Cloud & Hybrid",         count: 164, pct: 73, color: IBM.blueLight },
  { area: "Red Hat & Open Source",  count: 142, pct: 63, color: IBM.red     },
  { area: "Automation",             count: 128, pct: 57, color: IBM.purple  },
  { area: "Data & Analytics",       count: 119, pct: 53, color: IBM.cyan    },
  { area: "Security",               count: 97,  pct: 43, color: IBM.maroon  },
];

const TOP_CHAMPIONS = [
  { name: "Rania Ahmed",    domains: "AI, Cloud",            requested: 124, recommended: 312 },
  { name: "Tariq Hassan",   domains: "Red Hat, Automation",  requested: 112, recommended: 284 },
  { name: "Priya Sharma",   domains: "Data, Security",       requested: 108, recommended: 261 },
  { name: "Marcus Johnson", domains: "AI, Architecture",     requested: 97,  recommended: 238 },
  { name: "Li Wei",         domains: "Cloud, Open Source",   requested: 89,  recommended: 214 },
];

const CONSENT_DATA = [
  { label: "Public profile opt-in",  pct: 89, n: "8,220",  trend: "+2%", color: IBM.blue    },
  { label: "LinkedIn opt-in",        pct: 74, n: "6,841",  trend: "+5%", color: IBM.purple  },
  { label: "Alumni matching",        pct: 68, n: "6,282",  trend: "+4%", color: IBM.cyan    },
  { label: "Employer matching",      pct: 62, n: "5,732",  trend: "+3%", color: IBM.teal    },
  { label: "University matching",    pct: 71, n: "6,561",  trend: "+3%", color: IBM.blueLight },
  { label: "SMS opt-in",             pct: 43, n: "3,972",  trend: "+1%", color: IBM.yellow  },
  { label: "Intro request opt-in",   pct: 77, n: "7,116",  trend: "+6%", color: IBM.green   },
];

const CAPACITY_DATA = [
  { session: "AI Strategy Workshop",          capacity: 100,  saved: 143,  rec: 382,  risk: "HIGH"  as const, action: "Open overflow room"         },
  { session: "Red Hat Migration Lab",         capacity: 75,   saved: 89,   rec: 241,  risk: "HIGH"  as const, action: "Open overflow room"         },
  { session: "Architect Deep Dive: watsonx",  capacity: 120,  saved: 98,   rec: 186,  risk: "MED"   as const, action: "Monitor closely"             },
  { session: "Executive Briefing: watsonx",   capacity: 60,   saved: 54,   rec: 142,  risk: "MED"   as const, action: "Enable waitlist"             },
  { session: "Student Mentoring Roundtable",  capacity: 40,   saved: 38,   rec: 94,   risk: "MED"   as const, action: "Enable waitlist"             },
  { session: "IBM Partner Connect",           capacity: 200,  saved: 87,   rec: 143,  risk: "LOW"   as const, action: "No action needed"            },
  { session: "Tuesday Night Experience",      capacity: 2000, saved: 1421, rec: 4832, risk: "WATCH" as const, action: "Monitor ticket redemption"   },
  { session: "Community Champion Breakfast",  capacity: 150,  saved: 41,   rec: 68,   risk: "LOW"   as const, action: "No action needed"            },
];

const SNAPSHOTS = [
  { name: "Day 0 — Pre-Event",        time: "Oct 26, 08:00", profiles: 7326,  saved: 12481, reco: 89421,  active: 641,  sessions: 412  },
  { name: "Community Day Close",      time: "Oct 26, 18:00", profiles: 7891,  saved: 18234, reco: 121342, active: 2481, sessions: 489  },
  { name: "Before Tuesday Keynote",   time: "Oct 28, 08:00", profiles: 8124,  saved: 21847, reco: 138492, active: 4812, sessions: 521  },
  { name: "After Tuesday Keynote",    time: "Oct 28, 10:30", profiles: 8312,  saved: 28491, reco: 162841, active: 6241, sessions: 598  },
  { name: "Before Sandbox",           time: "Oct 28, 17:45", profiles: 8419,  saved: 31284, reco: 178421, active: 5821, sessions: 614  },
  { name: "Day 2 End",                time: "Oct 29, 22:00", profiles: 8641,  saved: 34921, reco: 198421, active: 3124, sessions: 631  },
];

type ActivityType = "profile" | "session" | "champion" | "reco" | "voice";

const ACTIVITY_FEED: { id: number; time: string; event: string; type: ActivityType; persona: string }[] = [
  { id: 1,  time: "2 sec ago",  event: "Sarah K. built her Compass profile",         type: "profile",  persona: "Developer"  },
  { id: 2,  time: "8 sec ago",  event: "Michael T. saved AI Strategy Workshop",      type: "session",  persona: "Architect"  },
  { id: 3,  time: "19 sec ago", event: "Priya S. connected with Champion match",     type: "champion", persona: "Executive"  },
  { id: 4,  time: "31 sec ago", event: "Kevin M. refined Compass profile",           type: "profile",  persona: "IBMer"      },
  { id: 5,  time: "45 sec ago", event: "John A. accepted 3 recommendations",         type: "reco",     persona: "Client"     },
  { id: 6,  time: "58 sec ago", event: "Amy L. saved Red Hat Migration Lab",         type: "session",  persona: "Architect"  },
  { id: 7,  time: "1 min ago",  event: "Rajesh P. built his Compass profile",        type: "profile",  persona: "Developer"  },
  { id: 8,  time: "1 min ago",  event: "Elena K. requested a Champion 1:1",          type: "champion", persona: "Student"    },
  { id: 9,  time: "2 min ago",  event: "David C. used Voice Compass",                type: "voice",    persona: "Executive"  },
  { id: 10, time: "2 min ago",  event: "Mei L. built her Compass profile",           type: "profile",  persona: "Partner"    },
  { id: 11, time: "3 min ago",  event: "James R. saved Tuesday Keynote",             type: "session",  persona: "Champion"   },
  { id: 12, time: "3 min ago",  event: "Fatima A. saved 2 Champions",               type: "champion", persona: "Client"     },
  { id: 13, time: "4 min ago",  event: "Thomas B. completed Compass (100% signal)",  type: "profile",  persona: "IBMer"      },
  { id: 14, time: "5 min ago",  event: "Ling W. saved AI Roadmap session",           type: "session",  persona: "Executive"  },
  { id: 15, time: "6 min ago",  event: "Marco S. requested Champion meeting",        type: "champion", persona: "Partner"    },
  { id: 16, time: "7 min ago",  event: "Hannah S. built her Compass profile",        type: "profile",  persona: "Student"    },
  { id: 17, time: "8 min ago",  event: "Ali M. accepted 5 session recommendations",  type: "reco",     persona: "Developer"  },
  { id: 18, time: "9 min ago",  event: "Sophie T. saved 4 sessions in a row",        type: "session",  persona: "Client"     },
  { id: 19, time: "10 min ago", event: "Yuki K. used Voice Compass",                 type: "voice",    persona: "Champion"   },
  { id: 20, time: "11 min ago", event: "Carlos R. refined Compass profile",          type: "profile",  persona: "Architect"  },
];

const AUDIT_LOG = [
  { time: "2026-10-28 14:32:11", user: "admin", action: "Content Updated",   before: "Old hero copy",             after: "New hero copy"                },
  { time: "2026-10-28 13:18:44", user: "admin", action: "Session Ingested",  before: "0 sessions",                after: "124 sessions imported"        },
  { time: "2026-10-28 11:02:19", user: "admin", action: "Champion Ingested", before: "0 champions",               after: "486 champions imported"       },
  { time: "2026-10-28 09:44:01", user: "admin", action: "Snapshot Created",  before: "—",                         after: "Before Tuesday Keynote"       },
  { time: "2026-10-27 22:11:38", user: "admin", action: "Content Updated",   before: "Explore hero v1",           after: "Explore hero v2"              },
  { time: "2026-10-27 18:08:54", user: "admin", action: "Snapshot Created",  before: "—",                         after: "Community Day Close"          },
  { time: "2026-10-27 16:41:22", user: "admin", action: "Export Generated",  before: "—",                         after: "Persona export (all personas)"},
  { time: "2026-10-27 12:24:10", user: "admin", action: "Session Ingested",  before: "124 sessions (capacity v1)","after": "124 sessions (capacity v2)" },
];

const CONTENT_DEFAULTS = [
  { page: "Home",          title: "Compass. Your TechXchange Advantage.",             body: "The first event intelligence platform that knows who you are, what you need, and who you should meet.",           cta: "Build My Compass",      dest: "/enroll"     },
  { page: "Explore",       title: "Your personal TechXchange starts here.",           body: "Compass maps your goals, tracks, and career into a personalised four-day plan.",                                   cta: "See the full schedule", dest: "/sessions"   },
  { page: "Sessions",      title: "Every session. Scored for you.",                   body: "2,481 attendees navigating 600+ sessions. Compass finds your signal.",                                             cta: "Browse all sessions",   dest: "/sessions"   },
  { page: "Champions",     title: "Meet the people who make TechXchange extraordinary.", body: "IBM Champions bring practical knowledge, generosity, and peer guidance.",                                      cta: "See matched Champions", dest: "/champions"  },
  { page: "Pulse",         title: "The heartbeat of TechXchange.",                    body: "Live signal from the event floor — sessions, people, and momentum in one view.",                                  cta: "View Pulse",            dest: "/pulse"      },
  { page: "My Experience", title: "TechXchange, built for you.",                      body: "Your personalised four-day plan, scored sessions, and Champion matches — all in one place.",                      cta: "Open My Compass",       dest: "/experience" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared style helpers
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  bg:     "#161616",
  sideBg: "#0f0f0f",
  panel:  "#1f1f1f",
  text:   "#f4f4f4",
  soft:   "#e0e0e0",
  muted:  "#a8a8a8",
  dim:    "#6f6f6f",
  line:   "#393939",
  lineStrong: "#525252",
  accent: "#78a9ff",
};

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
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

// Horizontal bar chart row
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
          {typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </span>
      </div>
      <div style={{ height: "6px", background: S.line, borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color,
          transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

// SVG donut chart
function Donut({ pct, color, size = 68 }: { pct: number; color: string; size?: number }) {
  const r  = (size - 14) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={S.line} strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt" />
    </svg>
  );
}

// Risk badge
function Risk({ level }: { level: "HIGH" | "MED" | "LOW" | "WATCH" }) {
  const cfg = {
    HIGH:  { bg: "rgba(218,30,40,0.12)",  border: "#da1e28", color: "#ff8389",  label: "HIGH"  },
    MED:   { bg: "rgba(241,194,27,0.10)", border: "#f1c21b", color: "#f1c21b",  label: "MED"   },
    LOW:   { bg: "rgba(36,161,72,0.10)",  border: "#24a148", color: "#42be65",  label: "LOW"   },
    WATCH: { bg: "rgba(255,131,43,0.10)", border: "#ff832b", color: "#ff832b",  label: "WATCH" },
  }[level];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px",
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em" }}>
      {cfg.label}
    </span>
  );
}

// Trend badge
function Trend({ text, up }: { text: string; up: boolean }) {
  const color = text === "LIVE" ? IBM.green : up ? IBM.green : IBM.yellow;
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 650, color,
      display: "flex", alignItems: "center", gap: "3px" }}>
      {text === "LIVE"
        ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: IBM.green,
            display: "inline-block", marginRight: "3px" }} />
        : <span>{up ? "▲" : "▼"}</span>
      }
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login screen — IBM sign-in aesthetic
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
      if (checkCredentials(username, password)) {
        persistSession();
        onSuccess();
      } else {
        setError("The username or password you entered is incorrect.");
        setLoading(false);
      }
    }, 400);
  }, [username, password, onSuccess]);

  const field: CSSProperties = {
    width: "100%", height: "40px", padding: "0 12px",
    background: "#262626", border: `1px solid ${S.line}`,
    color: S.text, fontSize: "0.92rem", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };
  const label: CSSProperties = {
    display: "block", color: S.muted, fontSize: "0.78rem",
    fontWeight: 600, marginBottom: "6px", letterSpacing: "0.02em",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px",
    }}>
      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "400px",
        background: S.panel, border: `1px solid ${S.line}`,
        borderTop: `3px solid ${IBM.blue}`,
        padding: "40px 36px 36px",
      }}>
        {/* IBM wordmark + product */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: S.muted, fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>
            IBM
          </p>
          <h1 style={{ color: S.text, fontSize: "1.35rem", fontWeight: 600,
            letterSpacing: "-0.025em", margin: "0 0 4px" }}>
            Compass
          </h1>
          <p style={{ color: S.muted, fontSize: "0.88rem", margin: 0 }}>
            Event Intelligence Center
          </p>
        </div>

        <p style={{ color: S.soft, fontSize: "0.92rem", margin: "0 0 24px",
          fontWeight: 500 }}>
          Administrator sign-in
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={label} htmlFor="adm-user">Username</label>
            <input
              id="adm-user"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              style={field}
              required
            />
          </div>
          <div>
            <label style={label} htmlFor="adm-pass">Password</label>
            <input
              id="adm-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              style={field}
              required
            />
          </div>

          {error && (
            <p style={{ color: "#ff8389", fontSize: "0.82rem", margin: 0,
              background: "rgba(218,30,40,0.08)", border: "1px solid rgba(218,30,40,0.3)",
              padding: "8px 12px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "44px", background: loading ? "#4c4c4c" : IBM.blue,
              color: "#ffffff", border: "none", fontSize: "0.92rem",
              fontWeight: 650, fontFamily: "inherit", cursor: loading ? "default" : "pointer",
              marginTop: "8px", letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px",
          borderTop: `1px solid ${S.line}` }}>
          <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0, lineHeight: 1.5 }}>
            IBM SSO / IBMid access coming soon. This admin console is accessible by
            authorised event operations staff only.
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
// Admin layout — sidebar + top bar + scrollable content
// ─────────────────────────────────────────────────────────────────────────────

function AdminLayout({
  children, view, setView, onLogout,
}: {
  children: ReactNode;
  view: AdminView;
  setView: (v: AdminView) => void;
  onLogout: () => void;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", background: S.bg,
      overflow: "hidden", fontFamily: "IBM Plex Sans, system-ui, sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: "232px", background: S.sideBg,
        borderRight: `1px solid ${S.line}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        overflowY: "auto",
      }}>
        {/* Brand */}
        <div style={{ padding: "22px 20px 18px",
          borderBottom: `1px solid ${S.line}` }}>
          <p style={{ color: S.accent, fontSize: "0.62rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 3px" }}>
            Compass
          </p>
          <p style={{ color: S.text, fontSize: "1rem", fontWeight: 650,
            margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Admin Console
          </p>
          <p style={{ color: S.dim, fontSize: "0.72rem", margin: "0 0 10px" }}>
            IBM TechXchange 2026
          </p>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "0.62rem", color: IBM.green, fontWeight: 650,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%",
              background: IBM.green, display: "inline-block" }} />
            Live
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "10px 0" }} aria-label="Admin navigation">
          {NAV.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                style={{
                  width: "100%", padding: "9px 20px",
                  border: "none",
                  borderLeft: `3px solid ${active ? S.accent : "transparent"}`,
                  background: active ? "rgba(120,169,255,0.07)" : "transparent",
                  color: active ? S.accent : S.muted,
                  fontSize: "0.86rem", fontFamily: "inherit",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", gap: "10px",
                  fontWeight: active ? 600 : 400,
                  textAlign: "left",
                  transition: "background 0.1s, color 0.1s",
                }}
              >
                <span style={{ fontSize: "0.75rem", opacity: 0.85, flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Version + sign out */}
        <div style={{ padding: "14px 20px 18px",
          borderTop: `1px solid ${S.line}` }}>
          <p style={{ color: S.dim, fontSize: "0.7rem", margin: "0 0 10px" }}>
            v{COMPASS_VERSION}
          </p>
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: "100%", padding: "7px 12px",
              border: `1px solid ${S.line}`,
              background: "transparent", color: S.muted,
              fontSize: "0.8rem", fontFamily: "inherit",
              cursor: "pointer", textAlign: "left",
            }}
          >
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: "52px", background: S.bg,
          borderBottom: `1px solid ${S.line}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px", flexShrink: 0,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <h1 style={{ color: S.text, fontSize: "0.9rem", fontWeight: 650,
              margin: 0, letterSpacing: "-0.01em" }}>
              Event Intelligence Center
            </h1>
            <span style={{ color: S.dim, fontSize: "0.78rem" }}>
              {NAV.find(n => n.id === view)?.label}
            </span>
          </div>
          <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>
            IBM TechXchange 2026 · Atlanta · Oct 26–30
          </p>
        </div>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard view
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div>
        <Kicker>Live metrics</Kicker>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: "1px",
          background: S.line, border: `1px solid ${S.line}` }}>
          {KPI_CARDS.map(k => (
            <div key={k.label} style={{ background: S.panel, padding: "20px 18px" }}>
              <p style={{ color: S.muted, fontSize: "0.72rem", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px",
                lineHeight: 1.3 }}>
                {k.label}
              </p>
              <div style={{ display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 520,
                  letterSpacing: "-0.04em", color: S.text, lineHeight: 1 }}>
                  {k.value}
                </span>
                <Trend text={k.trend} up={k.up} />
              </div>
              {k.live && (
                <p style={{ color: IBM.green, fontSize: "0.68rem", fontWeight: 650,
                  textTransform: "uppercase", letterSpacing: "0.08em", margin: "8px 0 0" }}>
                  ● Live
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Executive Insights ────────────────────────────────────────────── */}
      <div>
        <SectionHead
          kicker="Executive Insights"
          title="What matters right now."
          sub="Plain language signals for leadership, operations, and community teams."
        />
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {EXEC_INSIGHTS.map(ins => (
            <Panel key={ins.question} style={{ borderTop: `3px solid ${ins.color}` }}>
              <p style={{ color: S.muted, fontSize: "0.78rem", margin: "0 0 14px",
                lineHeight: 1.4 }}>
                {ins.question}
              </p>
              <div style={{ display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 520,
                  letterSpacing: "-0.05em", color: ins.color, lineHeight: 1 }}>
                  {ins.count}
                </span>
                <Trend text={ins.trend} up={ins.up} />
              </div>
              <p style={{ color: S.dim, fontSize: "0.78rem", margin: 0,
                fontStyle: "italic", lineHeight: 1.4 }}>
                &ldquo;{ins.note}&rdquo;
              </p>
            </Panel>
          ))}
        </div>
      </div>

      {/* ── Compass Value ──────────────────────────────────────────────────── */}
      <div>
        <SectionHead
          kicker="Compass Value"
          title="Proving the platform."
          sub="Every metric below is a direct output of Compass — trackable, reportable, real."
        />
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1px",
          background: S.line, border: `1px solid ${S.line}` }}>
          {COMPASS_VALUE.map(m => (
            <div key={m.label} style={{ background: S.panel, padding: "18px 20px",
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: "12px" }}>
              <div>
                <p style={{ color: S.muted, fontSize: "0.78rem", margin: "0 0 6px",
                  lineHeight: 1.3 }}>
                  {m.label}
                </p>
                {m.note && (
                  <p style={{ color: IBM.blueLight, fontSize: "0.72rem", margin: "4px 0 0",
                    fontWeight: 600 }}>
                    {m.note}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "1.55rem", fontWeight: 520,
                  letterSpacing: "-0.03em", color: S.text, margin: "0 0 2px", lineHeight: 1 }}>
                  {m.value}
                </p>
                <Trend text={m.trend} up={true} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick consent + personas row ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Persona adoption snapshot */}
        <Panel>
          <PanelLabel>Persona Adoption</PanelLabel>
          {PERSONA_DATA.map(p => {
            const max = PERSONA_DATA.reduce((m, d) => Math.max(m, d.registered), 0);
            return (
              <HBar key={p.label} label={p.label} value={p.registered}
                maxVal={max} color={p.color} />
            );
          })}
          <p style={{ color: S.dim, fontSize: "0.72rem", margin: "12px 0 0" }}>
            Registered attendees by persona ·{" "}
            <button type="button" onClick={() => {}} style={{ color: S.accent,
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.72rem", fontFamily: "inherit", padding: 0 }}>
              Full breakdown →
            </button>
          </p>
        </Panel>

        {/* Consent snapshot */}
        <Panel>
          <PanelLabel>Consent Participation</PanelLabel>
          {CONSENT_DATA.map(c => (
            <HBar key={c.label} label={c.label} value={c.pct}
              maxVal={100} color={c.color} suffix="%" />
          ))}
        </Panel>
      </div>

      {/* ── Build Information ──────────────────────────────────────────────── */}
      <Panel style={{ borderLeft: `3px solid ${IBM.blue}` }}>
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>

          <div>
            <PanelLabel>Build Information</PanelLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px",
              marginBottom: "16px" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 650,
                color: S.text, letterSpacing: "-0.02em" }}>
                Compass
              </span>
              <span style={{ fontSize: "0.78rem", color: S.muted,
                fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                v{COMPASS_VERSION}
              </span>
            </div>

            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px 32px" }}>
              <div>
                <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 3px" }}>
                  Product Creator
                </p>
                <p style={{ color: S.soft, fontSize: "0.88rem", margin: 0, fontWeight: 500 }}>
                  Aravind Ragupathi
                </p>
              </div>
              <div>
                <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 3px" }}>
                  Status
                </p>
                <p style={{ color: IBM.yellow, fontSize: "0.88rem", margin: 0, fontWeight: 600 }}>
                  Prototype · Internal Demo
                </p>
              </div>
              <div>
                <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 5px" }}>
                  Built Using
                </p>
                {["IBM technologies including Bob", "Firebase", "Next.js", "TypeScript"].map(t => (
                  <p key={t} style={{ color: S.muted, fontSize: "0.82rem",
                    margin: "0 0 2px" }}>
                    · {t}
                  </p>
                ))}
              </div>
              <div>
                <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 5px" }}>
                  AI Development Assistants
                </p>
                {["OpenAI ChatGPT", "Anthropic Claude Sonnet"].map(t => (
                  <p key={t} style={{ color: S.muted, fontSize: "0.82rem",
                    margin: "0 0 2px" }}>
                    · {t}
                  </p>
                ))}
              </div>
              <div>
                <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 700, margin: "0 0 5px" }}>
                  Voice Services
                </p>
                <p style={{ color: S.muted, fontSize: "0.82rem", margin: 0 }}>
                  · ElevenLabs (planned)
                </p>
              </div>
            </div>
          </div>
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
// Personas view
// ─────────────────────────────────────────────────────────────────────────────

function PersonasView() {
  const maxReg = PERSONA_DATA.reduce((m, d) => Math.max(m, d.registered), 0);
  return (
    <div>
      <SectionHead
        kicker="Persona Intelligence"
        title="Who is at TechXchange 2026."
        sub="Registered attendees broken down by persona — with Compass adoption and activity signals."
      />
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
        {PERSONA_DATA.map(p => {
          const adoptPct = Math.round((p.compass / p.registered) * 100);
          const activePct = Math.round((p.active / p.registered) * 100);
          return (
            <Panel key={p.label} style={{ borderTop: `3px solid ${p.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <p style={{ color: S.text, fontSize: "1.05rem", fontWeight: 600,
                    margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                    {p.label}
                  </p>
                  <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0 }}>
                    {adoptPct}% Compass adoption · {activePct}% active today
                  </p>
                </div>
                <span style={{ fontSize: "1.8rem", fontWeight: 520,
                  letterSpacing: "-0.04em", color: p.color, lineHeight: 1 }}>
                  {p.registered.toLocaleString()}
                </span>
              </div>
              <HBar label="Registered"       value={p.registered} maxVal={maxReg}  color={p.color}              />
              <HBar label="Built Compass"     value={p.compass}    maxVal={p.registered} color={p.color}         />
              <HBar label="Active Today"      value={p.active}     maxVal={p.registered} color={IBM.green}       />
              <div style={{ marginTop: "12px", paddingTop: "12px",
                borderTop: `1px solid ${S.line}`,
                display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", margin: "0 0 2px" }}>Not on Compass</p>
                  <p style={{ color: IBM.yellow, fontSize: "0.92rem", fontWeight: 600,
                    margin: 0 }}>
                    {(p.registered - p.compass).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: S.dim, fontSize: "0.68rem", textTransform: "uppercase",
                    letterSpacing: "0.08em", margin: "0 0 2px" }}>Adoption Rate</p>
                  <p style={{ color: S.soft, fontSize: "0.92rem", fontWeight: 600,
                    margin: 0 }}>
                    {adoptPct}%
                  </p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Champions view
// ─────────────────────────────────────────────────────────────────────────────

function ChampionsView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead
        kicker="Champion Intelligence"
        title="The people who make TechXchange extraordinary."
        sub="Registrations, Compass adoption, activity, and expertise breakdown."
      />

      {/* Champion KPI row */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1px",
        background: S.line, border: `1px solid ${S.line}` }}>
        {CHAMPION_METRICS.map(m => (
          <div key={m.label} style={{ background: S.panel, padding: "18px 16px" }}>
            <p style={{ color: S.muted, fontSize: "0.72rem", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 8px", lineHeight: 1.3 }}>
              {m.label}
            </p>
            <span style={{ fontSize: "2.1rem", fontWeight: 520,
              letterSpacing: "-0.04em", color: m.color, lineHeight: 1 }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Compass adoption callout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
        {[
          { q: "How many attending per Compass?",    v: "344", sub: "of 486 registered", color: IBM.blue   },
          { q: "How many made schedules?",           v: "224", sub: "46% of Champions",  color: IBM.cyan   },
          { q: "How many are active today?",         v: "198", sub: "active right now",  color: IBM.green  },
          { q: "How many did not use Compass?",      v: "142", sub: "29% not activated", color: IBM.yellow },
        ].map(item => (
          <Panel key={item.q} style={{ borderTop: `3px solid ${item.color}` }}>
            <p style={{ color: S.muted, fontSize: "0.78rem", margin: "0 0 12px",
              lineHeight: 1.4 }}>
              {item.q}
            </p>
            <p style={{ fontSize: "2.4rem", fontWeight: 520,
              letterSpacing: "-0.05em", color: item.color, margin: "0 0 4px", lineHeight: 1 }}>
              {item.v}
            </p>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0 }}>{item.sub}</p>
          </Panel>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Expertise bars */}
        <Panel>
          <PanelLabel>Top Expertise Areas</PanelLabel>
          {CHAMPION_EXPERTISE.map(e => (
            <HBar key={e.area} label={e.area} value={e.count}
              maxVal={220} color={e.color} />
          ))}
        </Panel>

        {/* Most requested */}
        <Panel>
          <PanelLabel>Most Requested Champions</PanelLabel>
          <div style={{ display: "grid", gap: "1px", background: S.line,
            marginBottom: "16px" }}>
            {TOP_CHAMPIONS.map((c, i) => (
              <div key={c.name} style={{ background: S.bg,
                padding: "10px 14px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: S.dim, fontSize: "0.76rem",
                    fontVariantNumeric: "tabular-nums", width: "16px",
                    flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  <div>
                    <p style={{ color: S.soft, fontSize: "0.86rem",
                      fontWeight: 550, margin: 0 }}>{c.name}</p>
                    <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>
                      {c.domains}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: S.text, fontSize: "0.86rem",
                    fontWeight: 600, margin: 0 }}>
                    {c.requested} requests
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.72rem", margin: 0 }}>
                    {c.recommended} recommended
                  </p>
                </div>
              </div>
            ))}
          </div>
          <PanelLabel>Adoption Funnel</PanelLabel>
          <HBar label="Registered"      value={486} maxVal={486} color={IBM.blue}    />
          <HBar label="Built Compass"   value={344} maxVal={486} color={IBM.cyan}    />
          <HBar label="Made schedules"  value={224} maxVal={486} color={IBM.green}   />
          <HBar label="Active today"    value={198} maxVal={486} color={IBM.purple}  />
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshots view
// ─────────────────────────────────────────────────────────────────────────────

function SnapshotsView() {
  const [active, setActive] = useState(0);
  const snap = SNAPSHOTS[active];
  const prev = active > 0 ? SNAPSHOTS[active - 1] : null;

  const delta = (curr: number, p: number | undefined) =>
    p !== undefined ? `+${(curr - p).toLocaleString()}` : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <SectionHead
        kicker="Snapshot Intelligence"
        title="Moments captured in time."
        sub="Compare platform state before and after key event moments."
      />

      {/* Snapshot selector */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {SNAPSHOTS.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => setActive(i)}
            style={{
              padding: "8px 16px", border: `1px solid ${active === i ? S.accent : S.line}`,
              background: active === i ? "rgba(120,169,255,0.08)" : "transparent",
              color: active === i ? S.accent : S.muted,
              fontSize: "0.82rem", fontFamily: "inherit",
              cursor: "pointer", fontWeight: active === i ? 600 : 400,
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Snapshot card */}
      <Panel style={{ borderTop: `3px solid ${IBM.blue}` }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <p style={{ color: S.text, fontSize: "1.1rem", fontWeight: 600,
              margin: "0 0 4px" }}>{snap.name}</p>
            <p style={{ color: S.muted, fontSize: "0.82rem", margin: 0 }}>
              Captured {snap.time}
            </p>
          </div>
          <span style={{ padding: "4px 12px", border: `1px solid ${IBM.blue}`,
            color: IBM.blueLight, fontSize: "0.72rem", fontWeight: 650,
            letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Snapshot
          </span>
        </div>
        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1px",
          background: S.line }}>
          {[
            { label: "Active Users",   value: snap.active,   d: delta(snap.active,   prev?.active)   },
            { label: "Profiles Built", value: snap.profiles, d: delta(snap.profiles, prev?.profiles) },
            { label: "Sessions Saved", value: snap.saved,    d: delta(snap.saved,    prev?.saved)    },
            { label: "Recommendations",value: snap.reco,     d: delta(snap.reco,     prev?.reco)     },
          ].map(m => (
            <div key={m.label} style={{ background: S.bg, padding: "16px" }}>
              <p style={{ color: S.muted, fontSize: "0.7rem", textTransform: "uppercase",
                letterSpacing: "0.08em", margin: "0 0 8px" }}>{m.label}</p>
              <p style={{ fontSize: "1.8rem", fontWeight: 520,
                letterSpacing: "-0.04em", color: S.text, margin: "0 0 4px", lineHeight: 1 }}>
                {m.value.toLocaleString()}
              </p>
              {prev && (
                <p style={{ color: IBM.green, fontSize: "0.74rem",
                  fontWeight: 600, margin: 0 }}>
                  {m.d} since prev
                </p>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Timeline */}
      <Panel>
        <PanelLabel>Snapshot Timeline — Active Users</PanelLabel>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px",
          height: "80px" }}>
          {SNAPSHOTS.map((s, i) => {
            const maxV = SNAPSHOTS.reduce((m, x) => Math.max(m, x.active), 0);
            const h = Math.max(8, Math.round((s.active / maxV) * 80));
            return (
              <div key={s.name} style={{ flex: 1, display: "flex",
                flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.62rem", color: S.dim,
                  fontVariantNumeric: "tabular-nums" }}>
                  {s.active.toLocaleString()}
                </span>
                <div style={{ width: "100%", height: h,
                  background: i === active ? IBM.blueLight : IBM.blue,
                  transition: "height 0.4s" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          {SNAPSHOTS.map(s => (
            <div key={s.name} style={{ flex: 1 }}>
              <p style={{ color: S.dim, fontSize: "0.62rem", textAlign: "center",
                margin: 0, lineHeight: 1.3 }}>
                {s.time}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Capacity view
// ─────────────────────────────────────────────────────────────────────────────

function CapacityView() {
  return (
    <div>
      <SectionHead
        kicker="Capacity Risk Center"
        title="Where demand exceeds supply."
        sub="Sessions approaching or exceeding capacity — with Compass recommendation pressure factored in."
      />
      <div style={{ display: "grid", gap: "10px" }}>
        {CAPACITY_DATA.map(c => {
          const savedPct  = Math.round((c.saved  / c.capacity) * 100);
          const recPct    = Math.min(300, Math.round((c.rec / c.capacity) * 100));
          return (
            <Panel key={c.session}>
              <div style={{ display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: "16px",
                flexWrap: "wrap", marginBottom: "14px" }}>
                <div>
                  <p style={{ color: S.text, fontSize: "0.97rem", fontWeight: 600,
                    margin: "0 0 4px" }}>
                    {c.session}
                  </p>
                  <p style={{ color: S.dim, fontSize: "0.78rem", margin: 0 }}>
                    Suggested action: {c.action}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center",
                  gap: "12px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: S.muted, fontSize: "0.68rem",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      margin: "0 0 2px" }}>
                      Capacity / Saved / Recommended
                    </p>
                    <p style={{ color: S.soft, fontSize: "0.88rem",
                      fontWeight: 600, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                      {c.capacity.toLocaleString()} · {c.saved.toLocaleString()} · {c.rec.toLocaleString()}
                    </p>
                  </div>
                  <Risk level={c.risk} />
                </div>
              </div>
              {/* Capacity fill bar */}
              <div style={{ position: "relative", height: "12px",
                background: S.line, borderRadius: "1px", overflow: "hidden" }}>
                {/* Saved bar */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                  width: Math.min(100, savedPct) + "%",
                  background: c.risk === "HIGH" ? IBM.red
                    : c.risk === "MED" ? IBM.yellow
                    : IBM.green,
                  transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                <span style={{ color: S.dim, fontSize: "0.68rem" }}>
                  Saved: {savedPct}% of capacity
                </span>
                <span style={{ color: S.dim, fontSize: "0.68rem" }}>
                  Recommended pressure: {recPct}% of capacity
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
// Consent view
// ─────────────────────────────────────────────────────────────────────────────

function ConsentView() {
  return (
    <div>
      <SectionHead
        kicker="Consent & Trust"
        title="Privacy adoption at TechXchange 2026."
        sub="Demonstrating trust and transparency — opt-in rates across all consent dimensions."
      />

      {/* Donut row */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px",
        marginBottom: "28px" }}>
        {CONSENT_DATA.map(c => (
          <Panel key={c.label} style={{ textAlign: "center" as const }}>
            <div style={{ position: "relative", display: "inline-block",
              marginBottom: "10px" }}>
              <Donut pct={c.pct} color={c.color} size={80} />
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "1.1rem", fontWeight: 600, color: S.text,
                pointerEvents: "none",
              }}>
                {c.pct}%
              </span>
            </div>
            <p style={{ color: S.soft, fontSize: "0.82rem", fontWeight: 550,
              margin: "0 0 3px", lineHeight: 1.3 }}>
              {c.label}
            </p>
            <p style={{ color: S.dim, fontSize: "0.74rem", margin: "0 0 4px" }}>
              {c.n} opted in
            </p>
            <Trend text={c.trend} up={true} />
          </Panel>
        ))}
      </div>

      {/* Horizontal bars for comparison */}
      <Panel>
        <PanelLabel>Consent Opt-in Comparison</PanelLabel>
        {CONSENT_DATA.map(c => (
          <HBar key={c.label} label={c.label} value={c.pct}
            maxVal={100} color={c.color} suffix="%" />
        ))}
        <p style={{ color: S.dim, fontSize: "0.76rem", margin: "14px 0 0",
          lineHeight: 1.5 }}>
          Based on {(9240).toLocaleString()} participant records.
          SMS opt-in (43%) is below target — consider in-app prompt at Day 1 check-in.
        </p>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity view
// ─────────────────────────────────────────────────────────────────────────────

function ActivityView() {
  const [feed, setFeed] = useState(ACTIVITY_FEED);
  const counterRef = useRef(21);

  useEffect(() => {
    const names   = ["Alex N.", "Sofía M.", "Rahim A.", "Jing L.", "Lena H.", "Omar S.", "Yara B."];
    const actions = [
      ["built Compass profile", "profile"],
      ["saved a session",       "session"],
      ["added a Champion",      "champion"],
      ["accepted recommendations","reco"],
      ["used Voice Compass",    "voice"],
      ["refined Compass",       "profile"],
    ] as [string, ActivityType][];
    const personas = ["Developer", "Architect", "Executive", "Champion", "Student", "Partner", "Client", "IBMer"];

    const timer = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const [action, type] = actions[Math.floor(Math.random() * actions.length)];
      const persona = personas[Math.floor(Math.random() * personas.length)];
      const newEntry = {
        id: counterRef.current++,
        time: "just now",
        event: `${name} ${action}`,
        type,
        persona,
      };
      setFeed(f => [newEntry, ...f.slice(0, 29)]);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const typeColor: Record<ActivityType, string> = {
    profile:  IBM.blue,
    session:  IBM.cyan,
    champion: IBM.purple,
    reco:     IBM.green,
    voice:    IBM.orange,
  };
  const typeLabel: Record<ActivityType, string> = {
    profile:  "Profile",
    session:  "Session",
    champion: "Champion",
    reco:     "Recommendation",
    voice:    "Voice",
  };

  return (
    <div>
      <SectionHead
        kicker="Activity Center"
        title="Live Compass activity."
        sub="Real-time stream of attendee actions — updating every few seconds."
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "16px" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%",
          background: IBM.green, display: "inline-block" }} />
        <span style={{ color: IBM.green, fontSize: "0.78rem",
          fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Live — updating
        </span>
        <span style={{ color: S.dim, fontSize: "0.78rem" }}>
          Showing last 30 actions
        </span>
      </div>

      <div style={{ display: "grid", gap: "1px", background: S.line,
        border: `1px solid ${S.line}` }}>
        {feed.map(item => (
          <div key={item.id} style={{
            background: item.time === "just now" ? "rgba(36,161,72,0.04)" : S.panel,
            padding: "10px 16px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px",
            transition: "background 0.3s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "1px 8px", fontSize: "0.64rem",
                fontWeight: 650, letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: typeColor[item.type] + "18",
                border: `1px solid ${typeColor[item.type]}44`,
                color: typeColor[item.type], flexShrink: 0,
              }}>
                {typeLabel[item.type]}
              </span>
              <p style={{ color: S.soft, fontSize: "0.86rem", margin: 0 }}>
                {item.event}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center",
              flexShrink: 0 }}>
              <span style={{ color: S.dim, fontSize: "0.72rem" }}>{item.persona}</span>
              <span style={{ color: S.dim, fontSize: "0.72rem",
                fontVariantNumeric: "tabular-nums", minWidth: "72px",
                textAlign: "right" as const }}>
                {item.time}
              </span>
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
  const save = (page: string) => { setSaved(page); };

  const inp: CSSProperties = {
    width: "100%", height: "36px", padding: "0 10px",
    background: "#262626", border: `1px solid ${S.line}`,
    color: S.text, fontSize: "0.88rem", fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const textarea: CSSProperties = {
    ...inp, height: "64px", padding: "8px 10px",
    resize: "vertical" as const,
  };

  return (
    <div>
      <SectionHead
        kicker="Content Management"
        title="Hero copy for every Compass page."
        sub="Edit titles, body copy, and CTAs. Changes are local to this session — wire to Firestore for persistence."
      />
      <div style={{ display: "grid", gap: "14px" }}>
        {pages.map((p, i) => (
          <Panel key={p.page}>
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>
                  {p.page}
                </p>
                <p style={{ color: S.muted, fontSize: "0.78rem", margin: 0 }}>
                  {p.dest}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {saved === p.page && (
                  <span style={{ color: IBM.green, fontSize: "0.76rem",
                    fontWeight: 650 }}>✓ Saved</span>
                )}
                <button
                  type="button"
                  onClick={() => save(p.page)}
                  style={{ padding: "6px 14px", background: IBM.blue,
                    border: "none", color: "#fff", fontSize: "0.8rem",
                    fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}
                >
                  Save
                </button>
              </div>
            </div>
            <div style={{ display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ color: S.muted, fontSize: "0.72rem",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: "5px" }}>
                  Hero Title
                </label>
                <input
                  style={inp}
                  value={p.title}
                  onChange={e => update(i, "title", e.target.value)}
                />
              </div>
              <div>
                <label style={{ color: S.muted, fontSize: "0.72rem",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: "5px" }}>
                  Hero Body
                </label>
                <textarea
                  style={textarea}
                  value={p.body}
                  onChange={e => update(i, "body", e.target.value)}
                />
              </div>
              <div>
                <label style={{ color: S.muted, fontSize: "0.72rem",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: "5px" }}>
                  CTA Label
                </label>
                <input
                  style={inp}
                  value={p.cta}
                  onChange={e => update(i, "cta", e.target.value)}
                />
              </div>
              <div>
                <label style={{ color: S.muted, fontSize: "0.72rem",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: "5px" }}>
                  CTA Destination
                </label>
                <input
                  style={inp}
                  value={p.dest}
                  onChange={e => update(i, "dest", e.target.value)}
                />
              </div>
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

function IngestView() {
  const [status, setStatus] = useState<Record<string, "idle"|"loading"|"done"|"error">>({});
  const simulate = (type: string) => {
    setStatus(s => ({ ...s, [type]: "loading" }));
    setTimeout(() => setStatus(s => ({ ...s, [type]: "done" })), 1800);
  };

  const INGEST_TYPES = [
    { id: "sessions",   label: "Sessions",    count: 124, errors: 0, warnings: 3, schema: "title, type, day, start_time, room, tracks, capacity"   },
    { id: "champions",  label: "Champions",   count: 486, errors: 0, warnings: 1, schema: "display_name, title, organization, profile, attendance"  },
    { id: "communities",label: "Communities", count: 42,  errors: 0, warnings: 0, schema: "name, type, lead, description, session_ids"              },
    { id: "sponsors",   label: "Sponsors",    count: 38,  errors: 0, warnings: 0, schema: "name, tier, logo_url, booth, session_ids"                },
  ];

  return (
    <div>
      <SectionHead
        kicker="Data Ingest"
        title="Upload and validate event data."
        sub="Upload CSV or JSON files. Compass validates schema, previews rows, and reports errors before committing."
      />
      <div style={{ display: "grid", gap: "14px" }}>
        {INGEST_TYPES.map(t => (
          <Panel key={t.id}>
            <div style={{ display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: S.text, fontSize: "0.97rem", fontWeight: 600,
                  margin: "0 0 4px" }}>
                  {t.label}
                </p>
                <p style={{ color: S.dim, fontSize: "0.76rem", margin: "0 0 12px",
                  fontFamily: "IBM Plex Mono, monospace", lineHeight: 1.4 }}>
                  Schema: {t.schema}
                </p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ color: IBM.green, fontSize: "0.78rem",
                    fontWeight: 650 }}>
                    ✓ {t.count} rows imported
                  </span>
                  {t.errors > 0 && (
                    <span style={{ color: IBM.red, fontSize: "0.78rem", fontWeight: 650 }}>
                      ✕ {t.errors} errors
                    </span>
                  )}
                  {t.warnings > 0 && (
                    <span style={{ color: IBM.yellow, fontSize: "0.78rem", fontWeight: 650 }}>
                      ⚠ {t.warnings} warnings
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {status[t.id] === "done" && (
                  <span style={{ color: IBM.green, fontSize: "0.8rem",
                    fontWeight: 650, alignSelf: "center" }}>✓ Uploaded</span>
                )}
                {status[t.id] === "loading" && (
                  <span style={{ color: S.muted, fontSize: "0.8rem",
                    alignSelf: "center" }}>Validating…</span>
                )}
                <button
                  type="button"
                  onClick={() => simulate(t.id)}
                  disabled={status[t.id] === "loading"}
                  style={{ padding: "7px 16px",
                    border: `1px solid ${S.line}`,
                    background: "transparent", color: S.soft,
                    fontSize: "0.82rem", fontFamily: "inherit",
                    cursor: "pointer" }}
                >
                  Upload {t.label}
                </button>
                <button
                  type="button"
                  style={{ padding: "7px 16px",
                    border: `1px solid ${IBM.blue}`,
                    background: "transparent", color: IBM.blueLight,
                    fontSize: "0.82rem", fontFamily: "inherit",
                    cursor: "pointer" }}
                >
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
    { id: "sessions-csv",    format: "CSV",  label: "Session Catalog",         size: "~124 KB", rows: "600 sessions"         },
    { id: "champions-csv",   format: "CSV",  label: "Champion Registry",       size: "~82 KB",  rows: "486 Champions"        },
    { id: "personas-csv",    format: "CSV",  label: "Persona Breakdown",       size: "~18 KB",  rows: "8 personas · all data"},
    { id: "consent-csv",     format: "CSV",  label: "Consent Export",          size: "~241 KB", rows: "9,240 participants"   },
    { id: "snapshots-json",  format: "JSON", label: "Snapshot Export",         size: "~64 KB",  rows: "6 snapshots"          },
    { id: "activity-json",   format: "JSON", label: "Activity Log",            size: "~2.1 MB", rows: "All events"           },
    { id: "champions-json",  format: "JSON", label: "Champion Full Profile",   size: "~380 KB", rows: "486 Champions"        },
    { id: "full-json",       format: "JSON", label: "Full Platform Export",    size: "~12 MB",  rows: "Complete dataset"     },
  ];

  return (
    <div>
      <SectionHead
        kicker="Exports"
        title="Data portability for your team."
        sub="Export Compass data as CSV or JSON. All exports include a timestamp and version header."
      />
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1px",
        background: S.line, border: `1px solid ${S.line}` }}>
        {EXPORTS.map(ex => (
          <div key={ex.id} style={{ background: S.panel, padding: "18px 20px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center",
                gap: "8px", marginBottom: "4px" }}>
                <span style={{ padding: "1px 7px",
                  border: `1px solid ${ex.format === "CSV" ? IBM.cyan : IBM.purple}`,
                  color: ex.format === "CSV" ? IBM.cyan : IBM.purple,
                  fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.06em" }}>
                  {ex.format}
                </span>
                <p style={{ color: S.soft, fontSize: "0.88rem",
                  fontWeight: 550, margin: 0 }}>
                  {ex.label}
                </p>
              </div>
              <p style={{ color: S.dim, fontSize: "0.74rem", margin: 0 }}>
                {ex.rows} · {ex.size}
              </p>
            </div>
            <button
              type="button"
              onClick={() => simulate(ex.id)}
              disabled={downloading === ex.id}
              style={{ padding: "6px 14px", flexShrink: 0,
                border: `1px solid ${S.line}`,
                background: downloading === ex.id
                  ? "rgba(36,161,72,0.1)" : "transparent",
                color: downloading === ex.id ? IBM.green : S.muted,
                fontSize: "0.8rem", fontFamily: "inherit",
                cursor: "pointer" }}
            >
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
      <SectionHead
        kicker="Audit Log"
        title="Who changed what."
        sub="Every admin action is timestamped and recorded. Before and after values preserved."
      />
      <div style={{ background: S.panel, border: `1px solid ${S.line}` }}>
        {/* Header */}
        <div style={{ display: "grid",
          gridTemplateColumns: "180px 80px 160px 1fr 1fr",
          gap: "16px", padding: "10px 16px",
          borderBottom: `1px solid ${S.line}`,
          background: S.bg }}>
          {["Timestamp", "User", "Action", "Before", "After"].map(h => (
            <p key={h} style={{ color: S.dim, fontSize: "0.68rem",
              textTransform: "uppercase", letterSpacing: "0.09em",
              fontWeight: 700, margin: 0 }}>
              {h}
            </p>
          ))}
        </div>
        {AUDIT_LOG.map((row, i) => (
          <div
            key={i}
            style={{ display: "grid",
              gridTemplateColumns: "180px 80px 160px 1fr 1fr",
              gap: "16px", padding: "12px 16px",
              borderBottom: `1px solid ${S.line}`,
              background: i % 2 === 0 ? S.panel : "#1a1a1a" }}
          >
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace" }}>
              {row.time}
            </p>
            <p style={{ color: IBM.blueLight, fontSize: "0.78rem",
              fontWeight: 600, margin: 0 }}>
              {row.user}
            </p>
            <p style={{ color: S.soft, fontSize: "0.78rem",
              fontWeight: 550, margin: 0 }}>
              {row.action}
            </p>
            <p style={{ color: S.dim, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {row.before}
            </p>
            <p style={{ color: S.muted, fontSize: "0.76rem", margin: 0,
              fontFamily: "IBM Plex Mono, monospace", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {row.after}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component — auth gate + view router
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view,     setView]     = useState<AdminView>("dashboard");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(hasSession());
  }, []);

  const handleLogin   = useCallback(() => setLoggedIn(true),  []);
  const handleLogout  = useCallback(() => { clearSession(); setLoggedIn(false); }, []);

  // Avoid hydration mismatch — render nothing on server
  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f" }} />
    );
  }

  if (!loggedIn) {
    return <AdminLogin onSuccess={handleLogin} />;
  }

  const VIEW_MAP: Record<AdminView, ReactNode> = {
    dashboard: <DashboardView />,
    personas:  <PersonasView />,
    champions: <ChampionsView />,
    snapshots: <SnapshotsView />,
    capacity:  <CapacityView />,
    consent:   <ConsentView />,
    activity:  <ActivityView />,
    content:   <ContentView />,
    ingest:    <IngestView />,
    exports:   <ExportsView />,
    audit:     <AuditView />,
  };

  return (
    <AdminLayout view={view} setView={setView} onLogout={handleLogout}>
      {VIEW_MAP[view]}
    </AdminLayout>
  );
}
