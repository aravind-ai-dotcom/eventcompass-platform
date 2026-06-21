"use client";

import { useEffect, useState } from "react";
import {
  FOCUS_CUSTOMIZE_GROUPS,
  type FocusCompassBlockId,
  type FocusCompassUiPreferences,
} from "@/lib/focusCompassUiPreferences";

interface FocusCustomizePanelProps {
  open: boolean;
  prefs: FocusCompassUiPreferences;
  showCertifications?: boolean;
  onClose: () => void;
  onBlockChange: (blockId: FocusCompassBlockId, visible: boolean) => void;
}

export default function FocusCustomizePanel({
  open,
  prefs,
  showCertifications = true,
  onClose,
  onBlockChange,
}: FocusCustomizePanelProps) {
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!open) setSavedNotice(false);
  }, [open]);

  if (!open) return null;

  function handleChange(blockId: FocusCompassBlockId, visible: boolean) {
    onBlockChange(blockId, visible);
    setSavedNotice(true);
  }

  function handleSaveAndClose() {
    setSavedNotice(true);
    onClose();
  }

  return (
    <div className="compass-customize-backdrop" role="presentation" onClick={handleSaveAndClose}>
      <div
        className="compass-customize-panel focus-customize-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-customize-title"
        onClick={e => e.stopPropagation()}
      >
        <header className="compass-customize-head">
          <h2 id="focus-customize-title">Customize My Compass</h2>
          <p>Choose which sections appear in Focus mode. Ask Compass is always on — nothing else is deleted, only hidden.</p>
        </header>

        <div className="focus-customize-groups">
          {FOCUS_CUSTOMIZE_GROUPS.filter(
            group => showCertifications || group.id !== "certifications",
          ).map((group, groupIndex) => (
            <div key={group.id} className="focus-customize-group">
              {groupIndex > 0 && <div className="focus-customize-divider" role="separator" />}
              <p className="focus-customize-group__label">{group.label}</p>
              <ul className="compass-customize-list">
                {group.blocks.map(block => (
                  <li key={block.id}>
                    <label className="compass-customize-item">
                      <input
                        type="checkbox"
                        checked={prefs.blocks[block.id]}
                        onChange={e => handleChange(block.id, e.target.checked)}
                      />
                      <span>{block.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

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
