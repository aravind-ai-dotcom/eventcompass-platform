// =============================================================================
// EventCompass — Network Signal Block
// src/components/experience/NetworkSignalBlock.tsx
// Reusable aggregate teaser for Pulse + Home. No PII — aggregate only.
// =============================================================================

import type { NetworkPulseSummary } from "@/services/networkSignalService";

interface Props {
  summary: NetworkPulseSummary;
  compact?: boolean;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center", marginBottom: "7px" }}>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: "0.84rem", color: "var(--soft)" }}>{label}</p>
        <div style={{ height: "5px", background: "var(--line)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${w}%`, background: color, transition: "width 0.5s ease-out" }} />
        </div>
      </div>
      <span style={{ fontFamily: "var(--font-mono,ui-monospace)", fontSize: "0.78rem", color: "var(--muted)", minWidth: "24px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function NetworkSignalBlock({ summary, compact = false }: Props) {
  const hasSignal = summary.topUniversities.length > 0 || summary.topPastEmployers.length > 0 || summary.topCareerInterests.length > 0;
  const maxUniv   = summary.topUniversities[0]?.[1]    ?? 1;
  const maxEmp    = summary.topPastEmployers[0]?.[1]   ?? 1;
  const maxCI     = summary.topCareerInterests[0]?.[1] ?? 1;

  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--line)",
      borderTop: "3px solid #6D28D9", padding: compact ? "16px 18px" : "20px 22px",
    }}>
      <p style={{ color: "#6D28D9", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
        Where relationships are forming
      </p>
      <p style={{ color: "var(--text)", fontSize: compact ? "0.92rem" : "1rem", fontWeight: 600, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
        Find your hidden network.
      </p>

      {/* Open-to counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "Alumni",     val: summary.openToAlumni,     color: "#6D28D9" },
          { label: "Colleagues", val: summary.openToColleagues, color: "#2563EB" },
          { label: "Career",     val: summary.openToCareer,     color: "#0D9488" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", border: "1px solid var(--line)", background: "var(--surface, var(--panel))" }}>
            <p style={{ margin: "0 0 2px", fontSize: "1.3rem", fontWeight: 520, color: s.color, lineHeight: 1 }}>{s.val}</p>
            <p style={{ margin: 0, fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {hasSignal && !compact && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "20px", marginBottom: "14px" }}>
          {summary.topUniversities.length > 0 && (
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>Universities</p>
              {summary.topUniversities.slice(0, 4).map(([name, count]) => (
                <Bar key={name} label={name} value={count} max={maxUniv} color="#6D28D9" />
              ))}
            </div>
          )}
          {summary.topPastEmployers.length > 0 && (
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>Past employers</p>
              {summary.topPastEmployers.slice(0, 4).map(([name, count]) => (
                <Bar key={name} label={name} value={count} max={maxEmp} color="#2563EB" />
              ))}
            </div>
          )}
          {summary.topCareerInterests.length > 0 && (
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.68rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>Career interests</p>
              {summary.topCareerInterests.slice(0, 4).map(([name, count]) => (
                <Bar key={name} label={name} value={count} max={maxCI} color="#0D9488" />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: compact ? "0" : "4px" }}>
        <a href="/profile" style={{ color: "var(--accent)", fontSize: "0.82rem", fontWeight: 650, textDecoration: "none" }}>
          Add your network signal →
        </a>
      </div>
    </div>
  );
}
