"use client";
// =============================================================================
// EventCompass — Build My Compass / Refine My Compass  /enroll
//
// Schema v1 full enrollment flow:
//   Auth gate  (+ "Forgot password?" reset via sendPasswordResetEmail)
//   → Step 00 Identity       first_name, last_name, mobile_phone, country, city
//   → Step 01 Professional   organization, job_title, persona, linkedin_url
//   → Step 02 Background     education[], past_employers[], career_interests[],
//                            networking_identity{}
//   → Step 03 Goals
//   → Step 04 Technology tracks
//   → Step 05 What I need
//   → Step 06 Community
//   → Step 07 Aspiration
//   → Consent
//   → Save → Confirm
//
// Query param: /enroll?mode=edit
//   • Skips enrolled-user redirect to /experience
//   • Pre-populates all fields from participants/{uid}
//   • Shows "Refine My Compass" copy instead of "Build My Compass"
//   • Confirm screen shows "Compass updated" messaging
//
// Writes to:
//   users/{uid}                                          (setDoc merge:true)
//   organizations/ibm/events/txc2026/participants/{uid}  (setDoc merge:true)
//
// Rules:
//   display_name = first_name + " " + last_name
//   participant_id = Firebase uid
//   linkedin_url blank if no valid handle
//   Profile and Enroll write identical participant fields
// =============================================================================

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams }    from "next/navigation";
import Link                              from "next/link";
import AuthPanel                         from "@/components/auth/AuthPanel";
import { useAuth }                       from "@/context/AuthContext";
import { db, auth }                      from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { sendPasswordResetEmail }        from "firebase/auth";

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
// Shared UI primitives
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Chip({ label, icon, selected, onClick }: { label: string; icon?: string; selected: boolean; onClick: () => void }) {
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

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <span style={{ color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.45 }}>{label}</span>
    </label>
  );
}

function ConsentGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        {children}
      </div>
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
  editMode,
  onEdit,
}: {
  firstName: string;
  editMode: boolean;
  onEdit: () => void;
}) {
  if (editMode) {
    return (
      <>
        <section className="compact-hero">
          <div className="section-kicker">Compass updated</div>
          <h1>Compass refined{firstName ? `, ${firstName}` : ""}.</h1>
          <p>
            Your updated signals are live. Sessions, Champions, and your four-day plan
            now reflect your latest profile.
          </p>
        </section>
        <section className="section no-top-border">
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/experience" className="btn-primary">Open My Compass →</Link>
            <button onClick={onEdit} className="btn-secondary">Edit again</button>
          </div>
        </section>
        <div style={{ height: "64px" }} />
      </>
    );
  }

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Compass ready</div>
        <h1>Your Compass is ready{firstName ? `, ${firstName}` : ""}.</h1>
        <p>
          Sessions, champions, and your Next Best Move are now scored for your profile.
          Open My Experience to see your personalised TechXchange plan.
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
// Inner page component (uses useSearchParams — requires Suspense wrapper)
// ─────────────────────────────────────────────────────────────────────────────

function EnrollPageInner() {
  const searchParams = useSearchParams();
  const editMode     = searchParams.get("mode") === "edit";

  const { user, enrolled, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [authed,  setAuthed]  = useState(false);
  const [screen,  setScreen]  = useState<"form" | "confirm">("form");
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // ── Password reset ─────────────────────────────────────────────────────────
  const [showPwReset,    setShowPwReset]    = useState(false);
  const [pwResetEmail,   setPwResetEmail]   = useState("");
  const [pwResetMsg,     setPwResetMsg]     = useState("");
  const [pwResetIsErr,   setPwResetIsErr]   = useState(false);
  const [pwResetSending, setPwResetSending] = useState(false);

  // ── Step 00 · Identity ─────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [country,     setCountry]     = useState("");
  const [city,        setCity]        = useState("");

  // ── Step 01 · Professional ─────────────────────────────────────────────────
  const [organization,   setOrganization]   = useState("");
  const [jobTitle,       setJobTitle]       = useState("");
  const [persona,        setPersona]        = useState("");
  const [linkedinHandle, setLinkedinHandle] = useState("");

  // ── Step 02 · Background ───────────────────────────────────────────────────
  const [university,     setUniversity]     = useState("");
  const [pastEmployer,   setPastEmployer]   = useState("");
  const [careerInterest, setCareerInterest] = useState<string[]>([]);

  // Networking identity
  const [openAlumni,     setOpenAlumni]     = useState(false);
  const [openColleague,  setOpenColleague]  = useState(false);
  const [openUniversity, setOpenUniversity] = useState(false);
  const [openCareer,     setOpenCareer]     = useState(false);

  // ── Consent v1 ─────────────────────────────────────────────────────────────
  const [consentPublicProfile,          setConsentPublicProfile]          = useState(true);
  const [consentShowLinkedin,           setConsentShowLinkedin]           = useState(false);
  const [consentAllowIntroRequests,     setConsentAllowIntroRequests]     = useState(false);
  const [consentAllowAlumniMatching,    setConsentAllowAlumniMatching]    = useState(false);
  const [consentAllowEmployerMatching,  setConsentAllowEmployerMatching]  = useState(false);
  const [consentAllowUniversityMatching,setConsentAllowUniversityMatching]= useState(false);
  const [consentAllowSmsUpdates,        setConsentAllowSmsUpdates]        = useState(false);
  const [consentAllowEventNotifications,setConsentAllowEventNotifications]= useState(true);

  // ── Steps 03–07 · Event signal ─────────────────────────────────────────────
  const [goals,      setGoals]      = useState<string[]>([]);
  const [tracks,     setTracks]     = useState<string[]>([]);
  const [needs,      setNeeds]      = useState<string[]>([]);
  const [community,  setCommunity]  = useState<string[]>([]);
  const [aspiration, setAspiration] = useState("");

  // ── Redirect: enrolled users go to /experience unless in edit mode ─────────
  useEffect(() => {
    if (!loading && user && enrolled && !editMode) {
      router.replace("/experience");
    }
  }, [loading, user, enrolled, editMode, router]);

  // ── Pre-populate form when editMode is active ──────────────────────────────
  useEffect(() => {
    if (!editMode || !user || loading) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, `${BASE}/participants/${user.uid}`));
        if (cancelled || !snap.exists()) return;
        const d      = snap.data() as Record<string, unknown>;
        const esp    = (d.event_signal_profile as Record<string, unknown>) ?? {};
        const intent = (esp.intent as Record<string, unknown>) ?? {};
        const ni     = (d.networking_identity as Record<string, boolean>) ?? {};
        const consent = (d.consent as Record<string, boolean>) ?? {};
        const edu    = (d.education as { institution?: string }[]) ?? [];
        const emp    = (d.past_employers as { company?: string }[]) ?? [];

        // Identity
        setFirstName(String(d.first_name ?? ""));
        setLastName(String(d.last_name ?? ""));
        setMobilePhone(String(d.mobile_phone ?? ""));
        setCountry(String(d.country ?? ""));
        setCity(String(d.city ?? ""));

        // Professional
        setOrganization(String(d.organization ?? d.company ?? ""));
        setJobTitle(String(d.job_title ?? ""));
        setPersona(String(d.persona ?? ""));
        const liUrl = String(d.linkedin_url ?? "");
        setLinkedinHandle(
          liUrl
            .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "")
            .replace(/\/+$/, "")
            .trim()
        );

        // Background
        setUniversity(edu[0]?.institution ?? "");
        setPastEmployer(emp[0]?.company ?? "");
        setCareerInterest((d.career_interests as string[]) ?? []);
        setOpenAlumni(ni.open_to_alumni_connections ?? false);
        setOpenColleague(ni.open_to_past_colleague_connections ?? false);
        setOpenUniversity(ni.open_to_university_connections ?? false);
        setOpenCareer(ni.open_to_career_conversations ?? false);

        // Goals — stored as labels → map back to IDs
        const savedGoalLabels = (esp.goals as string[]) ?? [];
        setGoals(GOALS.filter(g => savedGoalLabels.includes(g.label)).map(g => g.id));

        // Tracks — stored as strings
        setTracks((esp.tech_tracks as string[]) ?? []);

        // Needs — stored as labels → map back to IDs
        const savedNeedLabels = (intent.needs as string[]) ?? [];
        setNeeds(NEEDS.filter(n => savedNeedLabels.includes(n.label)).map(n => n.id));

        // Community — stored as labels → map back to IDs
        const savedCommLabels = (esp.open_to as string[]) ?? [];
        setCommunity(COMMUNITY.filter(c => savedCommLabels.includes(c.label)).map(c => c.id));

        // Aspiration
        setAspiration(String(intent.aspiration ?? ""));

        // Consent
        setConsentPublicProfile(consent.public_profile ?? true);
        setConsentShowLinkedin(consent.show_linkedin ?? false);
        setConsentAllowIntroRequests(consent.allow_intro_requests ?? false);
        setConsentAllowAlumniMatching(consent.allow_alumni_matching ?? false);
        setConsentAllowEmployerMatching(consent.allow_employer_matching ?? false);
        setConsentAllowUniversityMatching(consent.allow_university_matching ?? false);
        setConsentAllowSmsUpdates(consent.allow_sms_updates ?? false);
        setConsentAllowEventNotifications(consent.allow_event_notifications ?? true);
      } catch {
        // silent — form stays at defaults
      }
    })();

    return () => { cancelled = true; };
  }, [editMode, user, loading]);

  // ── Password reset handler ─────────────────────────────────────────────────
  async function handlePasswordReset() {
    const email = pwResetEmail.trim();
    if (!email) {
      setPwResetIsErr(true);
      setPwResetMsg("Please enter your email address.");
      return;
    }
    setPwResetSending(true);
    setPwResetMsg("");
    setPwResetIsErr(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setPwResetIsErr(false);
      setPwResetMsg("Reset link sent — check your inbox.");
      setPwResetEmail("");
    } catch (err: unknown) {
      setPwResetIsErr(true);
      setPwResetMsg((err as { message?: string }).message ?? "Could not send reset email.");
    } finally {
      setPwResetSending(false);
    }
  }

  // ── Auth loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Compass</div>
        <p style={{ color: "var(--muted)", marginTop: "12px" }}>Loading…</p>
      </section>
    );
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!user && !authed) {
    return (
      <>
        <section className="compact-hero">
          <div className="section-kicker">
            {editMode ? "Refine My Compass" : "Build My Compass"}
          </div>
          <h1>Tell Compass what matters to you.</h1>
          <p>Sign in or create an account to save your intent, agenda, and recommendations.</p>
        </section>

        <section className="section no-top-border">
          <AuthPanel onAuthenticated={() => setAuthed(true)} />

          {/* ── Forgot password ─────────────────────────────────────────── */}
          <div style={{ marginTop: "28px", paddingTop: "22px", borderTop: "1px solid var(--line)" }}>
            {!showPwReset ? (
              <button
                type="button"
                onClick={() => setShowPwReset(true)}
                style={{
                  background: "transparent", border: 0, padding: 0,
                  color: "var(--accent)", fontSize: "0.88rem",
                  fontFamily: "inherit", cursor: "pointer",
                }}
              >
                Forgot your password?
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "360px" }}>
                <p style={{ color: "var(--soft)", fontSize: "0.88rem", fontWeight: 600, margin: 0 }}>
                  Reset your password
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: 0 }}>
                  Enter the email on your account and we&apos;ll send a reset link.
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={pwResetEmail}
                  onChange={e => setPwResetEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePasswordReset()}
                  style={iS}
                />
                {pwResetMsg && (
                  <p style={{
                    fontSize: "0.85rem", margin: 0,
                    color: pwResetIsErr ? "#c0392b" : "var(--accent)",
                  }}>
                    {pwResetMsg}
                  </p>
                )}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={pwResetSending}
                    style={{
                      height: "38px", padding: "0 16px",
                      background: "var(--accent)", color: "var(--accent-text)",
                      border: "none", fontFamily: "inherit", fontSize: "0.88rem",
                      fontWeight: 650,
                      cursor: pwResetSending ? "not-allowed" : "pointer",
                      opacity: pwResetSending ? 0.7 : 1,
                    }}
                  >
                    {pwResetSending ? "Sending…" : "Send reset link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwReset(false);
                      setPwResetMsg("");
                      setPwResetEmail("");
                      setPwResetIsErr(false);
                    }}
                    style={{
                      height: "38px", padding: "0 14px",
                      background: "transparent", border: "1px solid var(--line)",
                      color: "var(--soft)", fontFamily: "inherit", fontSize: "0.88rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div style={{ height: "64px" }} />
      </>
    );
  }

  // ── Confirm ────────────────────────────────────────────────────────────────
  if (screen === "confirm") {
    const fallbackFirst = (user?.displayName ?? user?.email ?? "").split(/\s+/)[0] ?? "";
    return (
      <ConfirmScreen
        firstName={firstName.trim() || fallbackFirst}
        editMode={editMode}
        onEdit={() => setScreen("form")}
      />
    );
  }

  // ── Save handler ───────────────────────────────────────────────────────────
  const canSubmit = goals.length > 0 || tracks.length > 0;

  async function handleSave() {
    const uid = user?.uid;
    if (!uid || !canSubmit || saving) return;
    setSaveErr(""); setSaving(true);

    try {
      const firebaseNameParts = (user?.displayName ?? "").trim().split(/\s+/).filter(Boolean);

      const first = firstName.trim() || firebaseNameParts[0] || "";
      const last  = lastName.trim()  || firebaseNameParts.slice(1).join(" ");

      const displayName =
        [first, last].filter(Boolean).join(" ") ||
        user?.email?.split("@")[0] ||
        "Attendee";

      const handle      = cleanLinkedInHandle(linkedinHandle);
      const linkedinUrl = handle ? `https://www.linkedin.com/in/${handle}` : "";

      // Expand chip IDs → labels
      const goalLabels = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
      const needLabels = NEEDS.filter(o => needs.includes(o.id)).map(o => o.label);
      const commLabels = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);

      // Keyword bag for scoring engine
      const keywords = [
        ...goalLabels, ...tracks, ...needLabels, ...commLabels,
        university, pastEmployer, ...careerInterest,
        organization, jobTitle, persona, aspiration, country, city,
      ].filter(Boolean).map(v => v.toLowerCase());

      // ── Shared consent object (v1) ─────────────────────────────────────────
      const consentV1 = {
        public_profile:           consentPublicProfile,
        show_linkedin:            consentShowLinkedin,
        allow_intro_requests:     consentAllowIntroRequests,
        allow_alumni_matching:    consentAllowAlumniMatching,
        allow_employer_matching:  consentAllowEmployerMatching,
        allow_university_matching:consentAllowUniversityMatching,
        allow_sms_updates:        consentAllowSmsUpdates,
        allow_event_notifications:consentAllowEventNotifications,
      };

      // ── Shared networking identity ─────────────────────────────────────────
      const networkingIdentity = {
        open_to_alumni_connections:         openAlumni,
        open_to_past_colleague_connections: openColleague,
        open_to_university_connections:     openUniversity,
        open_to_career_conversations:       openCareer,
      };

      // ── participants/{uid} — full schema v1 ───────────────────────────────
      await setDoc(
        doc(db, `${BASE}/participants/${uid}`),
        {
          // Identity
          id:               uid,
          participant_id:   uid,
          participant_type: "attendee",
          first_name:       first,
          last_name:        last,
          display_name:     displayName,
          email:            user?.email ?? "",
          mobile_phone:     mobilePhone.trim(),

          // Professional
          organization,
          company:          organization,
          job_title:        jobTitle,
          persona,
          linkedin_url:     linkedinUrl,

          // Location
          country: country.trim(),
          city:    city.trim(),

          // Education & employment
          education:      university.trim() ? [{ institution: university.trim() }] : [],
          past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],

          // Career
          career_interests: careerInterest,

          // Consent v1
          consent: consentV1,

          // Networking identity
          networking_identity: networkingIdentity,

          // Event signal profile
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

          // Scoring engine
          compass_intelligence: {
            matching_keywords: [...new Set(keywords)],
            intent_narrative:  { aspiration },
          },

          registration: {
            attending:  true,
            registered: true,
            industry:   "",
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
          first_name:   first,
          last_name:    last,
          email:        user?.email ?? "",
          mobile_phone: mobilePhone.trim(),
          country:      country.trim(),
          city:         city.trim(),
          organization,
          role:         jobTitle,
          persona,
          goals:        goalLabels,
          interests:    tracks,
          linkedin_url: linkedinUrl,
          education:      university.trim() ? [{ institution: university.trim() }] : [],
          past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
          career_interests: careerInterest,
          networking_identity: networkingIdentity,
          consent: consentV1,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Refresh AuthContext so profile reflects updated data
      await refreshProfile();

      setScreen("confirm");
    } catch (err: unknown) {
      setSaveErr((err as Error).message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Form
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <section className="compact-hero">
        <div className="section-kicker">
          {editMode ? "Refine My Compass" : "Build My Compass"}
        </div>
        <h1>
          {editMode
            ? "Update the signals that drive your Compass."
            : "Tell Compass what matters to you."}
        </h1>
        <p>
          {editMode
            ? "Any changes take effect immediately — sessions, champion matches, and your Next Best Move are re-scored as soon as you save."
            : "These signals become your Compass profile. Every session score, champion match, and Next Best Move is computed from what you share here."}
        </p>
      </section>

      <div style={{ maxWidth: "800px" }}>

        {/* ── Step 00 · Identity ──────────────────────────────────────────── */}
        <section className="section no-top-border">
          <StepLabel
            step="00 · Identity"
            title="Tell us who you are."
            subtitle="Your display name is derived from first and last name and shown to other attendees."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>First name</FieldLabel>
                <input
                  type="text" value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Maya"
                  style={iS}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Last name</FieldLabel>
                <input
                  type="text" value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Patel"
                  style={iS}
                />
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Mobile phone</FieldLabel>
              <input
                type="tel" value={mobilePhone}
                onChange={e => setMobilePhone(e.target.value)}
                placeholder="+1 555 000 0000"
                style={iS}
              />
            </label>

            <div style={twoCol}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>Country</FieldLabel>
                <input
                  type="text" value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="United States"
                  style={iS}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <FieldLabel>City</FieldLabel>
                <input
                  type="text" value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Atlanta"
                  style={iS}
                />
              </label>
            </div>

          </div>
        </section>

        {/* ── Step 01 · Professional ──────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="01 · Professional"
            title="Your professional context."
            subtitle="Used to personalise session scores and surface relevant champions."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Organization / Company</FieldLabel>
              <input
                type="text" value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="Acme Corp"
                style={iS}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Job title</FieldLabel>
              <input
                type="text" value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Platform Engineer"
                style={iS}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Persona</FieldLabel>
              <select value={persona} onChange={e => setPersona(e.target.value)} style={iS}>
                <option value="">Select…</option>
                {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            {/* LinkedIn — fixed prefix + handle-only input */}
            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>LinkedIn</FieldLabel>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", background: "var(--panel)", overflow: "hidden" }}>
                <span style={{
                  padding: "0 12px", height: "42px",
                  display: "flex", alignItems: "center", flexShrink: 0,
                  borderRight: "1px solid var(--line)",
                  color: "var(--muted)", fontSize: "0.88rem",
                  whiteSpace: "nowrap", userSelect: "none",
                }}>
                  linkedin.com/in/
                </span>
                <input
                  type="text"
                  value={linkedinHandle}
                  onChange={e => setLinkedinHandle(cleanLinkedInHandle(e.target.value))}
                  placeholder="yourhandle"
                  autoComplete="off"
                  style={{
                    flex: 1, height: "42px", padding: "0 12px",
                    border: "none", background: "transparent",
                    color: "var(--text)", fontSize: "0.95rem",
                    fontFamily: "inherit", outline: "none", minWidth: 0,
                  }}
                />
              </div>
            </label>

          </div>
        </section>

        {/* ── Step 02 · Background ────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="02 · Background"
            title="Find your hidden network."
            subtitle="Unlocks alumni, past-colleague, and career-path connections at TechXchange."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>University / School</FieldLabel>
              <input
                type="text" value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="e.g. Georgia Tech, University of Toronto, MIT"
                style={iS}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <FieldLabel>Most recent past employer</FieldLabel>
              <input
                type="text" value={pastEmployer}
                onChange={e => setPastEmployer(e.target.value)}
                placeholder="e.g. Accenture, Red Hat, Deloitte"
                style={iS}
              />
            </label>

            <div>
              <p style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600, margin: "0 0 8px" }}>Career interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CAREER_INTERESTS.map(ci => (
                  <Chip key={ci} label={ci}
                    selected={careerInterest.includes(ci)}
                    onClick={() => tog(careerInterest, setCareerInterest, ci)} />
                ))}
              </div>
            </div>

            {/* Networking identity */}
            <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>
                Open to connections
              </p>
              <CheckRow label="Connect with alumni from my university"   checked={openAlumni}     onChange={setOpenAlumni} />
              <CheckRow label="Connect with past colleagues"              checked={openColleague}  onChange={setOpenColleague} />
              <CheckRow label="Connect with university community"         checked={openUniversity} onChange={setOpenUniversity} />
              <CheckRow label="Career conversations at TechXchange"       checked={openCareer}    onChange={setOpenCareer} />
            </div>

          </div>
        </section>

        {/* ── Step 03 · Goals ─────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="03 · Goals"
            title="Why are you attending TechXchange?"
            subtitle="Compass weights recommendations toward these outcomes."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {GOALS.map(o => (
              <Chip key={o.id} label={o.label} icon={o.icon}
                selected={goals.includes(o.id)} onClick={() => tog(goals, setGoals, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 04 · Technology tracks ─────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="04 · Technology interests"
            title="Which tech tracks are most relevant?"
            subtitle="The highest-weighted signal (+25) in session scoring."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TRACKS.map(tr => (
              <Chip key={tr} label={tr}
                selected={tracks.includes(tr)} onClick={() => tog(tracks, setTracks, tr)} />
            ))}
          </div>
        </section>

        {/* ── Step 05 · What I need ───────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="05 · What I need"
            title="What kind of experience are you looking for?"
            subtitle="Compass uses these to match need tags in sessions (+15 per match)."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {NEEDS.map(o => (
              <Chip key={o.id} label={o.label}
                selected={needs.includes(o.id)} onClick={() => tog(needs, setNeeds, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 06 · Community ─────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="06 · Community"
            title="Who do you want to meet?"
            subtitle="Compass surfaces champions and community events that match your connection goals."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {COMMUNITY.map(o => (
              <Chip key={o.id} label={o.label}
                selected={community.includes(o.id)} onClick={() => tog(community, setCommunity, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 07 · Aspiration ────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="07 · In your own words"
            title="What would make TechXchange 2026 worth your time?"
            subtitle="Optional. Compass reads this as your aspiration signal."
          />
          <textarea
            value={aspiration} onChange={e => setAspiration(e.target.value)}
            placeholder="A few strong connections, one breakthrough insight, and leaving with a clearer direction."
            rows={3}
            style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
          />
        </section>

        {/* ── Consent ─────────────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="Consent"
            title="How do you want your profile used?"
            subtitle="You can update these at any time from your profile page."
          />
          <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "20px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>

            <ConsentGroup label="Profile visibility">
              <CheckRow label="Make my profile visible to other attendees"  checked={consentPublicProfile}  onChange={setConsentPublicProfile} />
              <CheckRow label="Show my LinkedIn profile to my matches"       checked={consentShowLinkedin}   onChange={setConsentShowLinkedin} />
            </ConsentGroup>

            <ConsentGroup label="Matching">
              <CheckRow label="Allow other attendees to request introductions"  checked={consentAllowIntroRequests}      onChange={setConsentAllowIntroRequests} />
              <CheckRow label="Match me with fellow alumni"                      checked={consentAllowAlumniMatching}     onChange={setConsentAllowAlumniMatching} />
              <CheckRow label="Match me with people from past employers"         checked={consentAllowEmployerMatching}   onChange={setConsentAllowEmployerMatching} />
              <CheckRow label="Match me with my university community"            checked={consentAllowUniversityMatching} onChange={setConsentAllowUniversityMatching} />
            </ConsentGroup>

            <ConsentGroup label="Notifications">
              <CheckRow label="Receive SMS updates about my schedule"  checked={consentAllowSmsUpdates}        onChange={setConsentAllowSmsUpdates} />
              <CheckRow label="Receive event notifications"            checked={consentAllowEventNotifications} onChange={setConsentAllowEventNotifications} />
            </ConsentGroup>

          </div>
        </section>

        {/* ── Save ────────────────────────────────────────────────────────── */}
        <section className="section">
          {saveErr && (
            <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #DC2626", marginBottom: "16px" }}>
              <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{saveErr}</p>
            </div>
          )}
          {!canSubmit && (
            <p style={{ color: "var(--muted)", fontSize: "0.84rem", marginBottom: "12px" }}>
              Select at least one goal or tech track to save your Compass.
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
                ? "Saving…"
                : editMode
                  ? "Save and Refine My Compass →"
                  : "Save and Build My Compass →"}
            </button>
            {editMode ? (
              <Link href="/experience" className="btn-secondary">Back to My Compass</Link>
            ) : (
              <Link href="/" className="btn-secondary">Back to home</Link>
            )}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginTop: "14px", lineHeight: 1.5 }}>
            Your profile is saved to your account and powers personalised recommendations.
            Update it any time from your{" "}
            <a href="/profile" style={{ color: "var(--accent)" }}>profile</a>.
          </p>
        </section>

        <div style={{ height: "48px" }} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page export — Suspense wrapper required for useSearchParams in App Router
// ─────────────────────────────────────────────────────────────────────────────

export default function EnrollPage() {
  return (
    <Suspense
      fallback={
        <section className="section no-top-border">
          <div className="section-kicker">Compass</div>
          <p style={{ color: "var(--muted)", marginTop: "12px" }}>Loading…</p>
        </section>
      }
    >
      <EnrollPageInner />
    </Suspense>
  );
}
