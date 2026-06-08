"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// Live event signal dashboard: session types, track distribution, audience.
// Placeholder v1 — aggregates real Firestore data without exposing individuals.
// Full implementation in Phase 5 (Communities + Pulse).
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}
function top(map: Record<string, number>, n = 6) {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, n);
}

interface PulseData {
  totalSessions:    number;
  totalChampions:   number;
  totalParticipants: number;
  sessionTypes:     Record<string, number>;
  primaryTracks:    Record<string, number>;
  topics:           Record<string, number>;
  handsOn:          number;
  networking:       number;
  limited:          number;
  championDomains:  Record<string, number>;
}

export default function PulsePage() {
  const [data,    setData]    = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessSnap, champSnap, partSnap] = await Promise.all([
          getDocs(collection(db, `${BASE}/sessions`)),
          getDocs(collection(db, `${BASE}/champions`)),
          getDocs(collection(db, `${BASE}/participants`)),
        ]);

        const sessionTypes:    Record<string, number> = {};
        const primaryTracks:   Record<string, number> = {};
        const topics:          Record<string, number> = {};
        const championDomains: Record<string, number> = {};
        let handsOn = 0, networking = 0, limited = 0;

        for (const d of sessSnap.docs) {
          const s = d.data() as RawDoc;
          inc(sessionTypes, (s.session_type ?? s.activity_type) || "Session");
          const tracks = s.tracks as RawDoc | undefined;
          if (tracks?.primary_track) inc(primaryTracks, tracks.primary_track);
          ((tracks?.topics as string[]) ?? []).forEach(t => inc(topics, t));
          const rules = s.recommendation_rules as RawDoc | undefined;
          if (rules?.hands_on)            handsOn++;
          if (rules?.good_for_networking) networking++;
          const cap = s.capacity as RawDoc | undefined;
          if (cap?.status === "limited")  limited++;
        }

        for (const d of champSnap.docs) {
          const c = d.data() as RawDoc;
          const profile = c.profile as RawDoc | undefined;
          ((profile?.domains as string[]) ?? []).forEach(dom => inc(championDomains, dom));
        }

        setData({
          totalSessions: sessSnap.size,
          totalChampions: champSnap.size,
          totalParticipants: partSnap.size,
          sessionTypes, primaryTracks, topics,
          handsOn, networking, limited, championDomains,
        });
      } catch (_) { /* silent — shows zeros */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Pulse</div>
        <h1>See who is here, what is moving, and where opportunities are forming.</h1>
        <p>
          Pulse is the live read of the event: audience signal, session movement,
          Champion presence, and the opportunities beginning to take shape.
        </p>
      </section>

      {/* Scoreboard */}
      <section className="section no-top-border">
        <div className="section-head">
          <div><div className="section-kicker">Event pulse</div><h2>The room is taking shape.</h2></div>
          <p>Operating signals for Compass. Showing the event ecosystem forming.</p>
        </div>
        <div className="pulse-scoreboard">
          <article><span>Sessions mapped</span><b>{loading ? "…" : data?.totalSessions ?? 0}</b></article>
          <article><span>Champion profiles</span><b>{loading ? "…" : data?.totalChampions ?? 0}</b></article>
          <article><span>Attendee signals</span><b>{loading ? "…" : data?.totalParticipants ?? 0}</b></article>
          <article><span>Hands-on options</span><b>{loading ? "…" : data?.handsOn ?? 0}</b></article>
        </div>
      </section>

      {/* Tracks + Topics */}
      {data && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Session movement</div><h2>Where attention is gathering.</h2></div>
            <p>Track and topic distribution across the full session catalog.</p>
          </div>
          <div className="pulse-columns">
            <div className="pulse-column">
              <h3>Top tracks</h3>
              {top(data.primaryTracks).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.primaryTracks).length === 0 && <p style={{ color: "var(--muted)" }}><span>No track data yet</span><b>—</b></p>}
            </div>
            <div className="pulse-column">
              <h3>Top topics</h3>
              {top(data.topics).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.topics).length === 0 && <p style={{ color: "var(--muted)" }}><span>No topic data yet</span><b>—</b></p>}
            </div>
            <div className="pulse-column">
              <h3>Champion domains</h3>
              {top(data.championDomains).map(([name, count]) => (
                <p key={name}><span>{name}</span><b>{count}</b></p>
              ))}
              {Object.keys(data.championDomains).length === 0 && <p style={{ color: "var(--muted)" }}><span>No domain data yet</span><b>—</b></p>}
            </div>
          </div>
        </section>
      )}

      {/* Session type grid */}
      {data && Object.keys(data.sessionTypes).length > 0 && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Experience mix</div><h2>How the week is structured.</h2></div>
            <p>Session types across the full catalog. Click any type to filter in the Session Guide.</p>
          </div>
          <div className="type-grid">
            {top(data.sessionTypes, 12).map(([type, count]) => (
              <Link
                key={type}
                href={`/sessions`}
                className="type-tile"
                title={`View ${type} sessions`}
              >
                <span>{type}</span>
                <b>{count}</b>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Compass health */}
      {data && (
        <section className="section">
          <div className="section-head">
            <div><div className="section-kicker">Compass health</div><h2>Signals Compass can act on.</h2></div>
            <p>The bridge between Pulse and My Experience: what the system can use to recommend sessions, Champions, and next best actions.</p>
          </div>
          <div className="community-dashboard">
            <article>
              <span>Hands-on options</span>
              <b>{data.handsOn}</b>
              <p>Labs and workshops that support action-oriented recommendations.</p>
            </article>
            <article>
              <span>Networking moments</span>
              <b>{data.networking}</b>
              <p>Sessions and meetups marked useful for connection.</p>
            </article>
            <article>
              <span>Limited sessions</span>
              <b>{data.limited}</b>
              <p>Capacity-sensitive sessions Compass prioritises carefully.</p>
            </article>
            <article>
              <span>Scoring signals</span>
              <b>9</b>
              <p>Track, goal, need, role, industry, keyword, and three rule bonuses.</p>
            </article>
          </div>
        </section>
      )}

      <section className="final-band">
        <div>
          <h2>Pulse becomes personal when Compass knows your intent.</h2>
          <p>Build your Compass to turn these event signals into a focused plan.</p>
        </div>
        <Link href="/enroll" className="btn-primary">Build my Compass</Link>
      </section>
    </>
  );
}
