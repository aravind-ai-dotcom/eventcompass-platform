"use client";
// =============================================================================
// EventCompass — Build My Compass / Refine My Compass  /enroll
//
// Single source of truth for all attendee Compass intake.
//
// ?mode=edit   → prefills from Firestore, skips the "already enrolled" redirect,
//                shows "Update My Compass" CTA instead of "Build My Compass".
// ?focus=profile → scroll to name, employer, and role fields (with mode=edit).
// ?focus=intent  → scroll to goals, tracks, and connection intent (with mode=edit).
// (no param)   → fresh enrollment; redirects to /txc/experience if already enrolled.
//
// Prefill order:
//   1. participants/{uid}  — full schema v1 (takes priority)
//   2. users/{uid}         — identity fields set at account creation
//
// Writes (setDoc merge:true):
//   organizations/ibm/events/txc2026/participants/{uid}
//   users/{uid}
// =============================================================================

import { useState, useEffect, useRef } from "react";
import { useRouter }                    from "next/navigation";
import Link                             from "next/link";
import AuthPanel                        from "@/components/auth/AuthPanel";
import { useAuth }                      from "@/context/AuthContext";
import { tryGetDb } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { isOpenToAlumniConnections } from "@/lib/networkingIdentity";
import {
  buildIdentitySignalsPayload,
  CHAMPION_STATUS_OPTIONS,
  DEFAULT_ACTIVITY_MEMORY,
  parseIdentitySignals,
  TXC_HISTORY_EVENTS,
  type ChampionStatus,
} from "@/lib/identitySignals";

const BASE = "organizations/ibm/events/txc2026";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanLinkedInHandle(raw: string): string {
  return raw
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
    .replace(/\/+$/, "")
    .replace(/[/\s]/g, "")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Static option lists
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAS = [
  "Technical Practitioner", "Architect", "Business Decision Maker",
  "IT Leader", "Developer", "Student / Early Career",
];

const INDUSTRIES = [
  "Financial Services", "Healthcare & Life Sciences", "Retail & Consumer",
  "Manufacturing", "Energy & Utilities", "Telecommunications",
  "Government & Public Sector", "Education", "Technology", "Consulting",
  "Media & Entertainment", "Transportation & Logistics", "Other",
];

const CAREER_INTERESTS = [
  "Platform engineering", "AI / ML", "Cloud architecture", "Security",
  "DevOps", "Data engineering", "Product leadership",
  "Early career", "Career change", "Mentoring others",
];

const GOALS = [
  { id: "tech-breakouts",     label: "Attend technical breakouts", icon: "◈" },
  { id: "earn-cert",          label: "Pursue a certification journey", icon: "◎" },
  { id: "meet-experts",       label: "Meet experts",                 icon: "◉" },
  { id: "join-communities",   label: "Join communities",           icon: "◆" },
  { id: "business-challenge", label: "Solve a business challenge",   icon: "◈" },
  { id: "career-growth",      label: "Grow my career",             icon: "◎" },
  { id: "explore-products",   label: "Explore products",           icon: "◉" },
  { id: "experience-event",   label: "Experience the event",       icon: "◆" },
];

/** Map legacy goal labels from earlier enroll versions → current buckets. */
const LEGACY_GOAL_LABELS: Record<string, string> = {
  "Learn new technologies":    "Attend technical breakouts",
  "Earn a certification":      "Pursue a certification journey",
  "Pursue a certification journey": "Pursue a certification journey",
  "Meet IBM experts":          "Meet experts",
  "Explore AI":                "Explore products",
  "Network with peers":        "Join communities",
  "Discover customer stories": "Experience the event",
  "Understand IBM roadmap":    "Explore products",
  "Grow my career":            "Grow my career",
};

function goalIdsFromStoredLabels(labels: string[]): string[] {
  const ids: string[] = [];
  for (const raw of labels) {
    const label = LEGACY_GOAL_LABELS[raw] ?? raw;
    const match = GOALS.find(g => g.label === label);
    if (match && !ids.includes(match.id)) ids.push(match.id);
  }
  return ids;
}

const TRACKS = [
  "AI", "Cloud", "Data", "Security", "Automation",
  "Storage", "IBM Z", "Red Hat", "App Development",
  "IT Optimization", "Power", "FinOps",
];

const COMMUNITY = [
  { id: "champions",   label: "Meet IBM Champions"    },
  { id: "customers",   label: "Meet Customers"        },
  { id: "architects",  label: "Meet Architects"       },
  { id: "find-mentor", label: "Find a Mentor"         },
  { id: "be-mentor",   label: "Mentor Others"         },
  { id: "alumni",      label: "Connect with Alumni"   },
  { id: "peers",       label: "Meet Industry Peers"   },
  { id: "open-source", label: "Open Source Community" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const iS: React.CSSProperties = {
  height: "42px", padding: "0 13px",
  border: "1px solid var(--line)", background: "var(--panel)",
  color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "14px",
};

const kicker: React.CSSProperties = {
  color: "var(--accent)", fontSize: "0.7rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px",
};

const reviewVal: React.CSSProperties = {
  color: "var(--text)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

function StepLabel({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>
        {step}
      </p>
      <h2 className="enroll-step-title">{title}</h2>
      <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.92rem", lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
}

function SubLabel({ title }: { title: string }) {
  return (
    <p style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600, margin: "0 0 10px" }}>
      {title}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Chip({ label, icon, selected, onClick }: {
  label: string; icon?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      height: "36px", padding: "0 13px", marginBottom: "6px",
      border:      selected ? "1px solid var(--accent)" : "1px solid var(--line)",
      background:  selected ? "var(--accent)"           : "var(--panel)",
      color:       selected ? "var(--accent-text)"      : "var(--soft)",
      fontSize: "0.85rem", fontWeight: selected ? 650 : 500,
      fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>
      {icon && <span aria-hidden="true" style={{ fontSize: "0.7rem" }}>{icon}</span>}
      {label}
      {selected && <span aria-hidden="true" style={{ fontSize: "0.7rem", opacity: 0.7 }}>✓</span>}
    </button>
  );
}

function CheckRow({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }} />
      <span style={{ color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.45 }}>{label}</span>
    </label>
  );
}

function ConsentItem({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 4, flexShrink: 0 }} />
      <div>
        <span style={{ color: "var(--soft)", fontSize: "0.88rem", fontWeight: 600, display: "block", lineHeight: 1.4 }}>
          {label}
        </span>
        <span style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", lineHeight: 1.45, marginTop: "2px" }}>
          {description}
        </span>
      </div>
    </label>
  );
}

function ConsentGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </div>
  );
}

function IntentSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
      <SubLabel title={title} />
      {children}
    </div>
  );
}

function tog(arr: string[], set: (v: string[]) => void, val: string) {
  set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm screen
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmScreen({
  firstName,
  isEditMode,
  onEdit,
}: {
  firstName: string;
  isEditMode: boolean;
  onEdit: () => void;
}) {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Compass {isEditMode ? "updated" : "ready"}</div>
        <h1>
          {isEditMode
            ? `Your Compass has been updated${firstName ? `, ${firstName}` : ""}.`
            : `Your Compass is ready${firstName ? `, ${firstName}` : ""}.`}
        </h1>
        <p>
          Sessions, champions, and your Next Best Move are now personalized for you.
          Open My Experience to see your TechXchange plan.
        </p>
      </section>
      <section className="section no-top-border">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/txc/experience" className="btn-primary">Open My Compass →</Link>
          <button onClick={onEdit} className="btn-secondary">
            {isEditMode ? "Make more changes" : "Edit my signal"}
          </button>
        </div>
      </section>
      <div style={{ height: "64px" }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EnrollPage() {
  const { user, enrolled, loading } = useAuth();
  const router = useRouter();

  // ── Mode detection (window.location avoids Next.js useSearchParams/Suspense) ──
  const [isEditMode,  setIsEditMode]  = useState<boolean | null>(null);
  const [editFocus,   setEditFocus]   = useState<"profile" | "intent" | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsEditMode(params.get("mode") === "edit");
    const focus = params.get("focus");
    setEditFocus(focus === "profile" || focus === "intent" ? focus : null);
  }, []);

  const [authed,     setAuthed]     = useState(false);
  const [screen,     setScreen]     = useState<"form" | "confirm">("form");
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState("");
  const [prefilling, setPrefilling] = useState(false);
  const prefillDone = useRef(false);

  // ── 01 · About You ──────────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [country,     setCountry]     = useState("");
  const [city,        setCity]        = useState("");

  // ── 02 · Professional Context ───────────────────────────────────────────────
  const [organization,   setOrganization]   = useState("");
  const [jobTitle,       setJobTitle]       = useState("");
  const [industry,       setIndustry]       = useState("");
  const [persona,        setPersona]        = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");
  const [githubProfile,  setGithubProfile]  = useState("");
  const [personalWebsite, setPersonalWebsite] = useState("");
  const [attendancePlan, setAttendancePlan] = useState("");

  // ── 03 · Your Background ────────────────────────────────────────────────────
  const [educationRows, setEducationRows] = useState<string[]>(["", "", ""]);
  const [employerRows, setEmployerRows]   = useState<string[]>(["", "", ""]);
  const [careerInterest, setCareerInterest] = useState<string[]>([]);

  function setEducationRow(index: number, value: string) {
    setEducationRows(prev => prev.map((r, i) => (i === index ? value : r)));
  }
  function setEmployerRow(index: number, value: string) {
    setEmployerRows(prev => prev.map((r, i) => (i === index ? value : r)));
  }
  function educationPayload() {
    return educationRows
      .map(r => r.trim())
      .filter(Boolean)
      .map(institution => ({ institution }));
  }
  function employersPayload() {
    return employerRows
      .map(r => r.trim())
      .filter(Boolean)
      .map(company => ({ company }));
  }

  // Networking identity
  const [openAlumni,     setOpenAlumni]     = useState(false);
  const [openColleague,  setOpenColleague]  = useState(false);
  const [openCareer,     setOpenCareer]     = useState(false);

  // ── 04 · Your TechXchange Intent ────────────────────────────────────────────
  const [goals,      setGoals]      = useState<string[]>([]);
  const [tracks,     setTracks]     = useState<string[]>([]);
  const [community,  setCommunity]  = useState<string[]>([]);
  const [hopeText,   setHopeText]   = useState("");

  // ── 05 · Consent & Privacy ──────────────────────────────────────────────────
  const [consentPublicProfile,           setConsentPublicProfile]           = useState(true);
  const [consentShowLinkedin,            setConsentShowLinkedin]            = useState(false);
  const [consentAllowIntroRequests,      setConsentAllowIntroRequests]      = useState(false);
  const [consentShareWithMatched,        setConsentShareWithMatched]        = useState(false);
  const [consentAllowAlumniMatching,     setConsentAllowAlumniMatching]     = useState(false);
  const [consentAllowEmployerMatching,   setConsentAllowEmployerMatching]   = useState(false);
  const [consentAllowSmsUpdates,         setConsentAllowSmsUpdates]         = useState(false);
  const [consentAllowEventNotifications, setConsentAllowEventNotifications] = useState(true);

  // ── TechXchange Identity ────────────────────────────────────────────────────
  const [championStatus, setChampionStatus] = useState<ChampionStatus | "">("");
  const [attendedTxcBefore, setAttendedTxcBefore] = useState<boolean | null>(null);
  const [txcHistory, setTxcHistory] = useState<string[]>([]);
  const [attendanceMemoryEnabled, setAttendanceMemoryEnabled] = useState<boolean | null>(null);

  // ── Enrolled redirect — skip when in edit mode ────────────────────────────
  useEffect(() => {
    if (isEditMode === null) return; // wait for mode to resolve
    if (!loading && user && enrolled && !isEditMode) {
      router.replace("/txc/experience");
    }
  }, [loading, user, enrolled, isEditMode, router]);

  // ── Scroll to profile vs intent section in edit mode ───────────────────────
  useEffect(() => {
    if (!isEditMode || prefilling) return;
    const focus = editFocus ?? "intent";
    const timer = window.setTimeout(() => {
      if (focus === "profile") {
        const details = document.querySelector(".enroll-optional-block");
        if (details instanceof HTMLDetailsElement) details.open = true;
        document.getElementById("enroll-about-you")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      document.getElementById("enroll-intent")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isEditMode, editFocus, prefilling]);

  // ── Prefill from Firestore ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || prefillDone.current) return;
    prefillDone.current = true;

    async function prefill() {
      const db = tryGetDb();
      if (!db) {
        setPrefilling(false);
        return;
      }
      setPrefilling(true);
      try {
        const [partSnap, userSnap] = await Promise.all([
          getDoc(doc(db, `${BASE}/participants/${user!.uid}`)),
          getDoc(doc(db, `users/${user!.uid}`)),
        ]);

        const p = partSnap.exists() ? partSnap.data() : null;
        const u = userSnap.exists()  ? userSnap.data()  : null;

        // Identity
        const firebaseParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);
        const fn = (p?.first_name || u?.first_name || firebaseParts[0] || "");
        const ln = (p?.last_name  || u?.last_name  || firebaseParts.slice(1).join(" ") || "");
        if (fn) setFirstName(fn);
        if (ln) setLastName(ln);

        const phone = p?.mobile_phone || u?.mobile_phone || "";
        if (phone) setMobilePhone(String(phone).trim());
        const ctry = p?.country || u?.country || "";
        if (ctry) setCountry(ctry);
        const ct = p?.city || u?.city || "";
        if (ct) setCity(ct);

        // Professional
        const orgVal = p?.organization || u?.organization || "";
        if (orgVal) setOrganization(orgVal);
        const jt = p?.job_title || u?.role || "";
        if (jt) setJobTitle(jt);
        const ind = p?.industry || (p?.registration as Record<string,string> | undefined)?.industry || u?.industry || "";
        if (ind) setIndustry(ind);
        const per = p?.persona || u?.persona || "";
        if (per) setPersona(per);
        const liUrl = p?.linkedin_url || u?.linkedin_url || "";
        if (liUrl) setLinkedinHandle(cleanLinkedInHandle(liUrl));
        const gh = (p?.github_profile || u?.github_profile || "") as string;
        if (gh) setGithubProfile(gh);
        const web = (p?.personal_website || u?.personal_website || "") as string;
        if (web) setPersonalWebsite(web);
        const attend = (p?.attendance_plan || (p?.registration as Record<string, string> | undefined)?.attendance_plan || "") as string;
        if (attend) setAttendancePlan(attend);

        // Background
        const eduList = (p?.education as Array<{institution?: string}> | undefined) ?? [];
        if (eduList.length) {
          setEducationRows([
            eduList[0]?.institution ?? "",
            eduList[1]?.institution ?? "",
            eduList[2]?.institution ?? "",
          ]);
        }
        const empList = (p?.past_employers as Array<{company?: string}> | undefined) ?? [];
        if (empList.length) {
          setEmployerRows([
            empList[0]?.company ?? "",
            empList[1]?.company ?? "",
            empList[2]?.company ?? "",
          ]);
        }
        const ci = (p?.career_interests || u?.career_interests || []) as string[];
        if (ci.length) setCareerInterest(ci);

        // Networking identity
        const ni = (p?.networking_identity || u?.networking_identity || {}) as Record<string, boolean>;
        setOpenAlumni(isOpenToAlumniConnections(ni));
        if (ni.open_to_past_colleague_connections !== undefined) setOpenColleague(ni.open_to_past_colleague_connections);
        if (ni.open_to_career_conversations       !== undefined) setOpenCareer(ni.open_to_career_conversations);

        // Event signal — map stored labels → goal IDs (incl. legacy labels)
        const esp = (p?.event_signal_profile || {}) as Record<string, unknown>;
        const goalLabels = (esp.goals || []) as string[];
        const matchedGoals = goalIdsFromStoredLabels(goalLabels);
        if (matchedGoals.length) setGoals(matchedGoals);

        const techTracks = (esp.tech_tracks || []) as string[];
        if (techTracks.length) setTracks(techTracks);

        const commLabels = (esp.open_to || []) as string[];
        const matchedComm = COMMUNITY.filter(c => commLabels.includes(c.label)).map(c => c.id);
        if (matchedComm.length) setCommunity(matchedComm);

        const compassIntel = (p?.compass_intelligence || {}) as Record<string, unknown>;
        const narrative = (compassIntel.intent_narrative || {}) as Record<string, unknown>;
        const asp = (
          ((esp.intent as Record<string, unknown> | undefined)?.aspiration as string | undefined) ||
          (narrative.aspiration as string | undefined) ||
          ""
        );
        if (asp) setHopeText(asp);

        const identity = parseIdentitySignals(p as Record<string, unknown> | null);
        if (identity) {
          if (identity.champion_status) setChampionStatus(identity.champion_status);
          if (identity.attended_txc_before !== null) setAttendedTxcBefore(identity.attended_txc_before);
          if (identity.techxchange_history.length) setTxcHistory(identity.techxchange_history);
          if (identity.attendance_memory_enabled !== null) {
            setAttendanceMemoryEnabled(identity.attendance_memory_enabled);
          }
        }

        // Consent
        const cv1 = (p?.consent || u?.consent || {}) as Record<string, boolean>;
        if (cv1.public_profile              !== undefined) setConsentPublicProfile(cv1.public_profile);
        if (cv1.show_linkedin               !== undefined) setConsentShowLinkedin(cv1.show_linkedin);
        if (cv1.allow_intro_requests        !== undefined) setConsentAllowIntroRequests(cv1.allow_intro_requests);
        if (cv1.share_with_matched_attendees !== undefined) setConsentShareWithMatched(cv1.share_with_matched_attendees);
        if (cv1.allow_alumni_matching       !== undefined || cv1.allow_university_matching !== undefined) {
          setConsentAllowAlumniMatching(!!(cv1.allow_alumni_matching || cv1.allow_university_matching));
        }
        if (cv1.allow_employer_matching     !== undefined) setConsentAllowEmployerMatching(cv1.allow_employer_matching);
        if (cv1.allow_sms_updates           !== undefined) setConsentAllowSmsUpdates(cv1.allow_sms_updates);
        if (cv1.allow_event_notifications   !== undefined) setConsentAllowEventNotifications(cv1.allow_event_notifications);

      } catch {
        // non-fatal; user can fill form from scratch
      } finally {
        setPrefilling(false);
      }
    }

    prefill();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth loading ─────────────────────────────────────────────────────────
  if (loading || isEditMode === null) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Compass</div>
        <p style={{ color: "var(--muted)", marginTop: "12px" }}>Loading…</p>
      </section>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!user && !authed) {
    return (
      <>
        <section className="compact-hero enroll-hero">
          <div className="section-kicker">Build My Compass</div>
          <h1>Tell Compass what matters to you.</h1>
          <p>
            Sign in or create an account to start. A few strong signals are enough —
            you can always update your profile from My Compass.
          </p>
          <Link href="#compass-account" className="btn-primary enroll-hero-cta">
            Create account / Build My Compass →
          </Link>
        </section>
        <section className="section no-top-border" id="compass-account">
          <AuthPanel onAuthenticated={() => setAuthed(true)} />
        </section>
        <div style={{ height: "64px" }} />
      </>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (screen === "confirm") {
    const firebaseParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);
    return (
      <ConfirmScreen
        firstName={firstName.trim() || firebaseParts[0] || ""}
        isEditMode={isEditMode}
        onEdit={() => setScreen("form")}
      />
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const canSubmit = (goals.length > 0 || tracks.length > 0) && championStatus !== "";

  async function handleSave() {
    const uid = user?.uid;
    if (!uid || !canSubmit || saving) return;
    const db = tryGetDb();
    if (!db) {
      setSaveErr("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
      return;
    }
    setSaveErr(""); setSaving(true);

    try {
      const firebaseNameParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);
      const first       = firstName.trim()  || firebaseNameParts[0] || "";
      const last        = lastName.trim()   || firebaseNameParts.slice(1).join(" ");
      const displayName = [first, last].filter(Boolean).join(" ")
                        || user?.email?.split("@")[0]
                        || "Attendee";

      const handle      = cleanLinkedInHandle(linkedinHandle);
      const linkedinUrl = handle ? `https://www.linkedin.com/in/${handle}` : "";

      const goalLabels = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
      const commLabels = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);
      const mobilePhoneValue = mobilePhone.trim();

      const keywords = [
        ...goalLabels, ...tracks, ...commLabels,
        ...educationRows, ...employerRows, ...careerInterest,
        organization, jobTitle, industry, persona, hopeText.trim(), country, city,
        githubProfile.trim(), personalWebsite.trim(),
      ].filter(Boolean).map(v => v.toLowerCase());

      const consentV1 = {
        discoverable:                 consentPublicProfile,
        public_profile:               consentPublicProfile,
        show_linkedin:                consentShowLinkedin,
        allow_intro_requests:         consentAllowIntroRequests,
        share_with_matched_attendees: consentShareWithMatched,
        allow_alumni_matching:        consentAllowAlumniMatching,
        allow_employer_matching:      consentAllowEmployerMatching,
        allow_university_matching:    consentAllowAlumniMatching,
        allow_sms_updates:            consentAllowSmsUpdates,
        allow_event_notifications:    consentAllowEventNotifications,
      };

      const networkingIdentity = {
        open_to_alumni_connections:         openAlumni,
        open_to_past_colleague_connections: openColleague,
        open_to_career_conversations:       openCareer,
      };

      const identity_signals = buildIdentitySignalsPayload({
        champion_status: championStatus,
        attended_txc_before: attendedTxcBefore,
        techxchange_history: txcHistory,
        attendance_memory_enabled: attendanceMemoryEnabled,
      });

      const partRef = doc(db, `${BASE}/participants/${uid}`);
      const existingSnap = await getDoc(partRef);
      const hasActivityMemory = Boolean(existingSnap.data()?.activity_memory);

      // ── participants/{uid} — schema v1 ────────────────────────────────────
      await setDoc(
        partRef,
        {
          id:               uid,
          participant_id:   uid,
          participant_type: "attendee",
          first_name:       first,
          last_name:        last,
          display_name:     displayName,
          email:            user?.email ?? "",
          mobile_phone:     mobilePhoneValue,
          organization,
          company:          organization,
          job_title:        jobTitle,
          industry:         industry.trim(),
          persona,
          linkedin_url:     linkedinUrl,
          github_profile:   githubProfile.trim(),
          personal_website: personalWebsite.trim(),
          attendance_plan:  attendancePlan,
          country:          country.trim(),
          city:             city.trim(),
          education:        educationPayload(),
          past_employers:   employersPayload(),
          career_interests: careerInterest,
          consent:          consentV1,
          networking_identity: networkingIdentity,
          identity_signals,
          ...(hasActivityMemory ? {} : { activity_memory: DEFAULT_ACTIVITY_MEMORY }),
          event_signal_profile: {
            goals:        goalLabels,
            tech_tracks:  tracks,
            open_to:      commLabels,
            roles_at_txc: jobTitle ? [jobTitle] : [],
            intent: {
              needs:      [],
              aspiration: hopeText.trim(),
            },
          },
          compass_intelligence: {
            matching_keywords: [...new Set(keywords)],
            intent_narrative:  { aspiration: hopeText.trim() },
          },
          registration: {
            attending:     attendancePlan === "yes",
            attendance_plan: attendancePlan,
            registered:    true,
            attendee_type: "general",
            industry:      industry.trim(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ── users/{uid} ───────────────────────────────────────────────────────
      await setDoc(
        doc(db, `users/${uid}`),
        {
          displayName,
          first_name:       first,
          last_name:        last,
          email:            user?.email ?? "",
          mobile_phone:     mobilePhoneValue,
          country:          country.trim(),
          city:             city.trim(),
          organization,
          role:             jobTitle,
          industry:         industry.trim(),
          persona,
          goals:            goalLabels,
          interests:        tracks,
          linkedin_url:     linkedinUrl,
          github_profile:   githubProfile.trim(),
          personal_website: personalWebsite.trim(),
          education:        educationPayload(),
          past_employers:   employersPayload(),
          career_interests: careerInterest,
          networking_identity: networkingIdentity,
          consent:          consentV1,
          updatedAt:        serverTimestamp(),
        },
        { merge: true }
      );

      setScreen("confirm");
    } catch (err: unknown) {
      setSaveErr((err as Error).message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Form
  // ─────────────────────────────────────────────────────────────────────────
  const goalLabelsPreview = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
  const commLabelsPreview = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="compact-hero enroll-hero">
        <div className="section-kicker">
          {isEditMode
            ? (editFocus === "profile" ? "Edit profile" : "Refine My Compass")
            : "Build My Compass"}
        </div>
        <h1>
          {isEditMode && editFocus === "profile"
            ? "Update your name, role, and employer."
            : "Tell Compass what matters to you."}
        </h1>
        <p>
          {isEditMode && editFocus === "profile"
            ? "Fix spelling, job title, organization, and background details. Your matches refresh when you save."
            : isEditMode
              ? "Update your goals, interests, or connection intent — your scores and matches refresh immediately."
              : "Start with your goals. Learning tracks and connection intent sharpen your matches when you add them."}
        </p>
      </section>

      {prefilling && (
        <section className="section no-top-border">
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading your profile…</p>
        </section>
      )}

      <div style={{ maxWidth: "800px" }}>

        {/* ── 01 · About You ────────────────────────────────────────────── */}
        <section id="enroll-about-you" className="section no-top-border">
          <StepLabel
            step="01 · About You"
            title="The basics."
            subtitle="Name and location — enough for Compass to personalize your badge and regional sessions."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            {user?.email && isEditMode && (
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Account email</FieldLabel>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  aria-readonly="true"
                  aria-label="Account email"
                  style={{ ...iS, color: "var(--muted)", cursor: "not-allowed" }}
                />
                <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "6px 0 0", lineHeight: 1.45 }}>
                  Used for sign-in. To change your email, sign out and create a new account with the correct address, or contact event support.
                </p>
              </label>
            )}

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>First name</FieldLabel>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  aria-label="First name" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Last name</FieldLabel>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  aria-label="Last name" style={iS} />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Mobile Phone (Optional)</FieldLabel>
              <input
                type="tel"
                value={mobilePhone}
                onChange={e => setMobilePhone(e.target.value)}
                placeholder="+1 919 555 1234"
                autoComplete="tel"
                aria-label="Mobile phone"
                style={iS}
              />
              <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "6px 0 0", lineHeight: 1.45 }}>
                For SMS notifications and event updates. Include country code if outside the United States.
              </p>
            </label>

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Country</FieldLabel>
                <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                  aria-label="Country" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>City</FieldLabel>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  aria-label="City" style={iS} />
              </label>
            </div>

          </div>
        </section>

        {/* ── 02 · Intent (core) ─────────────────────────────────────────── */}
        <section id="enroll-intent" className="section">
          <StepLabel
            step="02 · Your Intent"
            title="Goals — why are you attending?"
            subtitle="Pick one or more intent buckets. Add free-text, tracks, and connection preferences when you are ready."
          />

          <div style={{ marginBottom: "24px" }}>
            <SubLabel title="Are you planning to attend TechXchange?" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {([
                { id: "yes", label: "Yes" },
                { id: "no", label: "No" },
                { id: "deciding", label: "Still deciding" },
              ] as const).map(opt => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  selected={attendancePlan === opt.id}
                  onClick={() => setAttendancePlan(attendancePlan === opt.id ? "" : opt.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
            {GOALS.map(o => (
              <Chip key={o.id} label={o.label} icon={o.icon}
                selected={goals.includes(o.id)} onClick={() => tog(goals, setGoals, o.id)} />
            ))}
          </div>

          <label style={{ display: "block", marginBottom: "4px" }}>
            <SubLabel title="What are you hoping to accomplish? (optional)" />
            <textarea
              value={hopeText}
              onChange={e => setHopeText(e.target.value)}
              placeholder="I want to deepen my skills toward a watsonx certification journey."
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", border: "1px solid var(--line)",
                background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem",
                fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <p style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "8px 0 0", lineHeight: 1.45 }}>
              Examples: &ldquo;I want to find AI sessions for customer service.&rdquo; ·
              &ldquo;I want to meet architects working on hybrid cloud.&rdquo;
            </p>
          </label>

          <IntentSubsection title="Learning interests / Tech tracks">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              Select the tracks you want to explore. These carry the highest scoring weight.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TRACKS.map(tr => (
                <Chip key={tr} label={tr}
                  selected={tracks.includes(tr)} onClick={() => tog(tracks, setTracks, tr)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="Connection intent">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              Who you want to meet — and what kinds of conversations you are open to.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              {COMMUNITY.map(o => (
                <Chip key={o.id} label={o.label}
                  selected={community.includes(o.id)} onClick={() => tog(community, setCommunity, o.id)} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <CheckRow label="Open to alumni connections"     checked={openAlumni}    onChange={setOpenAlumni} />
              <CheckRow label="Open to past colleagues"        checked={openColleague} onChange={setOpenColleague} />
              <CheckRow label="Open to career conversations"   checked={openCareer}    onChange={setOpenCareer} />
            </div>
          </IntentSubsection>
        </section>

        {/* ── 03 · TechXchange Identity ─────────────────────────────────── */}
        <section id="enroll-identity" className="section">
          <StepLabel
            step="03 · TechXchange Identity"
            title="Your TechXchange story."
            subtitle="Champion status and event history help Compass recognize you and shape follow-up after the event."
          />

          <div style={{ display: "grid", gap: "22px" }}>
            <div>
              <SubLabel title="IBM Champion status (required)" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CHAMPION_STATUS_OPTIONS.map(opt => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={championStatus === opt.id}
                    onClick={() => setChampionStatus(opt.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <SubLabel title="Have you attended TechXchange before?" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: attendedTxcBefore === true ? "12px" : 0 }}>
                <Chip label="Yes" selected={attendedTxcBefore === true} onClick={() => setAttendedTxcBefore(true)} />
                <Chip label="No, this is my first TechXchange" selected={attendedTxcBefore === false} onClick={() => { setAttendedTxcBefore(false); setTxcHistory([]); }} />
                <Chip label="Prefer not to answer" selected={attendedTxcBefore === null} onClick={() => { setAttendedTxcBefore(null); setTxcHistory([]); }} />
              </div>
              {attendedTxcBefore === true && (
                <div>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
                    Select every TechXchange you have attended.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {TXC_HISTORY_EVENTS.map(event => (
                      <Chip
                        key={event.id}
                        label={event.label}
                        selected={txcHistory.includes(event.id)}
                        onClick={() => tog(txcHistory, setTxcHistory, event.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <SubLabel title="Remember your event journey after TechXchange?" />
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5, maxWidth: "40rem" }}>
                This helps Compass organize session resources, people you met, huddles that mattered, and follow-up opportunities after TechXchange.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Chip
                  label="Yes, help me track my event journey"
                  selected={attendanceMemoryEnabled === true}
                  onClick={() => setAttendanceMemoryEnabled(true)}
                />
                <Chip
                  label="No, keep my profile simple"
                  selected={attendanceMemoryEnabled === false}
                  onClick={() => setAttendanceMemoryEnabled(false)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Improve My Compass (optional — refine after enrollment) ───── */}
        <details className="enroll-optional-block">
          <summary>Improve My Compass — add background and professional details</summary>

          <div style={{ paddingBottom: "8px" }}>
            <StepLabel
              step="Optional"
              title="Deepen your matches."
              subtitle="School, employers, and role details unlock alumni and colleague connections. Add these now or refine later from My Compass."
            />

            <div style={{ display: "grid", gap: "14px", marginBottom: "20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Organization / Company</FieldLabel>
                <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                  aria-label="Organization" style={iS} />
              </label>
              <div style={twoCol}>
                <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <FieldLabel>Job title</FieldLabel>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    aria-label="Job title" style={iS} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <FieldLabel>Industry</FieldLabel>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} style={iS}>
                    <option value="">Select…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Persona</FieldLabel>
                <select value={persona} onChange={e => setPersona(e.target.value)} style={iS}>
                  <option value="">Select…</option>
                  {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>LinkedIn</FieldLabel>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", background: "var(--panel)", overflow: "hidden" }}>
                  <span style={{
                    padding: "0 12px", height: "42px", display: "flex", alignItems: "center",
                    flexShrink: 0, borderRight: "1px solid var(--line)",
                    color: "var(--muted)", fontSize: "0.88rem", whiteSpace: "nowrap", userSelect: "none",
                  }}>
                    linkedin.com/in/
                  </span>
                  <input
                    type="text" value={linkedinHandle}
                    onChange={e => setLinkedinHandle(cleanLinkedInHandle(e.target.value))}
                    placeholder="yourhandle" autoComplete="off"
                    style={{ flex: 1, height: "42px", padding: "0 12px", border: "none",
                      background: "transparent", color: "var(--text)", fontSize: "0.95rem",
                      fontFamily: "inherit", outline: "none", minWidth: 0 }}
                  />
                </div>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>GitHub profile (optional)</FieldLabel>
                <input type="url" value={githubProfile} onChange={e => setGithubProfile(e.target.value)}
                  placeholder="https://github.com/yourhandle" aria-label="GitHub profile" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Personal website (optional)</FieldLabel>
                <input type="url" value={personalWebsite} onChange={e => setPersonalWebsite(e.target.value)}
                  placeholder="https://yoursite.com" aria-label="Personal website" style={iS} />
              </label>
              {[0, 1, 2].map(i => (
                <label key={`edu-${i}`} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <FieldLabel>{i === 0 ? "University / School" : `University / School (${i + 1})`}{i === 0 ? "" : " (optional)"}</FieldLabel>
                  <input
                    type="text"
                    value={educationRows[i]}
                    onChange={e => setEducationRow(i, e.target.value)}
                    placeholder={i === 0 ? "e.g. NC State University" : "Additional institution (optional)"}
                    style={iS}
                  />
                </label>
              ))}
              {[0, 1, 2].map(i => (
                <label key={`emp-${i}`} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <FieldLabel>{i === 0 ? "Past employer" : `Past employer (${i + 1})`}{i === 0 ? "" : " (optional)"}</FieldLabel>
                  <input
                    type="text"
                    value={employerRows[i]}
                    onChange={e => setEmployerRow(i, e.target.value)}
                    placeholder={i === 0 ? "e.g. IBM, Cisco" : "Additional employer (optional)"}
                    style={iS}
                  />
                </label>
              ))}
              <div>
                <SubLabel title="Career interests" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {CAREER_INTERESTS.map(ci => (
                    <Chip key={ci} label={ci}
                      selected={careerInterest.includes(ci)}
                      onClick={() => tog(careerInterest, setCareerInterest, ci)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* ── 03 · Consent ──────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="04 · Consent"
            title="Your data, your choice."
            subtitle="Compass uses your profile only for this event. Change these settings any time."
          />
          <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

            <ConsentGroup label="Profile visibility">
              <ConsentItem
                label="Make my profile visible to other attendees"
                description="Your name, role, and goals are shown to other registered TechXchange attendees. Your contact details are never exposed."
                checked={consentPublicProfile}
                onChange={setConsentPublicProfile}
              />
              <ConsentItem
                label="Show my LinkedIn profile to my matches"
                description="Your LinkedIn URL is shared with attendees Compass recommends you connect with — only when you're matched."
                checked={consentShowLinkedin}
                onChange={setConsentShowLinkedin}
              />
            </ConsentGroup>

            <ConsentGroup label="Networking & matching">
              <ConsentItem
                label="Allow other attendees to request introductions"
                description="Other attendees can send you a Compass introduction request. You choose whether to accept."
                checked={consentAllowIntroRequests}
                onChange={setConsentAllowIntroRequests}
              />
              <ConsentItem
                label="Share my profile with my matches"
                description="When Compass matches you with another attendee, your profile summary is shared with them — and theirs with you."
                checked={consentShareWithMatched}
                onChange={setConsentShareWithMatched}
              />
              <ConsentItem
                label="Match me with fellow alumni"
                description="Compass uses your university background to surface alumni, academic community, and shared educational connections."
                checked={consentAllowAlumniMatching}
                onChange={setConsentAllowAlumniMatching}
              />
              <ConsentItem
                label="Match me with people from past employers"
                description="Compass uses your past employer to find attendees who share that professional history."
                checked={consentAllowEmployerMatching}
                onChange={setConsentAllowEmployerMatching}
              />
            </ConsentGroup>

            <ConsentGroup label="Event communications">
              <ConsentItem
                label="Receive SMS updates about my schedule"
                description="Get a text message for session reminders and last-minute schedule changes. Standard rates apply."
                checked={consentAllowSmsUpdates}
                onChange={setConsentAllowSmsUpdates}
              />
              <ConsentItem
                label="Receive event notifications"
                description="Get email or push notifications for TechXchange announcements, session updates, and Compass recommendations."
                checked={consentAllowEventNotifications}
                onChange={setConsentAllowEventNotifications}
              />
            </ConsentGroup>

          </div>
        </section>

        {/* ── Review ────────────────────────────────────────────────────── */}
        {canSubmit && (
          <section className="section">
            <StepLabel
              step="Review"
              title="Your Compass at a glance."
              subtitle="Here's what Compass will use to personalize your TechXchange experience. You can edit any section above before saving."
            />
            <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {(firstName || lastName || organization || jobTitle) && (
                <div>
                  <p style={kicker}>Identity</p>
                  <p style={reviewVal}>
                    {[firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || "(name not entered)"}
                    {jobTitle     ? ` · ${jobTitle}` : ""}
                    {organization ? ` · ${organization}` : ""}
                  </p>
                </div>
              )}

              {goalLabelsPreview.length > 0 && (
                <div>
                  <p style={kicker}>Goals ({goalLabelsPreview.length})</p>
                  <p style={reviewVal}>{goalLabelsPreview.join(", ")}</p>
                </div>
              )}

              {tracks.length > 0 && (
                <div>
                  <p style={kicker}>Learning interests ({tracks.length})</p>
                  <p style={reviewVal}>{tracks.join(", ")}</p>
                </div>
              )}

              {commLabelsPreview.length > 0 && (
                <div>
                  <p style={kicker}>Connection intent ({commLabelsPreview.length})</p>
                  <p style={reviewVal}>{commLabelsPreview.join(", ")}</p>
                </div>
              )}

              {hopeText.trim() && (
                <div>
                  <p style={kicker}>Hoping to accomplish</p>
                  <p style={{ ...reviewVal, color: "var(--muted)", fontStyle: "italic" }}>
                    &ldquo;{hopeText.trim()}&rdquo;
                  </p>
                </div>
              )}

            </div>
          </section>
        )}

        {/* ── Save ──────────────────────────────────────────────────────── */}
        <section className="section">
          {saveErr && (
            <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #DC2626", marginBottom: "16px" }}>
              <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{saveErr}</p>
            </div>
          )}
          {!canSubmit && (
            <p style={{ color: "var(--muted)", fontSize: "0.84rem", marginBottom: "12px" }}>
              Select at least one goal or technology track to {isEditMode ? "update" : "build"} your Compass.
            </p>
          )}
          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={!canSubmit || saving}
              className="btn-primary"
              style={{
                opacity: canSubmit && !saving ? 1 : 0.5,
                cursor:  canSubmit && !saving ? "pointer" : "default",
                display: "inline-flex", alignItems: "center", gap: "8px",
                minHeight: "44px", padding: "0 24px", fontSize: "0.95rem",
              }}
            >
              {saving && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                  display: "inline-block", animation: "spin 0.8s linear infinite",
                }} />
              )}
              {saving
                ? (isEditMode ? "Updating your Compass…" : "Building your Compass…")
                : (isEditMode ? "Update My Compass →"    : "Build My Compass →")}
            </button>
            {isEditMode
              ? <Link href="/txc/experience" className="btn-secondary">Back to My Compass</Link>
              : <Link href="/" className="btn-secondary">Back to home</Link>}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5 }}>
            Your Compass profile is saved to your account and used only to personalise
            your TechXchange experience. Update it any time from your{" "}
            <a href="/txc/experience" style={{ color: "var(--accent)" }}>My Compass</a>.
          </p>
        </section>

        <div style={{ height: "48px" }} />
      </div>

      {canSubmit && (
        <div className="enroll-sticky-cta">
          <p>{isEditMode ? "Ready to update?" : "Ready to build your Compass?"}</p>
          <button
            onClick={handleSave}
            disabled={!canSubmit || saving}
            className="btn-primary"
            style={{
              opacity: canSubmit && !saving ? 1 : 0.5,
              cursor: canSubmit && !saving ? "pointer" : "default",
              minHeight: "44px",
              padding: "0 24px",
            }}
          >
            {saving
              ? (isEditMode ? "Updating…" : "Building…")
              : (isEditMode ? "Update My Compass →" : "Build My Compass →")}
          </button>
        </div>
      )}
    </>
  );
}
