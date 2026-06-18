"use client";

import { useEffect, useState } from "react";
import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import {
  SAVE_REASONS,
  SAVE_REASON_LABELS,
  type SaveReason,
} from "@/types/connectionVault";

interface SaveConnectionModalProps {
  person: RecommendedPerson;
  onConfirm: (reason: SaveReason) => void;
  onClose: () => void;
}

export default function SaveConnectionModal({
  person,
  onConfirm,
  onClose,
}: SaveConnectionModalProps) {
  const [selected, setSelected] = useState<SaveReason>("networking");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const org = person.organization ?? person.company ?? "";

  return (
    <div className="session-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="session-modal save-connection-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-connection-title"
      >
        <button type="button" className="session-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="section-kicker" style={{ marginBottom: "8px" }}>Save connection</p>
        <h2 id="save-connection-title">Why are you saving this connection?</h2>
        <p className="session-modal-meta">
          {[person.display_name, person.title, org].filter(Boolean).join(" · ")}
        </p>

        <fieldset className="save-connection-reasons">
          <legend className="sr-only">Reason for saving</legend>
          {SAVE_REASONS.map(reason => (
            <label key={reason} className="save-connection-reason">
              <input
                type="radio"
                name="save-reason"
                value={reason}
                checked={selected === reason}
                onChange={() => setSelected(reason)}
              />
              <span>{SAVE_REASON_LABELS[reason]}</span>
            </label>
          ))}
        </fieldset>

        <div className="save-connection-actions">
          <button type="button" className="connection-card-action" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="connection-card-action connection-card-action--active"
            onClick={() => onConfirm(selected)}
          >
            Save to My Connections
          </button>
        </div>
      </div>
    </div>
  );
}
