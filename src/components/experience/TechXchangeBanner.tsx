// =============================================================================
// EventCompass — TechXchange Banner
// src/components/experience/TechXchangeBanner.tsx
//
// Bridge back to the main FORGE experience.
// All links configurable via props — never hardcoded.
// =============================================================================

import { FORGE_EVENT } from "@/config/forgeBrand";

export interface BannerLinks {
  website?:  string;
  keynotes?: string;
  agenda?:   string;
}

interface Props {
  links?: BannerLinks;
}

const DEFAULT_LINKS: BannerLinks = {
  website:  "#",
  keynotes: "#",
  agenda:   "#",
};

export default function TechXchangeBanner({ links = DEFAULT_LINKS }: Props) {
  return (
    <div
      style={{
        background:  "var(--panel)",
        border:      "1px solid var(--line)",
        padding:     "20px 24px",
        display:     "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        gap:         "20px",
        alignItems:  "center",
      }}
    >
      <div>
        <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
          {FORGE_EVENT.name}
        </p>
        <p style={{ color: "var(--text)", fontSize: "1.1rem", fontWeight: 560, margin: "0 0 2px", letterSpacing: "-0.02em" }}>
          {FORGE_EVENT.city}
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, fontFamily: "var(--font-mono, ui-monospace)" }}>
          {FORGE_EVENT.dates}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {links.website && (
          <a href={links.website} target="_blank" rel="noopener noreferrer" className="btn-secondary"
            style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
            Event website ↗
          </a>
        )}
        {links.keynotes && (
          <a href={links.keynotes} target="_blank" rel="noopener noreferrer" className="btn-secondary"
            style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
            Keynotes
          </a>
        )}
        {links.agenda && (
          <a href={links.agenda} target="_blank" rel="noopener noreferrer" className="btn-secondary"
            style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
            Full agenda
          </a>
        )}
      </div>
    </div>
  );
}
