"use client";

import type { CompassSectionId } from "@/lib/compassUiPreferences";
import { COMPASS_SECTION_LABELS } from "@/lib/compassUiPreferences";

interface CompassSectionProps {
  id: CompassSectionId;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function CompassSection({
  id,
  expanded,
  onToggle,
  children,
}: CompassSectionProps) {
  const label = COMPASS_SECTION_LABELS[id];

  return (
    <section className="compass-section" data-section={id}>
      <button
        type="button"
        className="compass-section-header"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`compass-section-${id}`}
      >
        <span className="compass-section-chevron" aria-hidden="true">
          {expanded ? "▼" : "▶"}
        </span>
        <span className="compass-section-title">{label}</span>
      </button>

      {expanded ? (
        <div
          id={`compass-section-${id}`}
          className="compass-section-body"
        >
          {children}
        </div>
      ) : (
        <div className="compass-section-divider" role="presentation" />
      )}
    </section>
  );
}
