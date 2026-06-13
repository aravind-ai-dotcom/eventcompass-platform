"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// What is happening in the room — boxed belonging signals, narrative intent.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { countryFlag, inc, incPublicCommunity, incPublicSignal, isInternalParticipant, top, topCommunities } from "@/lib/roomSignals";
import { isOpenToAlumniConnections, isOpenToMentoringConversations } from "@/lib/networkingIdentity";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface PulseData {
  audienceTotal: number;
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

export default function PulsePage() {
  const { user, enrolled } = useAuth();
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, `${BASE}/participants`))
      .then(snap => {
        let audienceTotal = 0;
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
          inc(topCountries, p.country ?? p.geo ?? "");
          const edu = (p.education as Array<Record<string, unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(topUniversities, e.institution);
          const emp = (p.past_employers as Array<Record<string, unknown>>) ?? [];
          for (const e of emp) if (e.company) incPublicSignal(topPastEmployers, e.company);
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => incPublicCommunity(communities, t));
          ((esp.roles_at_txc as string[]) ?? []).forEach(r => incPublicCommunity(communities, r));
          const ni = (p.networking_identity as Record<string, boolean>) ?? {};
          if (isOpenToAlumniConnections(ni)) openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_career_conversations) openToCareer++;
          if (isOpenToMentoringConversations(p)) openToMentoring++;
        }

        setData({
          audienceTotal: Math.max(audienceTotal, 1),
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
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const hasRoom = data && (
    Object.keys(data.topCountries).length > 0 ||
    Object.keys(data.topUniversities).length > 0 ||
    Object.keys(data.topPastEmployers).length > 0 ||
    Object.keys(data.communities).length > 0
  );

  const connectionItems = data ? [
    { label: "attendees open to alumni connections", val: data.openToAlumni, tone: "#a56eff" },
    { label: "attendees open to former-colleague conversations", val: data.openToColleague, tone: "#0f62fe" },
    { label: "attendees open to career conversations", val: data.openToCareer, tone: "#b45309" },
    { label: "attendees open to mentoring conversations", val: data.openToMentoring, tone: "#009d9a" },
  ].filter(i => i.val > 0) : [];

  const total = data?.audienceTotal ?? 1;

  return (
    <>
      <section className="story-hero story-hero--strong pulse-hero">
        <div className="section-kicker">Event pulse</div>
        <h1>The room is taking shape.</h1>
        <p>
          Communities forming, conversations beginning, opportunities emerging —
          before the week even starts.
        </p>
      </section>

      <section className="story-section story-section--spacious no-top-border">
        {loading && <p className="pulse-empty">Reading the room…</p>}

        {!loading && !hasRoom && (
          <p className="pulse-empty">Room signals will appear as attendees build their Compass profiles.</p>
        )}

        {!loading && data && hasRoom && (
          <>
            <div className="nostalgia-grid nostalgia-grid--boxed">
              <NostalgiaBox
                title="Countries"
                rows={top(data.topCountries, 5)}
                total={total}
                renderLabel={name => (
                  <>
                    <span aria-hidden="true">{countryFlag(name)}</span> {name}
                  </>
                )}
              />
              <NostalgiaBox
                title="Universities"
                rows={top(data.topUniversities, 5)}
                total={total}
                withBars
              />
              <NostalgiaBox
                title="Former employers"
                rows={top(data.topPastEmployers, 10)}
                total={total}
              />
              <NostalgiaBox
                title="Communities"
                rows={topCommunities(data.communities, 10)}
                total={total}
              />
            </div>
            <p className="story-note">
              Aggregate signals only. Percentages reflect share of the attendee community.{" "}
              <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
            </p>
          </>
        )}
      </section>

      {!loading && connectionItems.length > 0 && (
        <section className="story-section story-section--spacious">
          <span className="narrative-kicker">Connection intent</span>
          <p style={{ color: "var(--muted)", maxWidth: "640px", margin: "0 0 16px", lineHeight: 1.5, fontSize: "0.92rem" }}>
            These are attendees who signaled openness to a type of conversation — not matches to you personally.
          </p>
          <div className="pulse-intent-cards">
            {connectionItems.map(item => (
              <article key={item.label} className="pulse-intent-card" style={{ borderTopColor: item.tone }}>
                <p className="pulse-intent-card-count">{item.val}</p>
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
          <Link href="/experience" className="btn-primary">Open My Compass →</Link>
        ) : (
          <Link href="/enroll" className="btn-primary">Build My Compass →</Link>
        )}
      </section>
    </>
  );
}
