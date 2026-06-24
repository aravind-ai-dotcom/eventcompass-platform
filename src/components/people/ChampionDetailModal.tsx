"use client";

import { useEffect } from "react";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";
import { displayFirstName, personSkillDomainTags } from "@/lib/personCardHelpers";
import PersonMatchPanel from "@/components/people/PersonMatchPanel";

export interface ChampionDetail {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  geo?: string;
  country?: string;
  profile?: { domains?: string[]; products?: string[]; community_interests?: string[] };
  domains?: string[];
  linkedin_url?: string;
  consent?: { show_linkedin?: boolean };
  attendance?: { available_for_1x1?: boolean };
  compass_score?: number;
  compass_reasons?: string[];
}

interface ChampionDetailModalProps {
  champion: ChampionDetail;
  anonymous?: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  isSaved?: boolean;
  matchReasons?: string[];
  profileSignals?: string[];
  onToggleSave?: () => void;
  onRemove?: () => void;
}

function firstName(name: string): string {
  return displayFirstName(name);
}

export default function ChampionDetailModal({
  champion,
  anonymous = false,
  onClose,
  isLoggedIn = false,
  isSaved = false,
  matchReasons = [],
  profileSignals = [],
  onToggleSave,
  onRemove,
}: ChampionDetailModalProps) {
  const org = champion.organization ?? champion.company ?? "";
  const loc = champion.geo ?? champion.country ?? "";
  const skillTags = personSkillDomainTags(champion);
  const domains = [
    ...(champion.profile?.domains ?? []),
    ...(champion.domains ?? []),
  ].slice(0, 6);
  const shownName = anonymous ? firstName(champion.display_name) : champion.display_name;
  const visibleTags = anonymous ? skillTags : domains;
  const linkedIn = anonymous ? null : enrichLinkedInForPerson(champion);

  const personForIntel = {
    ...champion,
    compass_reasons: matchReasons.length > 0 ? matchReasons : champion.compass_reasons,
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="session-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="session-modal champion-detail-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="champion-detail-title"
      >
        <button type="button" className="session-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="section-kicker" style={{ marginBottom: "8px" }}>People intelligence</p>
        <h2 id="champion-detail-title">{shownName}</h2>
        {!anonymous && (champion.title || org) && (
          <p className="session-modal-meta">
            {[champion.title, org].filter(Boolean).join(" · ")}
          </p>
        )}
        {!anonymous && loc && (
          <p className="session-modal-meta">{loc}</p>
        )}
        {visibleTags.length > 0 && (
          <div className="champion-person-tags" style={{ marginTop: "12px" }}>
            {anonymous && (
              <p className="connection-card-skills-kicker" style={{ width: "100%", marginBottom: "8px" }}>
                Skills &amp; domains
              </p>
            )}
            {visibleTags.map(d => (
              <span key={d} className="champion-person-tag">{d}</span>
            ))}
          </div>
        )}
        {!anonymous && champion.attendance?.available_for_1x1 && (
          <p style={{ margin: "12px 0 0", fontSize: "0.82rem", color: "#0f62fe", fontWeight: 550 }}>
            Open to technical conversations
          </p>
        )}
        {!anonymous && (
          <div style={{ marginTop: "14px" }}>
            <PersonMatchPanel
              person={personForIntel}
              profileSignals={profileSignals}
            />
          </div>
        )}
        {!anonymous && linkedIn?.linkedinVisibility === "visible" && linkedIn.linkedin_url && (
          <a
            href={linkedIn.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-chip connection-card-linkedin"
            style={{ marginTop: "14px", display: "inline-flex" }}
          >
            View LinkedIn profile →
          </a>
        )}
        {!anonymous && linkedIn?.linkedinVisibility === "consent_blocked" && (
          <p className="connection-card-linkedin connection-card-linkedin--blocked" style={{ marginTop: "14px" }}>
            LinkedIn · not shared per their preferences
          </p>
        )}
        {anonymous && (
          <p style={{ margin: "14px 0 0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
            Sign in to see full profile details and save this person to your list.
          </p>
        )}
        {isLoggedIn && (onToggleSave || onRemove) && (
          <div className="champion-detail-modal-actions">
            {onToggleSave && (
              <button
                type="button"
                className={`action-chip${isSaved ? " action-chip--active" : ""}`}
                onClick={onToggleSave}
              >
                {isSaved ? "✓ Saved" : "+ Save"}
              </button>
            )}
            {onRemove && isSaved && (
              <button type="button" className="action-chip" onClick={onRemove}>
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
