"use client";

import {
  HUDDLE_MODE_COPY,
  huddleDevSourceLabel,
  type HuddleDisplayMode,
  type HuddleFetchDiagnostic,
} from "@/lib/huddleDataSource";

interface HuddleModeIndicatorProps {
  displayMode: HuddleDisplayMode;
  fetchDiagnostic: HuddleFetchDiagnostic;
}

export default function HuddleModeIndicator({
  displayMode,
  fetchDiagnostic,
}: HuddleModeIndicatorProps) {
  const copy = HUDDLE_MODE_COPY[displayMode];
  const showDevLine = process.env.NODE_ENV === "development";

  return (
    <div className="huddle-mode-indicator">
      <span
        className={`huddle-mode-indicator__pill huddle-mode-indicator__pill--${displayMode}`}
        title={copy.hint}
      >
        {copy.label}
      </span>
      {showDevLine && (
        <span className="huddle-mode-indicator__dev" aria-hidden="true">
          source: {huddleDevSourceLabel(displayMode, fetchDiagnostic)}
        </span>
      )}
    </div>
  );
}
