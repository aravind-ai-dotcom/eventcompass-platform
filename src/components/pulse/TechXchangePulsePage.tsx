"use client";
// TechXchange participant pulse — preserved for /explore and admin references.
// SKO sellers use /pulse (SkoPulseView).

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  accumulateEducation,
  accumulatePastEmployers,
  accumulateParticipantTrendingTopics,
  countryFlag,
  incPublicCommunity,
  incPublicSignal,
  isInternalParticipant,
  participantNetworkingIdentity,
  top,
  topCommunities,
} from "@/lib/roomSignals";
import { isOpenToAlumniConnections, isOpenToMentoringConversations } from "@/lib/networkingIdentity";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface PulseData {
  audienceTotal: number;
  trendingTopics: Record<string, number>;
  topCountries: Record<string, number>;
  topUniversities: Record<string, number>;
  topPastEmployers: Record<string, number>;
  communities: Record<string, number>;
  openToAlumni: number;
  openToColleague: number;
  openToCareer: number;
  openToMentoring: number;
}

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

export default function TechXchangePulsePage() {
  const { user, enrolled } = useAuth();
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, `${BASE}/participants`))
      .then(snap => {
        let audienceTotal = 0;
        const trendingTopics: Record<string, number> = {};
        const topCountries: Record<string, number> = {};
        const topUniversities: Record<string, number> = {};
        const topPastEmployers: Record<string, number> = {};
        const communities: Record<string, number> = {};
        let openToAlumni = 0;
        let openToColleague = 0;
        let openToCareer = 0;
        let openToMentoring = 0;

        for (const d of snap.docs) {
          const p = d.data() as RawDoc;
          if (!isInternalParticipant(p)) audienceTotal++;
          accumulateParticipantTrendingTopics(trendingTopics, p);
          incPublicSignal(topCountries, String(p.country ?? ""));
          accumulateEducation(topUniversities, p.education);
          accumulatePastEmployers(topPastEmployers, p.past_employers);
          for (const c of (p.community as string[] | undefined) ?? []) incPublicCommunity(communities, c);
          const ni = participantNetworkingIdentity(p);
          if (isOpenToAlumniConnections(ni)) openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_career_conversations) openToCareer++;
          if (isOpenToMentoringConversations(p)) openToMentoring++;
        }

        setData({
          audienceTotal,
          trendingTopics,
          topCountries,
          topUniversities,
          topPastEmployers,
          communities,
          openToAlumni,
          openToColleague,
          openToCareer,
          openToMentoring,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const total = data?.audienceTotal ?? 0;
  const connectionItems = data
    ? [
        { label: "Open to alumni connections", val: data.openToAlumni, tone: "var(--accent)" },
        { label: "Open to colleague conversations", val: data.openToColleague, tone: "var(--accent-2)" },
        { label: "Open to career conversations", val: data.openToCareer, tone: "var(--accent-3)" },
        { label: "Open to mentoring", val: data.openToMentoring, tone: "var(--accent-4)" },
      ].filter(item => item.val > 0)
        .map(item => ({ ...item, pct: pct(item.val, total) }))
    : [];

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Event pulse</div>
        <h1>The room is taking shape.</h1>
        <p style={{ color: "var(--muted)", maxWidth: "640px", marginTop: "12px", lineHeight: 1.55 }}>
          Communities forming, conversations beginning, opportunities emerging across TechXchange.
        </p>
      </section>

      {loading && (
        <section className="section no-top-border">
          <p style={{ color: "var(--muted)" }}>Loading pulse…</p>
        </section>
      )}

      {!loading && data && (
        <>
          <section className="story-section">
            <span className="narrative-kicker">Audience snapshot</span>
            <p className="pulse-snapshot-lead">
              What attendees are here for — drawn from goals, learning tracks, career interests, and connection intent.
            </p>
            <div className="nostalgia-grid">
              <NostalgiaBox
                title="Trending topics"
                rows={top(data.trendingTopics, 6)}
                total={total}
                withBars
              />
              <NostalgiaBox
                title="Where people are joining from"
                rows={top(data.topCountries, 6)}
                total={total}
                renderLabel={name => (
                  <span>{countryFlag(name)} {name || "Unknown"}</span>
                )}
                withBars
              />
              <NostalgiaBox title="Shared universities" rows={top(data.topUniversities, 6)} total={total} withBars />
              <NostalgiaBox title="Shared past employers" rows={top(data.topPastEmployers, 6)} total={total} withBars />
              <NostalgiaBox title="Communities forming" rows={topCommunities(data.communities, 6)} total={total} withBars />
            </div>
          </section>
        </>
      )}

      {!loading && connectionItems.length > 0 && (
        <section className="story-section story-section--spacious">
          <span className="narrative-kicker">Connection intent</span>
          <p style={{ color: "var(--muted)", maxWidth: "640px", margin: "0 0 16px", lineHeight: 1.5, fontSize: "0.92rem" }}>
            These are attendees who signaled openness to a type of conversation — not matches to you personally.
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
              <p>These room signals are personalized for your goals on My Experience.</p>
            </>
          ) : (
            <>
              <h2>Join the conversation.</h2>
              <p>Build My Compass to add your signal and discover who is here for the same reasons you are.</p>
            </>
          )}
        </div>
        {user && enrolled ? (
          <Link href="/txc/experience" className="btn-primary">Open My Compass →</Link>
        ) : (
          <Link href="/txc/enroll" className="btn-primary">Build My Compass →</Link>
        )}
      </section>
    </>
  );
}
