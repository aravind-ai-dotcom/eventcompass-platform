// =============================================================================
// EventCompass — Event banner (FORGE 2027)
// src/components/experience/TechXchangeBanner.tsx
//
// Bridge back to the main FORGE experience.
// External links are optional — set NEXT_PUBLIC_FORGE_* env vars to show them.
// =============================================================================

import { FORGE_EVENT, FORGE_EXTERNAL_LINKS } from "@/config/forgeBrand";

export interface BannerLinks {
  website?:  string;
  keynotes?: string;
  agenda?:   string;
}

interface Props {
  links?: BannerLinks;
}

function resolveLinks(overrides?: BannerLinks): BannerLinks {
  const merged = {
    website: overrides?.website ?? FORGE_EXTERNAL_LINKS.website,
    keynotes: overrides?.keynotes ?? FORGE_EXTERNAL_LINKS.keynotes,
    agenda: overrides?.agenda ?? FORGE_EXTERNAL_LINKS.agenda,
  };
  return Object.fromEntries(
    Object.entries(merged).filter(([, url]) => typeof url === "string" && url.length > 0),
  ) as BannerLinks;
}

export default function TechXchangeBanner({ links }: Props) {
  const activeLinks = resolveLinks(links);
  const hasLinks = Boolean(activeLinks.website || activeLinks.keynotes || activeLinks.agenda);

  return (
    <div
      style={{
        background:  "var(--panel)",
        border:      "1px solid var(--line)",
        padding:     "20px 24px",
        display:     "grid",
        gridTemplateColumns: hasLinks ? "minmax(0,1fr) auto" : "1fr",
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

      {hasLinks && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {activeLinks.website && (
            <a href={activeLinks.website} target="_blank" rel="noopener noreferrer" className="btn-secondary"
              style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
              Event website ↗
            </a>
          )}
          {activeLinks.keynotes && (
            <a href={activeLinks.keynotes} target="_blank" rel="noopener noreferrer" className="btn-secondary"
              style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
              Keynotes
            </a>
          )}
          {activeLinks.agenda && (
            <a href={activeLinks.agenda} target="_blank" rel="noopener noreferrer" className="btn-secondary"
              style={{ fontSize: "0.82rem", minHeight: "34px", padding: "0 12px", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
              Full agenda
            </a>
          )}
        </div>
      )}
    </div>
  );
}
