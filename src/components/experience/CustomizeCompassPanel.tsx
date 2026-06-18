"use client";

import {
  COMPASS_MODULE_IDS,
  COMPASS_MODULE_LABELS,
  type CompassModuleId,
  type CompassUiPreferences,
} from "@/lib/compassUiPreferences";

interface CustomizeCompassPanelProps {
  open: boolean;
  prefs: CompassUiPreferences;
  onClose: () => void;
  onModuleChange: (moduleId: CompassModuleId, visible: boolean) => void;
}

export default function CustomizeCompassPanel({
  open,
  prefs,
  onClose,
  onModuleChange,
}: CustomizeCompassPanelProps) {
  if (!open) return null;

  return (
    <div className="compass-customize-backdrop" role="presentation" onClick={onClose}>
      <div
        className="compass-customize-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compass-customize-title"
        onClick={e => e.stopPropagation()}
      >
        <header className="compass-customize-head">
          <h2 id="compass-customize-title">Customize My Compass</h2>
          <p>Choose which modules appear. Nothing is deleted — only hidden.</p>
          <button type="button" className="compass-customize-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <ul className="compass-customize-list">
          {COMPASS_MODULE_IDS.map(moduleId => (
            <li key={moduleId}>
              <label className="compass-customize-item">
                <input
                  type="checkbox"
                  checked={prefs.modules[moduleId]}
                  onChange={e => onModuleChange(moduleId, e.target.checked)}
                />
                <span>{COMPASS_MODULE_LABELS[moduleId]}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
