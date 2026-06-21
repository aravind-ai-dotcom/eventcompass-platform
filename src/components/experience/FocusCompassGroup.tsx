"use client";

import { useEffect, useRef, type ReactNode } from "react";
import CompassPanelIcon, { type CompassPanelIconName } from "@/components/experience/CompassPanelIcon";
import type { FocusCompassGroupId } from "@/lib/focusCompassPreferences";
import { scrollIntoViewWithHeaderOffset } from "@/lib/scrollIntoViewWithHeaderOffset";

interface FocusCompassGroupProps {
  id: FocusCompassGroupId;
  icon: CompassPanelIconName;
  label: string;
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Focus Mode — collapsible grouped section with Carbon-style icon rail. */
export default function FocusCompassGroup({
  id,
  icon,
  label,
  title,
  description,
  expanded,
  onToggle,
  children,
}: FocusCompassGroupProps) {
  const headerRef = useRef<HTMLButtonElement>(null);
  const prevExpanded = useRef(expanded);

  useEffect(() => {
    if (expanded && !prevExpanded.current) {
      scrollIntoViewWithHeaderOffset(headerRef.current);
    }
    prevExpanded.current = expanded;
  }, [expanded]);

  return (
    <section
      className={`focus-compass-group${expanded ? " focus-compass-group--expanded" : ""}`}
      data-focus-group={id}
    >
      <button
        ref={headerRef}
        type="button"
        className="focus-compass-group__header"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`focus-group-body-${id}`}
        id={`focus-group-${id}`}
      >
        <span
          className={`focus-compass-group__chevron${expanded ? " focus-compass-group__chevron--open" : ""}`}
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
        <span className="focus-compass-group__icon" aria-hidden="true">
          <CompassPanelIcon name={icon} />
        </span>
        <span className="focus-compass-group__copy">
          <span className="focus-compass-group__label">{label}</span>
          <span className="focus-compass-group__title">{title}</span>
          {description && expanded && (
            <span className="focus-compass-group__desc">{description}</span>
          )}
        </span>
      </button>

      {expanded ? (
        <div id={`focus-group-body-${id}`} className="focus-compass-group__body">
          {children}
        </div>
      ) : (
        <div className="focus-compass-group__divider" role="presentation" />
      )}
    </section>
  );
}
