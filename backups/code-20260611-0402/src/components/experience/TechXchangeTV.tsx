// =============================================================================
// EventCompass — TechXchange TV
// src/components/experience/TechXchangeTV.tsx
//
// Phase 10: Live event channel placeholder.
// Container is designed now. Streaming hooked up later.
// Shows: current program, upcoming, live indicator, viewer count placeholder.
// =============================================================================

"use client";

interface TVProgram {
  title:    string;
  host?:    string;
  time:     string;
  status:   "live" | "upcoming" | "ended";
}

interface Props {
  programs?: TVProgram[];
  viewerCount?: number;
}

const DEFAULT_PROGRAMS: TVProgram[] = [
  { title: "Live programming coming soon", time: "TBA", status: "upcoming" },
];

function LiveDot() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
      <span
        style={{
          display:   "inline-block",
          width:     8,
          height:    8,
          borderRadius: "50%",
          background: "#EF4444",
          boxShadow:  "0 0 0 3px rgba(239,68,68,0.2)",
          animation:  "compass-pulse 1.2s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#EF4444", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Live
      </span>
    </span>
  );
}

export default function TechXchangeTV({ programs = DEFAULT_PROGRAMS, viewerCount }: Props) {
  const liveProgram     = programs.find(p => p.status === "live");
  const upcomingPrograms= programs.filter(p => p.status === "upcoming").slice(0, 2);

  return (
    <div
      style={{
        border:     "1px solid var(--line)",
        background: "var(--panel)",
        overflow:   "hidden",
      }}
    >
      {/* Channel header */}
      <div
        style={{
          background: "var(--black, #0F172A)",
          padding:    "14px 20px",
          display:    "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap:        "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
            TechXchange TV
          </span>
          {liveProgram && <LiveDot />}
        </div>
        {viewerCount !== undefined && liveProgram && (
          <span style={{ color: "#6B7280", fontSize: "0.78rem" }}>
            {viewerCount.toLocaleString()} watching
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "18px 20px" }}>
        {liveProgram ? (
          <div style={{ marginBottom: upcomingPrograms.length > 0 ? "16px" : 0 }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 6px" }}>
              Now playing
            </p>
            <p style={{ color: "var(--text)", fontWeight: 560, fontSize: "1rem", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {liveProgram.title}
            </p>
            {liveProgram.host && (
              <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: "0 0 10px" }}>
                Hosted by {liveProgram.host}
              </p>
            )}
            <button
              style={{
                display:    "inline-flex",
                alignItems: "center",
                gap:        "6px",
                height:     "36px",
                padding:    "0 16px",
                border:     "none",
                background: "#EF4444",
                color:      "#FFFFFF",
                fontSize:   "0.84rem",
                fontWeight: 650,
                fontFamily: "inherit",
                cursor:     "pointer",
              }}
            >
              ▶  Watch Now
            </button>
          </div>
        ) : (
          <div style={{ padding: "8px 0 4px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.92rem", margin: "0 0 6px", lineHeight: 1.5 }}>
              Live programming coming soon.
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>
              TechXchange TV will broadcast keynotes, community sessions, and live event coverage during the event.
            </p>
          </div>
        )}

        {upcomingPrograms.length > 0 && (
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 10px" }}>
              Up next
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {upcomingPrograms.map((prog, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ color: "var(--soft)", fontSize: "0.88rem" }}>{prog.title}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "var(--font-mono, ui-monospace)", flexShrink: 0 }}>{prog.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
