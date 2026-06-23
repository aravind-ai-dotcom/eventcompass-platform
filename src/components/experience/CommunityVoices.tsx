// =============================================================================
// EventCompass — Community Voices
// src/components/experience/CommunityVoices.tsx
// =============================================================================

"use client";

import Image from "next/image";
import { useState } from "react";
import CompassModuleHead from "@/components/experience/CompassModuleHead";
import { FORGE_EVENT, FORGE_LABELS } from "@/config/forgeBrand";

type Champion = {
  id: string;
  display_name?: string;
  title?: string;
  job_title?: string;
  organization?: string;
  company?: string;
  photo_url?: string;
  quote?: string;
  bio?: string;
  topics?: string[];
  linkedin_url?: string;
  featured?: boolean;
  homepage_priority?: number;
  profile?: {
    domains?: string[];
    products?: string[];
  };
  consent?: {
    featured_champion?: boolean;
    show_photo?: boolean;
  };
};

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ChampionAvatar({ champion, size = 64 }: { champion: Champion; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const name = champion.display_name ?? FORGE_LABELS.guide;
  const initial = name.charAt(0).toUpperCase();

  if (champion.photo_url && !imgError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          border: "2px solid var(--accent)",
          background: "var(--surface)",
        }}
      >
        <Image
          src={champion.photo_url}
          alt={name}
          width={size}
          height={size}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="avatar-fallback"
      style={{ width: size, height: size, fontSize: `${size * 0.4}px`, flexShrink: 0 }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function ChampionVoiceCard({ champion }: { champion: Champion }) {
  const name = champion.display_name ?? `Featured ${FORGE_LABELS.guide}`;
  const org = champion.organization ?? champion.company ?? "";
  const title = champion.title ?? champion.job_title ?? "";
  const topics = champion.topics ?? champion.profile?.domains ?? [];
  const message = champion.quote ?? champion.bio ?? "";

  return (
    <article
      style={{
        border: "1px solid var(--line)",
        background: "var(--panel)",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <ChampionAvatar champion={champion} size={56} />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 2px",
              fontWeight: 620,
              fontSize: "1rem",
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.4 }}>
            {[title, org].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {message && (
        <blockquote
          style={{
            margin: 0,
            padding: "12px 14px",
            borderLeft: "3px solid var(--accent)",
            color: "var(--soft)",
            fontSize: "0.92rem",
            lineHeight: 1.55,
            fontStyle: "italic",
          }}
        >
          “{message}”
        </blockquote>
      )}

      {topics.length > 0 && (
        <div className="chip-row" style={{ marginTop: 0 }}>
          {topics.map((t) => (
            <span key={t} className="chip" style={{ fontSize: "0.76rem" }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "auto" }}>
        {champion.linkedin_url && (
          <a
            href={champion.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Connect with ${name} on LinkedIn`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              height: "30px",
              padding: "0 10px",
              border: "1px solid #0A66C2",
              color: "#0A66C2",
              fontSize: "0.78rem",
              fontWeight: 650,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <LinkedInIcon /> LinkedIn
          </a>
        )}

        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "30px",
            padding: "0 10px",
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: "0.78rem",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Save contact
        </button>
      </div>
    </article>
  );
}

interface Props {
  champions: Champion[];
  maxVisible?: number;
}

export default function CommunityVoices({ champions, maxVisible = 6 }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!champions || champions.length === 0) return null;

  const visible = showAll ? champions : champions.slice(0, maxVisible);

  return (
    <section>
      <CompassModuleHead
        kicker={`${FORGE_LABELS.communities} voices`}
        title={`${FORGE_LABELS.guides} who make ${FORGE_EVENT.name} extraordinary.`}
        description={`${FORGE_LABELS.guides} who have opted in to connect with attendees throughout the event.`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {visible.map((c) => (
          <ChampionVoiceCard key={c.id} champion={c} />
        ))}
      </div>

      {!showAll && champions.length > maxVisible && (
        <button type="button" onClick={() => setShowAll(true)} className="btn-secondary" style={{ marginTop: "16px", fontSize: "0.88rem" }}>
          Show all {champions.length} {FORGE_LABELS.guides.toLowerCase()}
        </button>
      )}
    </section>
  );
}