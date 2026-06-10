"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";

const GOALS = [
  "Learn new technologies",
  "Earn a certification",
  "Meet IBM experts",
  "Explore AI",
  "Network with peers",
  "Discover customer stories",
  "Understand IBM roadmap",
  "Grow my career",
];

const TRACKS = [
  "AI", "Cloud", "Data", "Security", "Automation", "Storage",
  "IBM Z", "Red Hat", "App Development", "IT Optimization", "Power", "FinOps",
];

const NEEDS = [
  "Hands-on learning",
  "Architecture guidance",
  "Product roadmap",
  "Customer examples",
  "Career growth",
  "Networking",
  "Mentoring",
  "Strategic insights",
];

const COMMUNITY = [
  "Meet IBM Champions",
  "Meet Customers",
  "Meet Architects",
  "Find a Mentor",
  "Mentor Others",
  "Connect with Alumni",
  "Meet Industry Peers",
  "Open Source Community",
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        height: "36px",
        padding: "0 13px",
        border: selected ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: selected ? "var(--accent)" : "var(--panel)",
        color: selected ? "var(--accent-text)" : "var(--soft)",
        fontSize: "0.85rem",
        fontWeight: selected ? 650 : 500,
        fontFamily: "inherit",
        cursor: "pointer",
        marginRight: "8px",
        marginBottom: "8px",
      }}
    >
      {label} {selected ? "✓" : ""}
    </button>
  );
}

function splitName(name: string) {
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    displayName: clean,
  };
}

export default function EnrollPage() {
  const { user, loading } = useAuth();

  const [authed, setAuthed] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [community, setCommunity] = useState<string[]>([]);
  const [aspiration, setAspiration] = useState("");
  const [status, setStatus] = useState<"form" | "saving" | "saved" | "error">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const isAuthenticated = !!user || authed;
  const canSubmit = goals.length > 0 || tracks.length > 0;

  function toggle(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function saveCompassSignal() {
    if (!user || !canSubmit) return;

    setStatus("saving");
    setErrorMsg("");

    try {
      const uid = user.uid;

      const existingParticipant = await getDoc(doc(db, `${BASE}/participants/${uid}`));
      const existing = existingParticipant.exists()
        ? (existingParticipant.data() as Record<string, unknown>)
        : {};

      const existingDisplayName =
        typeof existing.display_name === "string" && existing.display_name.trim()
          ? existing.display_name.trim()
          : "";

      const existingCompany =
        typeof existing.company === "string" && existing.company.trim()
          ? existing.company.trim()
          : typeof existing.organization === "string" && existing.organization.trim()
            ? existing.organization.trim()
            : "";

      const existingRole =
        typeof existing.job_title === "string" && existing.job_title.trim()
          ? existing.job_title.trim()
          : "";

      const safeName =
        existingDisplayName ||
        user.displayName?.trim() ||
        user.email?.split("@")[0] ||
        "Attendee";

      const { firstName, lastName, displayName } = splitName(safeName);

      await Promise.all([
        setDoc(
          doc(db, "users", uid),
          {
            displayName,
            email: user.email ?? "",
            goals,
            interests: tracks,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),

        setDoc(
          doc(db, `${BASE}/participants/${uid}`),
          {
            id: uid,
            participant_id: uid,

            email: user.email ?? "",

            first_name: firstName,
            last_name: lastName,
            display_name: displayName,

            company: existingCompany,
            organization: existingCompany,
            job_title: existingRole,

            event_signal_profile: {
              goals,
              tech_tracks: tracks,
              open_to: community,
              intent: {
                needs,
                aspiration,
              },
            },

            compass_intelligence: {
              matching_keywords: [
                ...goals,
                ...tracks,
                ...needs,
                ...community,
                aspiration,
                existingCompany,
                existingRole,
              ]
                .filter(Boolean)
                .map((v) => String(v).toLowerCase()),
            },

            registration: {
              attending: true,
              registered: true,
              industry: "",
            },

            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);

      setStatus("saved");
    } catch (err) {
      console.error("[Enroll] save failed:", err);
      setErrorMsg("Compass could not save your profile. Please try again.");
      setStatus("error");
    }
  }

  if (loading) {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Compass</div>
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </section>
    );
  }

  if (!isAuthenticated) {
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
      </>
    );
  }

  if (status === "saved") {
    return (
      <>
        <section className="compact-hero">
          <div className="section-kicker">Compass ready</div>
          <h1>Your intent is saved.</h1>
          <p>Compass can now score sessions, recommend people, and shape your TechXchange experience.</p>
        </section>

        <section className="section no-top-border">
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/experience" className="btn-primary">Open My Compass →</Link>
            <button className="btn-secondary" onClick={() => setStatus("form")}>Edit intent</button>
          </div>
        </section>
      </>
    );
  }

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

      <div style={{ maxWidth: "900px" }}>
        <section className="section">
          <div className="section-kicker">01 · Goals</div>
          <h2>Why are you attending TechXchange?</h2>
          <div>{GOALS.map((g) => <Chip key={g} label={g} selected={goals.includes(g)} onClick={() => toggle(g, goals, setGoals)} />)}</div>
        </section>

        <section className="section">
          <div className="section-kicker">02 · Technology interests</div>
          <h2>Which tracks matter most?</h2>
          <div>{TRACKS.map((t) => <Chip key={t} label={t} selected={tracks.includes(t)} onClick={() => toggle(t, tracks, setTracks)} />)}</div>
        </section>

        <section className="section">
          <div className="section-kicker">03 · What I need</div>
          <h2>What should Compass help you find?</h2>
          <div>{NEEDS.map((n) => <Chip key={n} label={n} selected={needs.includes(n)} onClick={() => toggle(n, needs, setNeeds)} />)}</div>
        </section>

        <section className="section">
          <div className="section-kicker">04 · Community</div>
          <h2>Who do you want to meet?</h2>
          <div>{COMMUNITY.map((c) => <Chip key={c} label={c} selected={community.includes(c)} onClick={() => toggle(c, community, setCommunity)} />)}</div>
        </section>

        <section className="section">
          <div className="section-kicker">05 · In your own words</div>
          <h2>What would make the event worthwhile?</h2>
          <textarea
            value={aspiration}
            onChange={(e) => setAspiration(e.target.value)}
            rows={4}
            placeholder="A few strong connections, one breakthrough insight, and a clearer direction for what to do next."
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--line)",
              background: "var(--panel)",
              color: "var(--text)",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </section>

        <section className="section">
          <button
            onClick={saveCompassSignal}
            disabled={!canSubmit || status === "saving"}
            className="btn-primary"
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            {status === "saving" ? "Saving…" : "Save and Build My Compass →"}
          </button>

          <Link href="/" className="btn-secondary" style={{ marginLeft: "12px" }}>
            Back to home
          </Link>

          {!canSubmit && (
            <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
              Select at least one goal or track to continue.
            </p>
          )}

          {status === "error" && (
            <p style={{ color: "var(--accent)", fontSize: "0.9rem" }}>
              {errorMsg}
            </p>
          )}
        </section>
      </div>
    </>
  );
}