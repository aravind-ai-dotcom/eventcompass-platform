"use client";
// FORGE participant pulse — preserved for /explore and admin references.
// SKO sellers use /pulse (SkoPulseView).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  countryFlag,
  top,
  topCommunities,
} from "@/lib/roomSignals";
import { loadPulseAudience, type PulseDataSource } from "@/lib/pulseDataLoader";
import type { PulseAudienceData } from "@/lib/pulseAudienceSeed";
import PulseDonutBox, {
  alumniDonutSegments,
  championDonutSegments,
  hasChampionCommunityMix,
} from "@/components/pulse/PulseDonutBox";
import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function NostalgiaBox({
  title,
  rows,
  total,
  renderLabel,
  withBars = false,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  renderLabel?: (name: string) => React.ReactNode;
  withBars?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <article className={`nostalgia-box${withBars ? " nostalgia-box--chart" : ""}`}>
      <h3 className="nostalgia-box-title">{title}</h3>
      <ul className="nostalgia-box-list">
        {rows.map(([name, count]) => {
          const percent = pct(count, total);
          const label = renderLabel ? renderLabel(name) : name;
          if (withBars) {
            return (
              <li key={name} className="nostalgia-item nostalgia-item--chart">
                <div className="nostalgia-item-head">
                  <span className="nostalgia-item-label">{label}</span>
                  <b className="nostalgia-item-pct">{percent}%</b>
                </div>
                <div className="nostalgia-bar-track" aria-hidden="true">
                  <div className="nostalgia-bar-fill" style={{ width: `${Math.max(percent, 4)}%` }} />
                </div>
              </li>
            );
          }
          return (
            <li key={name} className="nostalgia-item nostalgia-item--inline">
              <span>{label}</span>
              <b>{percent}%</b>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

const JOURNEY_LEAD = "Veterans and newcomers shaping the same week.";
const GUIDE_LEAD = "Expert voices already in the room.";

export default function TechXchangePulsePage() {
  const { user, enrolled } = useAuth();
  const [data, setData] = useState<PulseAudienceData | null>(null);
  const [source, setSource] = useState<PulseDataSource>("aggregated");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPulseAudience(!!user)
      .then(result => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const total = data?.audienceTotal ?? 0;
  const identity = data?.identity;

  const alumniSegments = identity
    ? alumniDonutSegments(identity.alumni.returning, identity.alumni.firstTime)
    : [];
  const showJourney = alumniSegments.length >= 2;

  const championSegments = identity
    ? championDonutSegments(
        identity.champion.ibm_champion,
        identity.champion.former_champion,
        identity.champion.interested,
        identity.champion.champion_nominee,
      )
    : [];
  const showChampionCommunity = identity
    ? hasChampionCommunityMix(
        identity.champion.ibm_champion,
        identity.champion.former_champion,
        identity.champion.interested,
        identity.champion.champion_nominee,
      )
    : false;

  const connectionItems = data
    ? [
        { label: "Open to alumni connections", val: data.openToAlumni, tone: "var(--accent)" },
        { label: "Open to colleague conversations", val: data.openToColleague, tone: "var(--accent-2)" },
        { label: "Open to career conversations", val: data.openToCareer, tone: "var(--accent-3)" },
        { label: "Open to mentoring", val: data.openToMentoring, tone: "var(--accent-4)" },
      ].filter(item => item.val > 0)
        .map(item => ({ ...item, pct: pct(item.val, total) }))
    : [];

  const showAggregatedDisclaimer = source === "aggregated";

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Event pulse</div>
        <h1>The room is taking shape.</h1>
        <p style={{ color: "var(--muted)", maxWidth: "640px", marginTop: "12px", lineHeight: 1.55 }}>
          A living read on who is arriving, what they care about, and the conversations waiting to begin.
        </p>
      </section>

      {loading && (
        <section className="section no-top-border">
          <p style={{ color: "var(--muted)" }}>Loading pulse…</p>
        </section>
      )}

      {!loading && data && (
        <>
          {showAggregatedDisclaimer && (
            <section className="section no-top-border pulse-disclaimer">
              <p className="pulse-disclaimer__copy">
                Directional audience trends from enrollment and stated intent. Aggregated only, never individual profiles.
                Sign in to add your signal and shape what Compass recommends for you.
              </p>
            </section>
          )}

          <section className="story-section">
            <span className="narrative-kicker">Audience snapshot</span>
            <p className="pulse-snapshot-lead">
              Intent, identity, and momentum in one view. See what people are building toward, where they come from, and who is returning to {FORGE_EVENT.name}.
            </p>
            <div className="nostalgia-grid nostalgia-grid--pulse">
              {showJourney && (
                <PulseDonutBox
                  title={`${FORGE_EVENT.name} Journey`}
                  lead={JOURNEY_LEAD}
                  segments={alumniSegments}
                  split
                />
              )}
              {showChampionCommunity && (
                <PulseDonutBox
                  title={`${FORGE_LABELS.guides} Community`}
                  lead={GUIDE_LEAD}
                  segments={championSegments}
                />
              )}
              <NostalgiaBox
                title="Trending Topics"
                rows={top(data.trendingTopics, 6)}
                total={total}
                withBars
              />
              <NostalgiaBox
                title="Joining From"
                rows={top(data.topCountries, 6)}
                total={total}
                renderLabel={name => (
                  <span>{countryFlag(name)} {name || "Unknown"}</span>
                )}
                withBars
              />
              <NostalgiaBox title="Shared Universities" rows={top(data.topUniversities, 6)} total={total} withBars />
              <NostalgiaBox title="Shared Employers" rows={top(data.topPastEmployers, 6)} total={total} withBars />
              <NostalgiaBox title="Communities Forming" rows={topCommunities(data.communities, 6)} total={total} withBars />
            </div>
          </section>
        </>
      )}

      {!loading && connectionItems.length > 0 && (
        <section className="story-section story-section--spacious">
          <span className="narrative-kicker">Connection intent</span>
          <p style={{ color: "var(--muted)", maxWidth: "640px", margin: "0 0 16px", lineHeight: 1.5, fontSize: "0.92rem" }}>
            Who is open to the conversations that make {FORGE_EVENT.name} personal: alumni ties, colleagues, careers, and mentoring.
          </p>
          <div className="pulse-intent-cards">
            {connectionItems.map(item => (
              <article key={item.label} className="pulse-intent-card" style={{ borderTopColor: item.tone }}>
                <p className="pulse-intent-card-count">{item.pct}%</p>
                <p className="pulse-intent-card-label">{item.label}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your plan is already taking shape.</h2>
              <p>These signals become a focused Compass on My Experience, tuned to your goals and your story.</p>
            </>
          ) : (
            <>
              <h2>Add your signal to the room.</h2>
              <p>{FORGE_PRODUCT.buildMyJourney} to share your intent and discover who is here for the same reasons you are.</p>
            </>
          )}
        </div>
        {user && enrolled ? (
          <Link href="/txc/experience" className="btn-primary">Open {FORGE_PRODUCT.myJourney} →</Link>
        ) : (
          <Link href="/txc/enroll" className="btn-primary">{FORGE_PRODUCT.buildMyJourney} →</Link>
        )}
      </section>
    </>
  );
}
