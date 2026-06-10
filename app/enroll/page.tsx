"use client";
// =============================================================================
// EventCompass — Build My Compass  /enroll
//
// Flow:
//   Auth gate → Step 00 Identity → Step 01 Network signal
//   → Steps 02–07 Intent → Save → Confirm
//
// Writes to:
//   users/{uid}                                        (setDoc merge:true)
//   organizations/ibm/events/txc2026/participants/{uid} (setDoc merge:true)
//
// Rules:
//   - auth.ts not modified
//   - experience page not modified
//   - No ATT-0001 / no demo participant logic
//   - Authenticated user.uid used throughout
// =============================================================================

import { useState }  from "react";
import Link          from "next/link";
import AuthPanel     from "@/components/auth/AuthPanel";
import { useAuth }   from "@/context/AuthContext";
import { db }        from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const BASE = "organizations/ibm/events/txc2026";

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers
// ─────────────────────────────────────────────────────────────────────────────

function splitDisplayName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

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
  { id: "champions",   label: "Meet IBM Champions"   },
  { id: "customers",   label: "Meet Customers"       },
  { id: "architects",  label: "Meet Architects"      },
  { id: "find-mentor", label: "Find a Mentor"        },
  { id: "be-mentor",   label: "Mentor Others"        },
  { id: "alumni",      label: "Connect with Alumni"  },
  { id: "peers",       label: "Meet Industry Peers"  },
  { id: "open-source", label: "Open Source Community"},
];

const PILLARS = [
  { id: "learning",  label: "Primarily Learning",  body: "Labs, certifications, and deep technical sessions." },
  { id: "community", label: "Primarily Community", body: "Connections, conversations, and people matter most." },
  { id: "fun",       label: "Primarily Fun",        body: "Energy, events, and social moments." },
  { id: "balanced",  label: "Balanced",             body: "A mix of all three pillars." },
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

function Chip({ label, icon, selected, onClick }: { label: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={selected} style={{
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
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EnrollPage() {
  const { user, loading } = useAuth();
  const [authed,   setAuthed]   = useState(false);
  const [screen,   setScreen]   = useState<"form" | "confirm">("form");
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState("");

  // Step 00 — Identity
  const [displayName,  setDisplayName]  = useState("");
  const [organization, setOrganization] = useState("");
  const [role,         setRole]         = useState("");
  const [persona,      setPersona]      = useState("");

  // Step 01 — Network signal
  const [linkedinHandle,  setLinkedinHandle]  = useState("");
  const [university,      setUniversity]      = useState("");
  const [pastEmployer,    setPastEmployer]    = useState("");
  const [careerInterest,  setCareerInterest]  = useState<string[]>([]);
  const [openAlumni,      setOpenAlumni]      = useState(false);
  const [openColleague,   setOpenColleague]   = useState(false);
  const [openUniversity,  setOpenUniversity]  = useState(false);
  const [openCareer,      setOpenCareer]      = useState(false);

  // Steps 02–07 — Intent
  const [goals,      setGoals]      = useState<string[]>([]);
  const [tracks,     setTracks]     = useState<string[]>([]);
  const [needs,      setNeeds]      = useState<string[]>([]);
  const [community,  setCommunity]  = useState<string[]>([]);
  const [pillar,     setPillar]     = useState("balanced");
  const [aspiration, setAspiration] = useState("");

  // ── Auth loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Compass</div>
        <p style={{ color: "var(--muted)", marginTop: "12px" }}>Loading…</p>
      </section>
    );
  }

  // ── Auth gate ───────────────────────────────────────────────────────────
  if (!user && !authed) {
    return (
      <>
        <section className="compact-hero">
          <div className="section-kicker">Build My Compass</div>
          <h1>Tell Compass what matters to you.</h1>
          <p>Sign in or create an account to save your intent, agenda, and recommendations.</p>
        </section>
        <section className="section no-top-border">
          <AuthPanel onAuthenticated={() => setAuthed(true)} />
        </section>
        <div style={{ height: "64px" }} />
      </>
    );
  }

  // ── Confirm ─────────────────────────────────────────────────────────────
  if (screen === "confirm") {
    const resolved = displayName.trim() || user?.displayName || user?.email?.split("@")[0] || "Attendee";
    return <ConfirmScreen firstName={splitDisplayName(resolved).first} onEdit={() => setScreen("form")} />;
  }

  // ── Save handler ────────────────────────────────────────────────────────
  const canSubmit = goals.length > 0 || tracks.length > 0;

  async function handleSave() {
    const uid = user?.uid;
    if (!uid || !canSubmit || saving) return;
    setSaveErr(""); setSaving(true);
    try {
      // Resolve display name — fallback chain
      const resolved   = displayName.trim() || user?.displayName || user?.email?.split("@")[0] || "Attendee";
      const { first, last } = splitDisplayName(resolved);
      const handle     = cleanLinkedInHandle(linkedinHandle);
      const linkedinUrl = handle ? `https://www.linkedin.com/in/${handle}` : "";

      // Expand IDs to labels for Firestore
      const goalLabels = GOALS.filter(o => goals.includes(o.id)).map(o => o.label);
      const needLabels = NEEDS.filter(o => needs.includes(o.id)).map(o => o.label);
      const commLabels = COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label);

      // Build keyword array for scoring engine
      const keywords = [
        ...goalLabels, ...tracks, ...needLabels, ...commLabels,
        university, pastEmployer, ...careerInterest,
        organization, role, persona, aspiration,
      ].filter(Boolean).map(v => v.toLowerCase());

      // ── participants/{uid} ─────────────────────────────────────────────
      await setDoc(
        doc(db, `${BASE}/participants/${uid}`),
        {
          id:             uid,
          participant_id: uid,
          first_name:     first,
          last_name:      last,
          display_name:   resolved,
          email:          user?.email ?? "",
          company:        organization,
          organization,
          job_title:      role,
          persona,
          linkedin_url:   linkedinUrl,
          education:      university.trim() ? [{ institution: university.trim() }] : [],
          past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
          career_interests: careerInterest,
          networking_identity: {
            open_to_alumni_connections:         openAlumni,
            open_to_past_colleague_connections: openColleague,
            open_to_university_connections:     openUniversity,
            open_to_career_conversations:       openCareer,
          },
          event_signal_profile: {
            goals:       goalLabels,
            tech_tracks: tracks,
            open_to:     commLabels,
            roles_at_txc: role ? [role] : [],
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
            attending:  true,
            registered: true,
            industry:   "",
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ── users/{uid} ────────────────────────────────────────────────────
      await setDoc(
        doc(db, `users/${uid}`),
        {
          displayName:    resolved,
          email:          user?.email ?? "",
          organization,
          role,
          persona,
          goals:          goalLabels,
          interests:      tracks,
          linkedin_url:   linkedinUrl,
          education:      university.trim() ? [{ institution: university.trim() }] : [],
          past_employers: pastEmployer.trim() ? [{ company: pastEmployer.trim() }] : [],
          career_interests: careerInterest,
          networking_identity: {
            open_to_alumni_connections:         openAlumni,
            open_to_past_colleague_connections: openColleague,
            open_to_university_connections:     openUniversity,
            open_to_career_conversations:       openCareer,
          },
          consent: {
            networking:          openAlumni || openColleague || openUniversity,
            mentoring:           openCareer,
            recruiting:          false,
            partnerIntroductions:false,
          },
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

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <section className="compact-hero">
        <div className="section-kicker">Build My Compass</div>
        <h1>Tell Compass what matters to you.</h1>
        <p>
          These signals become your Compass profile. Every session score, champion match,
          and Next Best Move is computed from what you share here.
        </p>
      </section>

      <div style={{ maxWidth: "800px" }}>

        {/* ── Step 00 · Identity ────────────────────────────────────────── */}
        <section className="section no-top-border">
          <StepLabel
            step="00 · Identity"
            title="Tell us who you are."
            subtitle="This personalises your experience and helps other attendees find you."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Display name</span>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder={user?.displayName ?? "Maya Patel"} style={iS} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Organization / Company</span>
              <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="Acme Corp" style={iS} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Role / Title</span>
              <input type="text" value={role} onChange={e => setRole(e.target.value)}
                placeholder="Platform Engineer" style={iS} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Persona</span>
              <select value={persona} onChange={e => setPersona(e.target.value)} style={iS}>
                <option value="">Select…</option>
                {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

          </div>
        </section>

        {/* ── Step 01 · Network signal ──────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="01 · Network signal"
            title="Find your hidden network."
            subtitle="Unlocks alumni, past-colleague, and career-path connections at TechXchange."
          />
          <div style={{ display: "grid", gap: "14px" }}>

            {/* LinkedIn — fixed prefix + handle-only input */}
            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>LinkedIn</span>
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

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>University / School</span>
              <input type="text" value={university} onChange={e => setUniversity(e.target.value)}
                placeholder="e.g. Georgia Tech, University of Toronto, MIT" style={iS} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Most recent past employer</span>
              <input type="text" value={pastEmployer} onChange={e => setPastEmployer(e.target.value)}
                placeholder="e.g. Accenture, Red Hat, Deloitte" style={iS} />
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

            <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>
                Open to connections
              </p>
              {([
                ["Connect with alumni from my university",  openAlumni,    setOpenAlumni],
                ["Connect with past colleagues",             openColleague, setOpenColleague],
                ["Connect with university community",        openUniversity,setOpenUniversity],
                ["Career conversations at TechXchange",      openCareer,    setOpenCareer],
              ] as [string, boolean, (v: boolean) => void][]).map(([lbl, val, set]) => (
                <label key={lbl} style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.45 }}>{lbl}</span>
                </label>
              ))}
            </div>

          </div>
        </section>

        {/* ── Step 02 · Goals ───────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="02 · Goals"
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

        {/* ── Step 03 · Tech tracks ──────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="03 · Technology interests"
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

        {/* ── Step 04 · Needs ───────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="04 · What I need"
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

        {/* ── Step 05 · Community ───────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="05 · Community"
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

        {/* ── Step 06 · Experience balance ──────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="06 · Experience balance"
            title="How do you want to spend your time?"
            subtitle="Compass adjusts the weight of Community, Learning, and Fun."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "10px" }}>
            {PILLARS.map(o => (
              <button key={o.id} onClick={() => setPillar(o.id)} aria-pressed={pillar === o.id}
                style={{
                  padding: "16px 18px", textAlign: "left",
                  border:      pillar === o.id ? "1px solid var(--accent)" : "1px solid var(--line)",
                  background:  pillar === o.id ? "var(--accent)"           : "var(--panel)",
                  color:       pillar === o.id ? "var(--accent-text)"      : "var(--text)",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                <p style={{ margin: "0 0 5px", fontWeight: 650, fontSize: "0.92rem" }}>{o.label}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.82, lineHeight: 1.4 }}>{o.body}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 07 · In your own words ───────────────────────────────── */}
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

        {/* ── Save ──────────────────────────────────────────────────────── */}
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
              {saving ? "Saving…" : "Save and Build My Compass →"}
            </button>
            <Link href="/" className="btn-secondary">Back to home</Link>
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
