"use client";

import type { PlanConflictMode } from "@/lib/experienceDayPlan";

const MODES: Array<{
  id: PlanConflictMode;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  {
    id: "best-fit",
    label: "Best fit",
    hint: "One session per time slot — highest Compass match wins when times overlap.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.35" />
      </svg>
    ),
  },
  {
    id: "show-both",
    label: "Show with all conflicts",
    hint: "Show every overlapping session so you can decide — no slot filtering.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="5" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.35" />
        <rect x="9" y="3" width="5" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.35" />
      </svg>
    ),
  },
];

interface PlanModeSelectorProps {
  value: PlanConflictMode;
  onChange: (mode: PlanConflictMode) => void;
  /** Limit to first N modes (Focus mode uses 2). */
  limit?: number;
  className?: string;
}

export default function PlanModeSelector({
  value,
  onChange,
  limit = 2,
  className = "",
}: PlanModeSelectorProps) {
  const modes = MODES.slice(0, limit);

  return (
    <div className={`plan-mode-row plan-mode-row--premium${className ? ` ${className}` : ""}`} role="group" aria-label="Schedule conflict handling">
      {modes.map(mode => (
        <button
          key={mode.id}
          type="button"
          className={`plan-mode-chip plan-mode-chip--premium${value === mode.id ? " is-active" : ""}`}
          aria-pressed={value === mode.id}
          title={mode.hint}
          onClick={() => onChange(mode.id)}
        >
          <span className="plan-mode-chip__icon">{mode.icon}</span>
          <span className="plan-mode-chip__copy">
            <span className="plan-mode-chip__label">{mode.label}</span>
            <span className="plan-mode-chip__hint">{mode.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
