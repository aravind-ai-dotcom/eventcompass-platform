// =============================================================================
// EventCompass — Event Highlights
// src/components/experience/EventHighlights.tsx
//
// Always visible. Never mixed with the recommendation engine.
// Shows premium TechXchange shared moments separately.
// Status: upcoming | live | completed
// Future: replay_url, livestream_url
// =============================================================================

"use client";

export interface EventHighlight {
  id:          string;
  title:       string;
  description: string;
  day:         string;         // e.g. "Monday, October 27"
  time:        string;         // e.g. "9:00 AM"
  location:    string;
  status:      "upcoming" | "live" | "completed";
  replay_url?:     string;
  livestream_url?: string;
}

// Default highlights — override via props for production data
const DEFAULT_HIGHLIGHTS: EventHighlight[] = [
  { id: "community-day",    title: "Community Day",                day: "Sunday, October 26",    time: "All Day",    location: "Georgia World Congress Center", status: "upcoming",   description: "The kickoff day for IBM Champions, communities, and first-time attendees." },
  { id: "partner-day",      title: "Partner Day",                  day: "Sunday, October 26",    time: "All Day",    location: "Georgia World Congress Center", status: "upcoming",   description: "Dedicated programming for IBM Business Partners and ecosystem members." },
  { id: "keynote-tuesday",  title: "Tuesday Keynote",              day: "Tuesday, October 28",   time: "8:30 AM",    location: "Ballroom A",                    status: "upcoming",   description: "The main stage moment that sets the direction for the week." },
  { id: "keynote-wednesday",title: "Wednesday Keynote",            day: "Wednesday, October 29", time: "8:30 AM",    location: "Ballroom A",                    status: "upcoming",   description: "Day two main stage with product announcements and IBM leadership." },
  { id: "sandbox",          title: "Sandbox Block Party",          day: "Tuesday, October 28",   time: "6:00 PM",    location: "Exhibit Hall",                  status: "upcoming",   description: "The unmissable evening social experience with demos, music, and networking." },
  { id: "tuesday-night",    title: "Tuesday Night Experience",     day: "Tuesday, October 28",   time: "8:00 PM",    location: "TBA",                           status: "upcoming",   description: "The signature evening event of TechXchange 2026." },
  { id: "closing",          title: "Closing Session & Awards",     day: "Thursday, October 30",  time: "3:00 PM",    location: "Ballroom A",                    status: "upcoming",   description: "Celebrate the week, recognise excellence, and close TechXchange 2026." },
];

const STATUS_CONFIG = {
  live:      { dot: "#EF4444", label: "Live now",  bg: "#FEE2E2", text: "#DC2626" },
  upcoming:  { dot: "var(--accent)", label: "Upcoming", bg: "transparent", text: "var(--muted)" },
  completed: { dot: "var(--line-strong)", label: "Concluded", bg: "transparent", text: "var(--muted)" },
};

function HighlightCard({ highlight }: { highlight: EventHighlight }) {
  const cfg       = STATUS_CONFIG[highlight.status];
  const faded     = highlight.status === "completed";
  const isLive    = highlight.status === "live";

  return (
    <article
      style={{
        border:      isLive ? "1px solid #EF4444" : "1px solid var(--line)",
        background:  "var(--panel)",
        padding:     "20px 22px",
        opacity:     faded ? 0.55 : 1,
        display:     "flex",
        flexDirection: "column",
        gap:         "10px",
        position:    "relative",
      }}
    >
      {/* Status badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0,
            boxShadow: isLive ? "0 0 0 3px rgba(239,68,68,0.2)" : "none",
            animation: isLive ? "compass-pulse 1.2s ease-in-out infinite" : "none",
            display: "inline-block" }} />
          <span style={{ color: cfg.text, fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {cfg.label}
          </span>
        </div>
        <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "var(--font-mono, ui-monospace)" }}>
          {highlight.day}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 580, letterSpacing: "-0.02em", color: faded ? "var(--muted)" : "var(--text)", lineHeight: 1.2 }}>
        {highlight.title}
      </h3>

      {/* Time + location */}
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.84rem" }}>
        {highlight.time} · {highlight.location}
      </p>

      {/* Description */}
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
        {highlight.description}
      </p>

      {/* Action links */}
      {(highlight.replay_url || highlight.livestream_url) && (
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {highlight.livestream_url && (
            <a href={highlight.livestream_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#EF4444", fontSize: "0.82rem", fontWeight: 650 }}>
              ▶ Watch Live
            </a>
          )}
          {highlight.replay_url && (
            <a href={highlight.replay_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--accent)", fontSize: "0.82rem", fontWeight: 650 }}>
              ↩ Replay
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function EventHighlights({ highlights = DEFAULT_HIGHLIGHTS }: { highlights?: EventHighlight[] }) {
  const live      = highlights.filter(h => h.status === "live");
  const upcoming  = highlights.filter(h => h.status === "upcoming");
  const completed = highlights.filter(h => h.status === "completed");
  const sorted    = [...live, ...upcoming, ...completed];

  return (
    <section style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div className="section-kicker">Event highlights</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
            Shared moments not to miss.
          </h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", maxWidth: "360px", margin: 0, lineHeight: 1.5 }}>
          These are the anchor experiences of TechXchange 2026 — always visible, separate from your personalized plan.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
        {sorted.map(h => <HighlightCard key={h.id} highlight={h} />)}
      </div>
    </section>
  );
}
