"use client";

import { useEffect, useState } from "react";
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
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!open) setSavedNotice(false);
  }, [open]);

  if (!open) return null;

  function handleModuleChange(moduleId: CompassModuleId, visible: boolean) {
    onModuleChange(moduleId, visible);
    setSavedNotice(true);
  }

  function handleSaveAndClose() {
    setSavedNotice(true);
    onClose();
  }

  return (
    <div className="compass-customize-backdrop" role="presentation" onClick={handleSaveAndClose}>
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
        </header>

        <ul className="compass-customize-list">
          {COMPASS_MODULE_IDS.map(moduleId => (
            <li key={moduleId}>
              <label className="compass-customize-item">
                <input
                  type="checkbox"
                  checked={prefs.modules[moduleId]}
                  onChange={e => handleModuleChange(moduleId, e.target.checked)}
                />
                <span>{COMPASS_MODULE_LABELS[moduleId]}</span>
              </label>
            </li>
          ))}
        </ul>

        <footer className="compass-customize-foot">
          {savedNotice && (
            <p className="compass-customize-saved" role="status" aria-live="polite">
              Preferences saved
            </p>
          )}
          <button type="button" className="compass-customize-save" onClick={handleSaveAndClose}>
            Save preferences
          </button>
        </footer>
      </div>
    </div>
  );
}
