"use client";
// =============================================================================
// EventCompass — Build My Compass / Refine My Compass  /enroll
//
// Single source of truth for all attendee Compass intake.
//
// ?mode=edit   → prefills from Firestore, skips the "already enrolled" redirect,
//                shows "Update My Compass" CTA instead of "Build My Compass".
// (no param)   → fresh enrollment; redirects to /experience if already enrolled.
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
import { db }                           from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

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
  { id: "learn-tech",       label: "Learn new technologies",    icon: "◈" },
  { id: "earn-cert",        label: "Earn a certification",      icon: "◎" },
  { id: "meet-experts",     label: "Meet IBM experts",          icon: "◉" },
  { id: "explore-ai",       label: "Explore AI",                icon: "◆" },
  { id: "network",          label: "Network with peers",        icon: "◈" },
  { id: "customer-stories", label: "Discover customer stories", icon: "◎" },
  { id: "product-roadmap",  label: "Understand IBM roadmap",    icon: "◉" },
  { id: "career-growth",    label: "Grow my career",            icon: "◆" },
];

const TRACKS = [
  "AI", "Cloud", "Data", "Security", "Automation",
  "Storage", "IBM Z", "Red Hat", "App Development",
  "IT Optimization", "Power", "FinOps",
];

const DIAL_CODES = [
  { code: "+1",  flag: "🇺🇸", label: "US +1" },
  { code: "+91", flag: "🇮🇳", label: "IN +91" },
  { code: "+44", flag: "🇬🇧", label: "UK +44" },
  { code: "+49", flag: "🇩🇪", label: "DE +49" },
  { code: "+33", flag: "🇫🇷", label: "FR +33" },
  { code: "+81", flag: "🇯🇵", label: "JP +81" },
  { code: "+61", flag: "🇦🇺", label: "AU +61" },
  { code: "+55", flag: "🇧🇷", label: "BR +55" },
  { code: "+65", flag: "🇸🇬", label: "SG +65" },
  { code: "+971", flag: "🇦🇪", label: "AE +971" },
] as const;

function parseMobilePhone(raw: string): { dialCode: string; local: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { dialCode: "+1", local: "" };
  const match = DIAL_CODES
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find(d => trimmed.startsWith(d.code));
  if (match) {
    return { dialCode: match.code, local: trimmed.slice(match.code.length).trim() };
  }
  return { dialCode: "+1", local: trimmed.replace(/^\+/, "") };
}

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

function MobileNumberField({
  dialCode,
  local,
  onDialCodeChange,
  onLocalChange,
}: {
  dialCode: string;
  local: string;
  onDialCodeChange: (v: string) => void;
  onLocalChange: (v: string) => void;
}) {
  return (
    <div className="mobile-number-field">
      <label className="mobile-number-dial">
        <span className="sr-only">Country code</span>
        <select
          value={dialCode}
          onChange={e => onDialCodeChange(e.target.value)}
          aria-label="Country code"
        >
          {DIAL_CODES.map(d => (
            <option key={d.code} value={d.code}>{d.flag} {d.code}</option>
          ))}
        </select>
      </label>
      <label className="mobile-number-local">
        <span className="sr-only">Mobile number</span>
        <input
          type="tel"
          value={local}
          onChange={e => onLocalChange(e.target.value)}
          placeholder="Mobile number"
          autoComplete="tel-national"
        />
      </label>
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
          Sessions, champions, and your Next Best Move are now personalised for you.
          Open My Experience to see your TechXchange plan.
        </p>
      </section>
      <section className="section no-top-border">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
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
  useEffect(() => {
    setIsEditMode(new URLSearchParams(window.location.search).get("mode") === "edit");
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
  const [dialCode,    setDialCode]    = useState("+1");
  const [mobileLocal, setMobileLocal] = useState("");
  const [country,     setCountry]     = useState("");
  const [city,        setCity]        = useState("");

  // ── 02 · Professional Context ───────────────────────────────────────────────
  const [organization,   setOrganization]   = useState("");
  const [jobTitle,       setJobTitle]       = useState("");
  const [industry,       setIndustry]       = useState("");
  const [persona,        setPersona]        = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");

  // ── 03 · Your Background ────────────────────────────────────────────────────
  const [university,     setUniversity]     = useState("");
  const [pastEmployer,   setPastEmployer]   = useState("");
  const [careerInterest, setCareerInterest] = useState<string[]>([]);

  // Networking identity
  const [openAlumni,     setOpenAlumni]     = useState(false);
  const [openColleague,  setOpenColleague]  = useState(false);
  const [openUniversity, setOpenUniversity] = useState(false);
  const [openCareer,     setOpenCareer]     = useState(false);

  // ── 04 · Your TechXchange Intent ────────────────────────────────────────────
  const [goals,      setGoals]      = useState<string[]>([]);
  const [tracks,     setTracks]     = useState<string[]>([]);
  const [community,  setCommunity]  = useState<string[]>([]);
  const [aspiration, setAspiration] = useState("");

  // ── 05 · Consent & Privacy ──────────────────────────────────────────────────
  const [consentPublicProfile,           setConsentPublicProfile]           = useState(true);
  const [consentShowLinkedin,            setConsentShowLinkedin]            = useState(false);
  const [consentAllowIntroRequests,      setConsentAllowIntroRequests]      = useState(false);
  const [consentShareWithMatched,        setConsentShareWithMatched]        = useState(false);
  const [consentAllowAlumniMatching,     setConsentAllowAlumniMatching]     = useState(false);
  const [consentAllowEmployerMatching,   setConsentAllowEmployerMatching]   = useState(false);
  const [consentAllowUniversityMatching, setConsentAllowUniversityMatching] = useState(false);
  const [consentAllowSmsUpdates,         setConsentAllowSmsUpdates]         = useState(false);
  const [consentAllowEventNotifications, setConsentAllowEventNotifications] = useState(true);

  // ── Enrolled redirect — skip when in edit mode ────────────────────────────
  useEffect(() => {
    if (isEditMode === null) return; // wait for mode to resolve
    if (!loading && user && enrolled && !isEditMode) {
      router.replace("/experience");
    }
  }, [loading, user, enrolled, isEditMode, router]);

  // ── Prefill from Firestore ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || prefillDone.current) return;
    prefillDone.current = true;

    async function prefill() {
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
        if (phone) {
          const parsed = parseMobilePhone(String(phone));
          setDialCode(parsed.dialCode);
          setMobileLocal(parsed.local);
        }
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

        // Background
        const uni = (p?.education as Array<{institution?: string}> | undefined)?.[0]?.institution || "";
        if (uni) setUniversity(uni);
        const pastEmp = (p?.past_employers as Array<{company?: string}> | undefined)?.[0]?.company || "";
        if (pastEmp) setPastEmployer(pastEmp);
        const ci = (p?.career_interests || u?.career_interests || []) as string[];
        if (ci.length) setCareerInterest(ci);

        // Networking identity
        const ni = (p?.networking_identity || u?.networking_identity || {}) as Record<string, boolean>;
        if (ni.open_to_alumni_connections         !== undefined) setOpenAlumni(ni.open_to_alumni_connections);
        if (ni.open_to_past_colleague_connections !== undefined) setOpenColleague(ni.open_to_past_colleague_connections);
        if (ni.open_to_university_connections     !== undefined) setOpenUniversity(ni.open_to_university_connections);
        if (ni.open_to_career_conversations       !== undefined) setOpenCareer(ni.open_to_career_conversations);

        // Event signal — map labels → IDs
        const esp = (p?.event_signal_profile || {}) as Record<string, unknown>;
        const goalLabels = (esp.goals || []) as string[];
        const matchedGoals = GOALS.filter(g => goalLabels.includes(g.label)).map(g => g.id);
        if (matchedGoals.length) setGoals(matchedGoals);

        const techTracks = (esp.tech_tracks || []) as string[];
        if (techTracks.length) setTracks(techTracks);

        const commLabels = (esp.open_to || []) as string[];
        const matchedComm = COMMUNITY.filter(c => commLabels.includes(c.label)).map(c => c.id);
        if (matchedComm.length) setCommunity(matchedComm);

        const asp = ((esp.intent as Record<string,unknown> | undefined)?.aspiration || "") as string;
        if (asp) setAspiration(asp);

        // Consent
        const cv1 = (p?.consent || u?.consent || {}) as Record<string, boolean>;
        if (cv1.public_profile              !== undefined) setConsentPublicProfile(cv1.public_profile);
        if (cv1.show_linkedin               !== undefined) setConsentShowLinkedin(cv1.show_linkedin);
        if (cv1.allow_intro_requests        !== undefined) setConsentAllowIntroRequests(cv1.allow_intro_requests);
        if (cv1.share_with_matched_attendees !== undefined) setConsentShareWithMatched(cv1.share_with_matched_attendees);
        if (cv1.allow_alumni_matching       !== undefined) setConsentAllowAlumniMatching(cv1.allow_alumni_matching);
        if (cv1.allow_employer_matching     !== undefined) setConsentAllowEmployerMatching(cv1.allow_employer_matching);
        if (cv1.allow_university_matching   !== undefined) setConsentAllowUniversityMatching(cv1.allow_university_matching);
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
          <h1>Tell Compass once. Refine later.</h1>
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
  const canSubmit = goals.length > 0 || tracks.length > 0;

  async function handleSave() {
    const uid = user?.uid;
    if (!uid || !canSubmit || saving) return;
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
      const mobilePhone = [dialCode, mobileLocal.trim()].filter(Boolean).join(" ").trim();

      const keywords = [
        ...goalLabels, ...tracks, ...commLabels,
        university, pastEmployer, ...careerInterest,
        organization, jobTitle, industry, persona, aspiration, country, city,
      ].filter(Boolean).map(v => v.toLowerCase());

      const consentV1 = {
        public_profile:               consentPublicProfile,
        show_linkedin:                consentShowLinkedin,
        allow_intro_requests:         consentAllowIntroRequests,
        share_with_matched_attendees: consentShareWithMatched,
        allow_alumni_matching:        consentAllowAlumniMatching,
        allow_employer_matching:      consentAllowEmployerMatching,
        allow_university_matching:    consentAllowUniversityMatching,
        allow_sms_updates:            consentAllowSmsUpdates,
        allow_event_notifications:    consentAllowEventNotifications,
      };

      const networkingIdentity = {
        open_to_alumni_connections:         openAlumni,
        open_to_past_colleague_connections: openColleague,
        open_to_university_connections:     openUniversity,
        open_to_career_conversations:       openCareer,
      };

      // ── participants/{uid} — schema v1 ────────────────────────────────────
      await setDoc(
        doc(db, `${BASE}/participants/${uid}`),
        {
          id:               uid,
          participant_id:   uid,
          participant_type: "attendee",
          first_name:       first,
          last_name:        last,
          display_name:     displayName,
          email:            user?.email ?? "",
          mobile_phone:     mobilePhone.trim(),
          organization,
          company:          organization,
          job_title:        jobTitle,
          industry:         industry.trim(),
          persona,
          linkedin_url:     linkedinUrl,
          country:          country.trim(),
          city:             city.trim(),
          education:        university.trim() ? [{ institution: university.trim() }] : [],
          past_employers:   pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
          career_interests: careerInterest,
          consent:          consentV1,
          networking_identity: networkingIdentity,
          event_signal_profile: {
            goals:        goalLabels,
            tech_tracks:  tracks,
            open_to:      commLabels,
            roles_at_txc: jobTitle ? [jobTitle] : [],
            intent: {
              needs:      [],
              aspiration,
            },
          },
          compass_intelligence: {
            matching_keywords: [...new Set(keywords)],
            intent_narrative:  { aspiration },
          },
          registration: {
            attending:     true,
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
          mobile_phone:     mobilePhone.trim(),
          country:          country.trim(),
          city:             city.trim(),
          organization,
          role:             jobTitle,
          industry:         industry.trim(),
          persona,
          goals:            goalLabels,
          interests:        tracks,
          linkedin_url:     linkedinUrl,
          education:        university.trim() ? [{ institution: university.trim() }] : [],
          past_employers:   pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
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
          {isEditMode ? "Refine My Compass" : "Build My Compass"}
        </div>
        <h1>
          {isEditMode
            ? "Refine what Compass knows."
            : "Tell Compass once. Refine later."}
        </h1>
        <p>
          {isEditMode
            ? "Update your goals, interests, or connection intent — your scores and matches refresh immediately."
            : "Goals and learning interests are enough to start. Add background and connection intent when you are ready."}
        </p>
      </section>

      {prefilling && (
        <section className="section no-top-border">
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading your profile…</p>
        </section>
      )}

      <div style={{ maxWidth: "800px" }}>

        {/* ── 01 · About You ────────────────────────────────────────────── */}
        <section className="section no-top-border">
          <StepLabel
            step="01 · About You"
            title="The basics."
            subtitle="Name and location — enough for Compass to personalise your badge and regional sessions."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>First name</FieldLabel>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Maya" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Last name</FieldLabel>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Patel" style={iS} />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Mobile number</FieldLabel>
              <MobileNumberField
                dialCode={dialCode}
                local={mobileLocal}
                onDialCodeChange={setDialCode}
                onLocalChange={setMobileLocal}
              />
            </label>

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Country</FieldLabel>
                <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                  placeholder="United States" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>City</FieldLabel>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Atlanta" style={iS} />
              </label>
            </div>

          </div>
        </section>

        {/* ── 02 · Intent (core) ─────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="02 · Your Intent"
            title="What brought you to TechXchange?"
            subtitle="Goals, learning interests, and connection intent — enough to build a strong Compass."
          />

          <IntentSubsection title="Goals — why are you attending?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {GOALS.map(o => (
                <Chip key={o.id} label={o.label} icon={o.icon}
                  selected={goals.includes(o.id)} onClick={() => tog(goals, setGoals, o.id)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="Learning interests">
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
              <CheckRow label="Open to alumni from my university"   checked={openAlumni}     onChange={setOpenAlumni} />
              <CheckRow label="Open to past colleagues"            checked={openColleague}  onChange={setOpenColleague} />
              <CheckRow label="Open to my university community"    checked={openUniversity} onChange={setOpenUniversity} />
              <CheckRow label="Open to career conversations"       checked={openCareer}     onChange={setOpenCareer} />
            </div>
          </IntentSubsection>
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
                  placeholder="Acme Corp" style={iS} />
              </label>
              <div style={twoCol}>
                <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <FieldLabel>Job title</FieldLabel>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder="Platform Engineer" style={iS} />
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
                <FieldLabel>University / School</FieldLabel>
                <input type="text" value={university} onChange={e => setUniversity(e.target.value)}
                  placeholder="e.g. Georgia Tech, University of Toronto" style={iS} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Most recent past employer</FieldLabel>
                <input type="text" value={pastEmployer} onChange={e => setPastEmployer(e.target.value)}
                  placeholder="e.g. Accenture, Red Hat, Deloitte" style={iS} />
              </label>
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
              <div>
                <SubLabel title="In your own words — optional" />
                <textarea
                  value={aspiration} onChange={e => setAspiration(e.target.value)}
                  placeholder="What would make TechXchange 2026 worth your time?"
                  rows={2}
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>
        </details>

        {/* ── 03 · Consent ──────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="03 · Consent"
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
                description="Compass looks for attendees who share your university background and can surface those connections."
                checked={consentAllowAlumniMatching}
                onChange={setConsentAllowAlumniMatching}
              />
              <ConsentItem
                label="Match me with people from past employers"
                description="Compass uses your past employer to find attendees who share that professional history."
                checked={consentAllowEmployerMatching}
                onChange={setConsentAllowEmployerMatching}
              />
              <ConsentItem
                label="Match me with my university community"
                description="Compass uses your university to surface alumni and community connections at TechXchange."
                checked={consentAllowUniversityMatching}
                onChange={setConsentAllowUniversityMatching}
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
              subtitle="Here's what Compass will use to personalise your TechXchange experience. You can edit any section above before saving."
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

              {aspiration.trim() && (
                <div>
                  <p style={kicker}>Aspiration</p>
                  <p style={{ ...reviewVal, color: "var(--muted)", fontStyle: "italic" }}>
                    &ldquo;{aspiration.trim()}&rdquo;
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
              ? <Link href="/profile" className="btn-secondary">Back to profile</Link>
              : <Link href="/" className="btn-secondary">Back to home</Link>}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5 }}>
            Your Compass profile is saved to your account and used only to personalise
            your TechXchange experience. Update it any time from your{" "}
            <a href="/profile" style={{ color: "var(--accent)" }}>profile</a>.
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
