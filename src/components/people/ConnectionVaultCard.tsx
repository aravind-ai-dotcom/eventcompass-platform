"use client";

import { useState } from "react";
import { CONNECTION_BADGE_LABELS } from "@/lib/connectionBadges";
import {
  downloadConnectionVCard,
  formatConnectionDateAdded,
} from "@/lib/connectionVault";
import {
  SAVE_REASON_LABELS,
  type ConnectionVaultRecord,
} from "@/types/connectionVault";

interface ConnectionVaultCardProps {
  record: ConnectionVaultRecord;
  onViewProfile?: (personId: string) => void;
  onRemove?: (personId: string) => void;
  onUpdateNote?: (personId: string, notes: string) => void;
}

function PersonAvatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div className="connection-card-avatar" aria-hidden="true">
      {initial}
    </div>
  );
}

export default function ConnectionVaultCard({
  record,
  onViewProfile,
  onRemove,
  onUpdateNote,
}: ConnectionVaultCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [draftNote, setDraftNote] = useState(record.notes);
  const [editingNote, setEditingNote] = useState(false);

  const addedLabel = formatConnectionDateAdded(record.dateAdded);
  const contextParts = [
    record.sharedInterests.length > 0 ? record.sharedInterests.join(", ") : null,
    record.sharedCommunities.length > 0 ? record.sharedCommunities.join(", ") : null,
    record.sharedCertifications.length > 0 ? record.sharedCertifications.join(", ") : null,
  ].filter(Boolean);

  function handleSaveNote() {
    onUpdateNote?.(record.personId, draftNote);
    setEditingNote(false);
    if (draftNote.trim()) setNotesOpen(true);
  }

  return (
    <article className="connection-card">
      <div className="connection-card-head">
        <PersonAvatar name={record.displayName} />
        <div className="connection-card-copy">
          <h3 className="connection-card-name">{record.displayName}</h3>
          {record.title && <p className="connection-card-role">{record.title}</p>}
          {record.organization && (
            <p className="connection-card-org">{record.organization}</p>
          )}
        </div>
      </div>

      <div className="connection-card-reason">
        <p className="connection-card-reason-kicker">Saved for:</p>
        <p className="connection-card-reason-text">{SAVE_REASON_LABELS[record.saveReason]}</p>
      </div>

      {contextParts.length > 0 && (
        <p className="connection-card-reason-text">{contextParts.join(" · ")}</p>
      )}

      {record.badges.length > 0 && (
        <div className="connection-badge-row">
          {record.badges.map(id => (
            <span key={id} className={`connection-badge connection-badge--${id}`}>
              {CONNECTION_BADGE_LABELS[id]}
            </span>
          ))}
        </div>
      )}

      {record.mutual && (
        <p className="connection-card-mutual">Mutual interest — good moment to connect</p>
      )}

      {addedLabel && (
        <p className="connection-card-reason-text" style={{ margin: 0, fontSize: "0.8125rem" }}>
          Added {addedLabel}
        </p>
      )}

      {(record.notes || notesOpen) && (
        <div className={`connection-vault-card__notes${notesOpen ? " connection-vault-card__notes--open" : ""}`}>
          <button
            type="button"
            className="connection-vault-card__notes-toggle"
            onClick={() => setNotesOpen(v => !v)}
            aria-expanded={notesOpen}
          >
            Notes{record.notes && !notesOpen ? " · tap to expand" : ""}
          </button>
          {notesOpen && !editingNote && record.notes && (
            <p className="connection-vault-card__notes-text">{record.notes}</p>
          )}
        </div>
      )}

      {editingNote && (
        <div className="connection-vault-card__note-editor">
          <textarea
            className="connection-vault-card__note-input"
            value={draftNote}
            onChange={e => setDraftNote(e.target.value)}
            placeholder="Met after AI Governance session. Interested in certification mentoring."
            rows={3}
            maxLength={500}
          />
          <div className="connection-vault-card__note-editor-actions">
            <button
              type="button"
              className="connection-card-action"
              onClick={() => {
                setDraftNote(record.notes);
                setEditingNote(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="connection-card-action connection-card-action--active"
              onClick={handleSaveNote}
            >
              Save note
            </button>
          </div>
        </div>
      )}

      <div className="connection-card-actions">
        {record.linkedinUrl && (
          <a
            href={record.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="connection-card-action"
          >
            LinkedIn
          </a>
        )}
        <button
          type="button"
          className="connection-card-action"
          onClick={() => downloadConnectionVCard(record)}
        >
          vCard
        </button>
        {onUpdateNote && (
          <button
            type="button"
            className="connection-card-action"
            onClick={() => {
              setEditingNote(true);
              setNotesOpen(true);
            }}
          >
            Add note
          </button>
        )}
        {onViewProfile && (
          <button
            type="button"
            className="connection-card-action"
            onClick={() => onViewProfile(record.personId)}
          >
            Details
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            className="connection-card-action connection-card-action--muted"
            onClick={() => onRemove(record.personId)}
          >
            Remove
          </button>
        )}
      </div>
    </article>
  );
}
