"use client";
// =============================================================================
// EventCompass — Intent & Enrollment  /enroll
//
// Wave 4 upgrade: full intent-capture UI.
// Captures: Goals · Tech tracks · Needs · Community interests · Pillar balance
// No Firestore writes yet (Phase 7).
// =============================================================================
import { useState } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Signal options
// ─────────────────────────────────────────────────────────────────────────────

const GOALS = [
  { id: "learn-tech",      label: "Learn new technologies",    icon: "◈" },
  { id: "earn-cert",       label: "Earn a certification",      icon: "◎" },
  { id: "meet-experts",    label: "Meet IBM experts",          icon: "◉" },
  { id: "explore-ai",      label: "Explore AI",                icon: "◆" },
  { id: "network",         label: "Network with peers",        icon: "◈" },
  { id: "customer-stories",label: "Discover customer stories", icon: "◎" },
  { id: "product-roadmap", label: "Understand IBM roadmap",    icon: "◉" },
  { id: "career-growth",   label: "Grow my career",            icon: "◆" },
];

const TRACKS = [
  "AI", "Cloud", "Data", "Security", "Automation",
  "Storage", "IBM Z", "Red Hat", "App Development",
  "IT Optimization", "Power", "FinOps",
];

const NEEDS = [
  { id: "hands-on",     label: "Hands-on learning" },
  { id: "architecture", label: "Architecture guidance" },
  { id: "roadmap",      label: "Product roadmap" },
  { id: "customers",    label: "Customer examples" },
  { id: "career",       label: "Career growth" },
  { id: "networking",   label: "Networking" },
  { id: "mentoring",    label: "Mentoring" },
  { id: "strategy",     label: "Strategic insights" },
];

const COMMUNITY = [
  { id: "champions",  label: "Meet IBM Champions" },
  { id: "customers",  label: "Meet Customers" },
  { id: "architects", label: "Meet Architects" },
  { id: "find-mentor",label: "Find a Mentor" },
  { id: "be-mentor",  label: "Mentor Others" },
  { id: "alumni",     label: "Connect with Alumni" },
  { id: "peers",      label: "Meet Industry Peers" },
  { id: "open-source",label: "Open Source Community" },
];

const PILLARS = [
  { id: "learning",  label: "Primarily Learning",   body: "Labs, certifications, and deep technical sessions." },
  { id: "community", label: "Primarily Community",  body: "Connections, conversations, and people matter most." },
  { id: "fun",       label: "Primarily Fun",        body: "Energy, events, and social moments make it worthwhile." },
  { id: "balanced",  label: "Balanced",             body: "A mix of all three pillars throughout the event." },
];

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
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

function Chip({
  label, icon, selected, onClick,
}: { label: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display:    "inline-flex",
        alignItems: "center",
        gap:        "6px",
        height:     "36px",
        padding:    "0 13px",
        border:     selected ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: selected ? "var(--accent)" : "var(--panel)",
        color:      selected ? "var(--accent-text)" : "var(--soft)",
        fontSize:   "0.85rem",
        fontWeight: selected ? 650 : 500,
        fontFamily: "inherit",
        cursor:     "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        marginBottom: "6px",
      }}
    >
      {icon && <span aria-hidden="true" style={{ fontSize: "0.7rem" }}>{icon}</span>}
      {label}
      {selected && <span aria-hidden="true" style={{ fontSize: "0.7rem", opacity: 0.7 }}>✓</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation screen
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmScreen({
  summary, aspiration, onEdit,
}: {
  summary: { label: string; items: string[] }[];
  aspiration: string;
  onEdit: () => void;
}) {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Compass ready</div>
        <h1>Your intent is set.</h1>
        <p>
          Compass has everything it needs to score sessions, match champions,
          and surface your Next Best Move throughout TechXchange.
        </p>
      </section>

      <section className="section no-top-border">
        <div className="section-kicker">What you told Compass</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "1px", background: "var(--line)", border: "1px solid var(--line)", margin: "16px 0 24px" }}>
          {summary.filter(g => g.items.length > 0).map(group => (
            <div key={group.label} style={{ background: "var(--panel)", padding: "16px 18px" }}>
              <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{group.label}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                {group.items.map(item => (
                  <li key={item} style={{ display: "flex", gap: "7px", alignItems: "flex-start", color: "var(--soft)", fontSize: "0.88rem", lineHeight: 1.35 }}>
                    <span style={{ color: "var(--accent)", fontSize: "0.5rem", marginTop: "0.45em", flexShrink: 0 }}>◆</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {aspiration && (
          <div style={{ border: "1px solid var(--line)", background: "var(--panel)", padding: "14px 18px", marginBottom: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 5px" }}>In your own words</p>
            <p style={{ color: "var(--soft)", margin: 0, fontSize: "0.92rem", lineHeight: 1.55, fontStyle: "italic" }}>"{aspiration}"</p>
          </div>
        )}

        <div style={{ border: "1px solid var(--accent)", background: "var(--panel)", padding: "14px 18px", marginBottom: "28px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>Prototype</p>
          <p style={{ color: "var(--soft)", margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
            In the full version these signals write to Firestore and immediately update scoring.
            For now, open My Experience to see live recommendations for profile ATT-0001.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
          <button onClick={onEdit} className="btn-secondary">Edit my intent</button>
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
  const [screen,    setScreen]    = useState<"form" | "confirm">("form");
  const [goals,     setGoals]     = useState<string[]>([]);
  const [tracks,    setTracks]    = useState<string[]>([]);
  const [needs,     setNeeds]     = useState<string[]>([]);
  const [community, setCommunity] = useState<string[]>([]);
  const [pillar,    setPillar]    = useState("balanced");
  const [aspiration,setAspiration]= useState("");

  function toggle(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  if (screen === "confirm") {
    const summary = [
      { label: "Goals",          items: GOALS.filter(o => goals.includes(o.id)).map(o => o.label) },
      { label: "Tech tracks",    items: tracks },
      { label: "What I need",    items: NEEDS.filter(o => needs.includes(o.id)).map(o => o.label) },
      { label: "Community",      items: COMMUNITY.filter(o => community.includes(o.id)).map(o => o.label) },
      { label: "Experience",     items: [PILLARS.find(p => p.id === pillar)?.label ?? "Balanced"] },
    ];
    return <ConfirmScreen summary={summary} aspiration={aspiration} onEdit={() => setScreen("form")} />;
  }

  const canSubmit = goals.length > 0 || tracks.length > 0;

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Build My Compass</div>
        <h1>Tell Compass what matters to you.</h1>
        <p>
          These signals become your Compass profile. Every session score, champion match,
          and Next Best Move is computed from what you share here.
        </p>
      </section>

      <div style={{ maxWidth: "800px" }}>

        {/* Prototype notice */}
        <section className="section no-top-border">
          <div style={{ border: "1px solid var(--accent)", background: "var(--panel)", padding: "14px 18px" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>
              Prototype note
            </p>
            <p style={{ color: "var(--soft)", margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              Firestore writes and IBM ID authentication are added in the next phase.
              The experience page currently loads participant <strong>ATT-0001</strong> directly.
            </p>
          </div>
        </section>

        {/* ── Step 1: Goals ─────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="01 · Goals"
            title="Why are you attending TechXchange?"
            subtitle="Select everything that applies. Compass weights recommendations toward these outcomes."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {GOALS.map(o => (
              <Chip key={o.id} label={o.label} icon={o.icon} selected={goals.includes(o.id)} onClick={() => toggle(goals, setGoals, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 2: Tech tracks ───────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="02 · Technology interests"
            title="Which tech tracks are most relevant to you?"
            subtitle="These map directly to session track matching — the highest-weighted signal (+25) in the scoring model."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TRACKS.map(tr => (
              <Chip key={tr} label={tr} selected={tracks.includes(tr)} onClick={() => toggle(tracks, setTracks, tr)} />
            ))}
          </div>
        </section>

        {/* ── Step 3: Needs ─────────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="03 · What I need"
            title="What kind of experience are you looking for?"
            subtitle="Compass uses these to match need tags in session descriptions (+15 per match)."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {NEEDS.map(o => (
              <Chip key={o.id} label={o.label} selected={needs.includes(o.id)} onClick={() => toggle(needs, setNeeds, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 4: Community ─────────────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="04 · Community"
            title="Who do you want to meet?"
            subtitle="Compass surfaces champions and community events that match your connection goals."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {COMMUNITY.map(o => (
              <Chip key={o.id} label={o.label} selected={community.includes(o.id)} onClick={() => toggle(community, setCommunity, o.id)} />
            ))}
          </div>
        </section>

        {/* ── Step 5: Experience balance ────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="05 · Experience balance"
            title="How do you want to spend your time?"
            subtitle="Compass adjusts the weight of Community, Learning, and Fun in your recommendations."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
            {PILLARS.map(o => (
              <button
                key={o.id}
                onClick={() => setPillar(o.id)}
                aria-pressed={pillar === o.id}
                style={{
                  padding:    "16px 18px",
                  border:     pillar === o.id ? "1px solid var(--accent)" : "1px solid var(--line)",
                  background: pillar === o.id ? "var(--accent)" : "var(--panel)",
                  color:      pillar === o.id ? "var(--accent-text)" : "var(--text)",
                  textAlign:  "left",
                  cursor:     "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                <p style={{ margin: "0 0 5px", fontWeight: 650, fontSize: "0.92rem" }}>{o.label}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.82, lineHeight: 1.4 }}>{o.body}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 6: In your own words ─────────────────────────────────── */}
        <section className="section">
          <StepLabel
            step="06 · In your own words"
            title="What would make TechXchange 2026 worth your time?"
            subtitle="Optional. Compass reads this as your aspiration signal."
          />
          <textarea
            value={aspiration}
            onChange={e => setAspiration(e.target.value)}
            placeholder="A few strong connections, one breakthrough insight, and leaving with a clearer direction for what to do next."
            rows={3}
            style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
          />
        </section>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <section className="section">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <button
              onClick={() => setScreen("confirm")}
              className="btn-primary"
              disabled={!canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "default" }}
            >
              Build My Compass →
            </button>
            <Link href="/" className="btn-secondary">Back to home</Link>
            {!canSubmit && (
              <span style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
                Select at least one goal or track to continue
              </span>
            )}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "14px", lineHeight: 1.5 }}>
            Your selections are used only to power your personalised recommendations.
            You can update your intent at any time.
          </p>
        </section>

        <div style={{ height: "48px" }} />
      </div>
    </>
  );
}
