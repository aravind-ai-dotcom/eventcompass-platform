"use client";

import { useEffect, useMemo, useState } from "react";
import type { TxCertification } from "@/data/certifications";
import { MAX_CERTIFICATION_ENROLLMENTS } from "@/data/certifications";

interface CertificationPickerModalProps {
  open: boolean;
  catalog: TxCertification[];
  enrolledIds: string[];
  onClose: () => void;
  onAdd: (certificationId: string) => void;
}

export default function CertificationPickerModal({
  open,
  catalog,
  enrolledIds,
  onClose,
  onAdd,
}: CertificationPickerModalProps) {
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTrackFilter("all");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const tracks = useMemo(() => {
    const set = new Set<string>();
    for (const cert of catalog) {
      for (const track of cert.txc_tracks) set.add(track);
    }
    return [...set].sort();
  }, [catalog]);

  const atLimit = enrolledIds.length >= MAX_CERTIFICATION_ENROLLMENTS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(cert => {
      if (!cert.is_active) return false;
      if (trackFilter !== "all" && !cert.txc_tracks.includes(trackFilter)) return false;
      if (!q) return true;
      const blob = [
        cert.title,
        cert.product,
        cert.level,
        cert.exam_code,
        ...cert.txc_tracks,
        ...cert.skill_tags,
      ].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [catalog, query, trackFilter]);

  if (!open) return null;

  return (
    <div className="cert-add-modal cert-picker-modal" role="dialog" aria-modal="true" aria-labelledby="cert-picker-title">
      <button type="button" className="cert-add-modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="cert-add-modal__panel">
        <header className="cert-add-modal__head">
          <div>
            <p className="cert-add-modal__kicker">Certification catalog</p>
            <h2 id="cert-picker-title">Add certification</h2>
            <p className="cert-add-modal__lead">
              You can add up to {MAX_CERTIFICATION_ENROLLMENTS} certifications. Compass will shape your week around them.
            </p>
          </div>
          <button type="button" className="cert-add-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="cert-picker-modal__filters">
          <div className="cert-add-modal__search">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by product, track, or title…"
              aria-label="Search certifications"
            />
          </div>
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            aria-label="Filter by track"
            className="cert-picker-modal__track-select"
          >
            <option value="all">All tracks</option>
            {tracks.map(track => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
        </div>

        {atLimit && (
          <p className="cert-picker-modal__limit" role="status">
            You can add up to {MAX_CERTIFICATION_ENROLLMENTS} certifications.
          </p>
        )}

        <ul className="cert-add-modal__list">
          {filtered.map(cert => {
            const enrolled = enrolledIds.includes(cert.certification_id);
            const disabled = enrolled || atLimit;
            return (
              <li key={cert.certification_id} className="cert-add-modal__item">
                <div className="cert-add-modal__item-body">
                  <p className="cert-add-modal__code">{cert.exam_code}</p>
                  <h3>{cert.title}</h3>
                  <p className="cert-add-modal__meta">
                    {[cert.product, cert.level].filter(Boolean).join(" · ")}
                  </p>
                  <p className="cert-add-modal__desc">{cert.description}</p>
                  {cert.skill_tags.length > 0 && (
                    <div className="cert-add-modal__chips">
                      {cert.skill_tags.slice(0, 4).map(tag => (
                        <span key={tag} className="cert-add-modal__chip">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cert-add-modal__item-actions">
                  {enrolled ? (
                    <span className="cert-add-modal__saved">Added</span>
                  ) : (
                    <button
                      type="button"
                      className="action-chip"
                      disabled={disabled}
                      onClick={() => onAdd(cert.certification_id)}
                    >
                      Add
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="cert-add-modal__empty">No certifications match your search.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
