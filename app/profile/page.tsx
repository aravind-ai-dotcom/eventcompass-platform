"use client";
// =============================================================================
// EventCompass — Build My Compass  /enroll
//
// Schema v1 full enrollment:
//   Auth gate
//   → 01 · About You           first_name, last_name, mobile_phone, country, city
//   → 02 · Professional Context organization, company, job_title, industry,
//                               persona, linkedin_url
//   → 03 · Your Background      education[], past_employers[], career_interests[],
//                               networking_identity{}
//   → 04 · Your TechXchange Intent
//          Goals · Technology · What I need · Community · Aspiration
//   → 05 · Consent & Privacy   consent{}
//   → Review → Save → Confirm
//
// Writes (setDoc merge:true):
//   organizations/ibm/events/txc2026/participants/{uid}
//   users/{uid}
//
// Rules:
//   display_name = first_name + " " + last_name
//   participant_id = Firebase uid
//   linkedin_url blank if no valid handle
//   Profile and Enroll write identical participant fields
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";
import AuthPanel               from "@/components/auth/AuthPanel";
import { useAuth }             from "@/context/AuthContext";
import { db }                  from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

const NEEDS = [
  { id: "hands-on",     label: "Hands-on learning"    },
  { id: "architecture", label: "Architecture guidance" },
  { id: "roadmap",      label: "Product roadmap"       },
  { id: "customers",    label: "Customer examples"     },
  { id: "career",       label: "Career growth"         },
  { id: "networking",   label: "Networking"            },
  { id: "mentoring",    label: "Mentoring"             },
  { id: "strategy",     label: "Strategic insights"    },
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
      <h2 style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)", fontWeight: 520, letterSpacing: "-0.035em", margin: "0 0 6px", color: "var(--text)" }}>
        {title}
      </h2>
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

/** Plain checkbox row — used for networking identity */
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

/** Consent checkbox with label + plain-language description */
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

function ConfirmScreen({ firstName, onEdit }: { firstName: string; onEdit: () => void }) {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Compass ready</div>
        <h1>Your Compass is ready{firstName ? `, ${firstName}` : ""}.</h1>
        <p>
          Sessions, champions, and your Next Best Move are now personalised for you.
          Open My Experience to see your TechXchange plan.
        </p>
      </section>
      <section className="section no-top-border">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
          <button onClick={onEdit} className="btn-secondary">Edit my signal</button>
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

  const [authed,  setAuthed]  = useState(false);
  const [screen,  setScreen]  = useState<"form" | "confirm">("form");
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // ── 01 · About You ────────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [country,     setCountry]     = useState("");
  const [city,        setCity]        = useState("");

  // ── 02 · Professional Context ─────────────────────────────────────────────
  const [organization,   setOrganization]   = useState("");
  const [jobTitle,       setJobTitle]       = useState("");
  const [industry,       setIndustry]       = useState("");
  const [persona,        setPersona]        = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");

  // ── 03 · Your Background ─────────────────────────────────────────────────
  const [university,     setUniversity]     = useState("");
  const [pastEmployer,   setPastEmployer]   = useState("");
  const [careerInterest, setCareerInterest] = useState<string[]>([]);

  // Networking identity
  const [openAlumni,     setOpenAlumni]     = useState(false);
  const [openColleague,  setOpenColleague]  = useState(false);
  const [openUniversity, setOpenUniversity] = useState(false);
  const [openCareer,     setOpenCareer]     = useState(false);

  // ── 04 · Your TechXchange Intent ─────────────────────────────────────────
  const [goals,      setGoals]      = useState<string[]>([]);
  const [tracks,     setTracks]     = useState<string[]>([]);
  const [needs,      setNeeds]      = useState<string[]>([]);
  const [community,  setCommunity]  = useState<string[]>([]);
  const [aspiration, setAspiration] = useState("");

  // ── 05 · Consent & Privacy ────────────────────────────────────────────────
  const [consentPublicProfile,           setConsentPublicProfile]           = useState(true);
  const [consentShowLinkedin,            setConsentShowLinkedin]            = useState(false);
  const [consentAllowIntroRequests,      setConsentAllowIntroRequests]      = useState(false);
  const [consentShareWithMatched,        setConsentShareWithMatched]        = useState(false);
  const [consentAllowAlumniMatching,     setConsentAllowAlumniMatching]     = useState(false);
  const [consentAllowEmployerMatching,   setConsentAllowEmployerMatching]   = useState(false);
  const [consentAllowUniversityMatching, setConsentAllowUniversityMatching] = useState(false);
  const [consentAllowSmsUpdates,         setConsentAllowSmsUpdates]         = useState(false);
  const [consentAllowEventNotifications, setConsentAllowEventNotifications] = useState(true);

  // ── Enrolled redirect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && user && enrolled) {
      router.replace("/experience");
    }
  }, [loading, user, enrolled, router]);

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (loading) {
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
        <section className="compact-hero">
          <div className="section-kicker">Build My Compass</div>
          <h1>Your personalised TechXchange starts here.</h1>
          <p>
            Sign in to build your Compass profile. Your intent, background, and goals
            power personalised session scores, champion matches, and your Next Best Move.
          </p>
        </section>
        <section className="section no-top-border">
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
      const firebaseParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);
      const first       = firstName.trim()  || firebaseParts[0] || "";
      const last        = lastName.trim()   || firebaseParts.slice(1).join(" ");
      const displayName = [first, last].filter(Boolean).join(" ")
                        || user?.email?.split("@")[0]
                        || "Attendee";

      const handle     = cleanLinkedInHandle(linkedinHandle);
      const linkedinUrl = handle ? `https://www.linkedin.com/in/${handle}` : "";

      const goalLabels = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
      const needLabels = NEEDS.filter(o => needs.includes(o.id)).map(o => o.label);
      const commLabels = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);

      const keywords = [
        ...goalLabels, ...tracks, ...needLabels, ...commLabels,
        university, pastEmployer, ...careerInterest,
        organization, jobTitle, industry, persona, aspiration, country, city,
      ].filter(Boolean).map(v => v.toLowerCase());

      const consentV1 = {
        public_profile:            consentPublicProfile,
        show_linkedin:             consentShowLinkedin,
        allow_intro_requests:      consentAllowIntroRequests,
        share_with_matched_attendees: consentShareWithMatched,
        allow_alumni_matching:     consentAllowAlumniMatching,
        allow_employer_matching:   consentAllowEmployerMatching,
        allow_university_matching: consentAllowUniversityMatching,
        allow_sms_updates:         consentAllowSmsUpdates,
        allow_event_notifications: consentAllowEventNotifications,
      };

      const networkingIdentity = {
        open_to_alumni_connections:         openAlumni,
        open_to_past_colleague_connections: openColleague,
        open_to_university_connections:     openUniversity,
        open_to_career_conversations:       openCareer,
      };

      // ── participants/{uid} — schema v1 ───────────────────────────────────
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
              needs:      needLabels,
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
          updatedAt: serverTimestamp(),
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
  const goalLabelsPreview  = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
  const needLabelsPreview  = NEEDS.filter(o => needs.includes(o.id)).map(o => o.label);
  const commLabelsPreview  = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="compact-hero">
        <div className="section-kicker">Build My Compass</div>
        <h1>Tell Compass what matters to you.</h1>
        <p>
          Compass uses your profile to score every session, surface relevant champions,
          and surface your Next Best Move. The more you share, the sharper your plan.
        </p>
      </section>

      <div style={{ maxWidth: "800px" }}>

        {/* ── 01 · About You ────────────────────────────────────────────── */}
        <section className="section no-top-border">
          <StepLabel
            step="01 · About You"
            title="Let's start with the basics."
            subtitle="Your name and location help Compass personalise your badge, introduce you to nearby attendees, and surface region-relevant sessions."
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
              <FieldLabel>Mobile phone</FieldLabel>
              <input type="tel" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)}
                placeholder="+1 555 000 0000 — international format" style={iS} />
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

        {/* ── 02 · Professional Context ─────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="02 · Professional Context"
            title="Your role shapes your Compass."
            subtitle="Compass uses your title, industry, and persona to weight session recommendations, match you with relevant IBM Champions, and surface community conversations that fit your career stage."
          />
          <div style={{ display: "grid", gap: "14px" }}>

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

          </div>
        </section>

        {/* ── 03 · Your Background ──────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="03 · Your Background"
            title="Find your hidden network."
            subtitle="Your education and career history unlock alumni, past-colleague, and peer connections you wouldn't find on a conference badge. The more Compass knows about your journey, the better it can find people who share it."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>University / School</FieldLabel>
              <input type="text" value={university} onChange={e => setUniversity(e.target.value)}
                placeholder="e.g. Georgia Tech, University of Toronto, MIT" style={iS} />
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

            <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 }}>
                Open to connections
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 }}>
                These settings control which background-based connections Compass will surface for you at TechXchange.
              </p>
              <CheckRow label="Connect with alumni from my university"  checked={openAlumni}     onChange={setOpenAlumni} />
              <CheckRow label="Connect with past colleagues"             checked={openColleague}  onChange={setOpenColleague} />
              <CheckRow label="Connect with my university community"     checked={openUniversity} onChange={setOpenUniversity} />
              <CheckRow label="Open to career conversations"             checked={openCareer}    onChange={setOpenCareer} />
            </div>

          </div>
        </section>

        {/* ── 04 · Your TechXchange Intent ──────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="04 · Your TechXchange Intent"
            title="What do you want to get out of TechXchange?"
            subtitle="This is the core of your Compass. Goals and tech tracks are the highest-weighted signals — they drive session scores, champion relevance, and your personalised schedule. The more you select, the more Compass can do."
          />

          <IntentSubsection title="Goals — why are you attending?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {GOALS.map(o => (
                <Chip key={o.id} label={o.label} icon={o.icon}
                  selected={goals.includes(o.id)} onClick={() => tog(goals, setGoals, o.id)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="Technology — which tracks are most relevant?">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              Tech tracks carry the highest scoring weight (+25 per match). Select every track where you want to go deep.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TRACKS.map(tr => (
                <Chip key={tr} label={tr}
                  selected={tracks.includes(tr)} onClick={() => tog(tracks, setTracks, tr)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="What I need from TechXchange">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              Compass matches these against session need tags (+15 per match).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {NEEDS.map(o => (
                <Chip key={o.id} label={o.label}
                  selected={needs.includes(o.id)} onClick={() => tog(needs, setNeeds, o.id)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="Community — who do you want to meet?">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              Compass surfaces IBM Champions, community events, and networking moments that match your connection goals.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {COMMUNITY.map(o => (
                <Chip key={o.id} label={o.label}
                  selected={community.includes(o.id)} onClick={() => tog(community, setCommunity, o.id)} />
              ))}
            </div>
          </IntentSubsection>

          <IntentSubsection title="In your own words — optional">
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "0 0 10px", lineHeight: 1.5 }}>
              What would make TechXchange 2026 worth your time? Compass reads this as your aspiration signal.
            </p>
            <textarea
              value={aspiration} onChange={e => setAspiration(e.target.value)}
              placeholder="A few strong connections, one breakthrough insight, and leaving with a clearer direction."
              rows={3}
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </IntentSubsection>

        </section>

        {/* ── 05 · Consent & Privacy ────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="05 · Consent & Privacy"
            title="Your data, your choice."
            subtitle="Compass only uses your profile for personalisation within this event. None of your data is sold or shared outside TechXchange. These settings are yours to change at any time from your profile page."
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
                    {jobTitle  ? ` · ${jobTitle}` : ""}
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
                  <p style={kicker}>Technology tracks ({tracks.length})</p>
                  <p style={reviewVal}>{tracks.join(", ")}</p>
                </div>
              )}

              {needLabelsPreview.length > 0 && (
                <div>
                  <p style={kicker}>What I need ({needLabelsPreview.length})</p>
                  <p style={reviewVal}>{needLabelsPreview.join(", ")}</p>
                </div>
              )}

              {commLabelsPreview.length > 0 && (
                <div>
                  <p style={kicker}>Community ({commLabelsPreview.length})</p>
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
              Select at least one goal or technology track to build your Compass.
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
              {saving ? "Building your Compass…" : "Build My Compass →"}
            </button>
            <Link href="/" className="btn-secondary">Back to home</Link>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5 }}>
            Your Compass profile is saved to your account and used only to personalise
            your TechXchange experience. Update it any time from your{" "}
            <a href="/profile" style={{ color: "var(--accent)" }}>profile</a>.
          </p>
        </section>

        <div style={{ height: "48px" }} />
      </div>
    </>
  );
}
