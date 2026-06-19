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
        <span
          className={`compass-section-chevron${expanded ? " compass-section-chevron--open" : ""}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4.5 10 8l-4 3.5"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
