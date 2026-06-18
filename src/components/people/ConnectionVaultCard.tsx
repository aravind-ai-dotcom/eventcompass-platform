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

  function handleSaveNote() {
    onUpdateNote?.(record.personId, draftNote);
    setEditingNote(false);
    if (draftNote.trim()) setNotesOpen(true);
  }

  return (
    <article className="connection-vault-card">
      <header className="connection-vault-card__head">
        <div className="connection-vault-card__identity">
          <h3 className="connection-vault-card__name">{record.displayName}</h3>
          {record.title && <p className="connection-vault-card__role">{record.title}</p>}
          {record.organization && (
            <p className="connection-vault-card__org">{record.organization}</p>
          )}
        </div>
        {record.badges.length > 0 && (
          <div className="connection-badge-row">
            {record.badges.map(id => (
              <span key={id} className={`connection-badge connection-badge--${id}`}>
                {CONNECTION_BADGE_LABELS[id]}
              </span>
            ))}
          </div>
        )}
      </header>

      <dl className="connection-vault-card__meta">
        <div className="connection-vault-card__meta-row">
          <dt>Saved For:</dt>
          <dd>{SAVE_REASON_LABELS[record.saveReason]}</dd>
        </div>
        {record.sharedInterests.length > 0 && (
          <div className="connection-vault-card__meta-row">
            <dt>Shared Interests:</dt>
            <dd>{record.sharedInterests.join(", ")}</dd>
          </div>
        )}
        {record.sharedCommunities.length > 0 && (
          <div className="connection-vault-card__meta-row">
            <dt>Shared Communities:</dt>
            <dd>{record.sharedCommunities.join(", ")}</dd>
          </div>
        )}
        {record.sharedCertifications.length > 0 && (
          <div className="connection-vault-card__meta-row">
            <dt>Shared Certifications:</dt>
            <dd>{record.sharedCertifications.join(", ")}</dd>
          </div>
        )}
        {addedLabel && (
          <div className="connection-vault-card__meta-row">
            <dt>Added:</dt>
            <dd>{addedLabel}</dd>
          </div>
        )}
      </dl>

      {record.mutual && (
        <p className="connection-card-mutual">Mutual interest — good moment to connect</p>
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
              className="connection-vault-action"
              onClick={() => {
                setDraftNote(record.notes);
                setEditingNote(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="connection-vault-action connection-vault-action--primary"
              onClick={handleSaveNote}
            >
              Save note
            </button>
          </div>
        </div>
      )}

      <div className="connection-vault-card__actions">
        {record.linkedinUrl && (
          <a
            href={record.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="connection-vault-action"
          >
            LinkedIn
          </a>
        )}
        <button
          type="button"
          className="connection-vault-action"
          onClick={() => downloadConnectionVCard(record)}
        >
          Download vCard
        </button>
        {onUpdateNote && (
          <button
            type="button"
            className="connection-vault-action"
            onClick={() => {
              setEditingNote(true);
              setNotesOpen(true);
            }}
          >
            Add Note
          </button>
        )}
        {onViewProfile && (
          <button
            type="button"
            className="connection-vault-action"
            onClick={() => onViewProfile(record.personId)}
          >
            View Profile
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            className="connection-vault-action connection-vault-action--muted"
            onClick={() => onRemove(record.personId)}
          >
            Remove
          </button>
        )}
      </div>
    </article>
  );
}
