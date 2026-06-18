"use client";

import { useEffect, useMemo, useState } from "react";
import type { CertificationJourneyRecord } from "@/types/certificationSession";
import { listCertificationJourneys } from "@/lib/certificationProfile";
import { shortenCertificationTitle } from "@/lib/certificationJourneyIntelligence";

interface AddCertificationModalProps {
  open: boolean;
  savedCertIds: string[];
  onClose: () => void;
  onAdd: (cert: CertificationJourneyRecord) => void;
}

export default function AddCertificationModal({
  open,
  savedCertIds,
  onClose,
  onAdd,
}: AddCertificationModalProps) {
  const [query, setQuery] = useState("");
  const catalog = useMemo(() => listCertificationJourneys(), []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(c =>
      [c.title, c.certification_code, c.track, ...c.topics, ...c.products]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [catalog, query]);

  if (!open) return null;

  return (
    <div className="cert-add-modal" role="dialog" aria-modal="true" aria-labelledby="cert-add-title">
      <button type="button" className="cert-add-modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="cert-add-modal__panel">
        <header className="cert-add-modal__head">
          <div>
            <p className="cert-add-modal__kicker">Certification catalog</p>
            <h2 id="cert-add-title">Add a certification</h2>
            <p className="cert-add-modal__lead">
              Choose a learning path to track. Compass will match sessions, labs, experts, and community
              from the event catalog — not a fixed list.
            </p>
          </div>
          <button type="button" className="cert-add-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="cert-add-modal__search">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, code, track, or topic…"
            aria-label="Search certifications"
          />
        </div>

        <ul className="cert-add-modal__list">
          {filtered.map(cert => {
            const saved = savedCertIds.includes(cert.certification_id);
            return (
              <li key={cert.certification_id} className="cert-add-modal__item">
                <div className="cert-add-modal__item-body">
                  <p className="cert-add-modal__code">{cert.certification_code}</p>
                  <h3>{shortenCertificationTitle(cert.title)}</h3>
                  <p className="cert-add-modal__meta">
                    {[cert.track, cert.certification_level, cert.difficulty]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="cert-add-modal__desc">{cert.description}</p>
                  {cert.topics.length > 0 && (
                    <div className="cert-add-modal__chips">
                      {cert.topics.slice(0, 4).map(t => (
                        <span key={t} className="cert-add-modal__chip">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cert-add-modal__item-actions">
                  {saved ? (
                    <span className="cert-add-modal__saved">Tracking</span>
                  ) : (
                    <button
                      type="button"
                      className="cert-panel__btn cert-panel__btn--primary"
                      onClick={() => onAdd(cert)}
                    >
                      Add to My Goals
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
