// =============================================================================
// EventCompass — Community Voices  (homepage section)
// src/components/experience/HomeCommunityVoices.tsx
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";
import { getFeaturedChampions } from "@/services/firestoreService";

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
  profile?: {
    domains?: string[];
    products?: string[];
  };
};

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ChampionAvatar({ champion }: { champion: Champion }) {
  const [imgError, setImgError] = useState(false);
  const name = champion.display_name ?? FORGE_LABELS.guide;
  const initial = name.charAt(0).toUpperCase();

  if (champion.photo_url && !imgError) {
    return (
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          border: "2.5px solid var(--accent)",
          background: "var(--surface)",
        }}
      >
        <Image
          src={champion.photo_url}
          alt={name}
          width={80}
          height={80}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          onError={() => setImgError(true)}
          priority
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        flexShrink: 0,
        border: "2.5px solid var(--accent)",
        background: "var(--panel)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.6rem",
        fontWeight: 600,
        color: "var(--accent)",
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function ChampionCard({ champion }: { champion: Champion }) {
  const name = champion.display_name ?? `Featured ${FORGE_LABELS.guide}`;
  const org = champion.organization ?? champion.company ?? "";
  const title = champion.title ?? champion.job_title ?? "";
  const topics = champion.topics ?? champion.profile?.domains ?? [];
  const quote = champion.quote ?? champion.bio ?? "";

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "32px 28px",
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <ChampionAvatar champion={champion} />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "1.08rem",
              fontWeight: 620,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {name}
          </p>
          {title && (
            <p style={{ margin: "0 0 2px", color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.35 }}>
              {title}
            </p>
          )}
          {org && <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem" }}>{org}</p>}
        </div>
      </div>

      {quote && (
        <blockquote
          style={{
            margin: 0,
            padding: "16px 18px",
            flex: 1,
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--soft)",
              fontSize: "0.95rem",
              lineHeight: 1.65,
              fontStyle: "italic",
            }}
          >
            “{quote}”
          </p>
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

      {champion.linkedin_url && (
        <div style={{ marginTop: "auto" }}>
          <a
            href={champion.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Connect with ${name} on LinkedIn`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "32px",
              padding: "0 12px",
              border: "1px solid #0A66C2",
              color: "#0A66C2",
              fontSize: "0.8rem",
              fontWeight: 650,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            <LinkedInIcon /> Connect on LinkedIn
          </a>
        </div>
      )}
    </article>
  );
}

export default function HomeCommunityVoices() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedChampions()
      .then((data) => setChampions(data as Champion[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || champions.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Community voices</div>
          <h2>The people who make {FORGE_EVENT.name} extraordinary.</h2>
        </div>
        <p>
          {FORGE_LABELS.guides} who have chosen to share their knowledge and connect with attendees throughout the event. Reach out — they are here for you.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {champions.map((c) => (
          <ChampionCard key={c.id} champion={c} />
        ))}
      </div>

      <p style={{ marginTop: "20px", color: "var(--muted)", fontSize: "0.88rem" }}>
        More {FORGE_LABELS.guide.toLowerCase()} connections are available inside{" "}
        <a href="/txc/experience" style={{ color: "var(--accent)" }}>
          {FORGE_PRODUCT.myJourney}
        </a>{" "}
        once your Compass is built.
      </p>
    </section>
  );
}