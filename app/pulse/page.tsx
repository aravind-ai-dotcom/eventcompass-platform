"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// What is happening in the room — belonging signals first, not statistics.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { countryFlag, inc, top } from "@/lib/roomSignals";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

interface PulseData {
  topCountries: Record<string, number>;
  topUniversities: Record<string, number>;
  topPastEmployers: Record<string, number>;
  communities: Record<string, number>;
  openToAlumni: number;
  openToColleague: number;
  openToUniversity: number;
  openToCareer: number;
}

function NostalgiaColumn({
  title,
  rows,
  renderLabel,
}: {
  title: string;
  rows: [string, number][];
  renderLabel?: (name: string) => React.ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="nostalgia-column">
      <h3 className="nostalgia-column-title">{title}</h3>
      <ul className="nostalgia-column-list">
        {rows.map(([name]) => (
          <li key={name}>{renderLabel ? renderLabel(name) : name}</li>
        ))}
      </ul>
    </div>
  );
}

export default function PulsePage() {
  const { user, enrolled } = useAuth();
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, `${BASE}/participants`))
      .then(snap => {
        const topCountries: Record<string, number> = {};
        const topUniversities: Record<string, number> = {};
        const topPastEmployers: Record<string, number> = {};
        const communities: Record<string, number> = {};
        let openToAlumni = 0;
        let openToColleague = 0;
        let openToUniversity = 0;
        let openToCareer = 0;

        for (const d of snap.docs) {
          const p = d.data() as RawDoc;
          inc(topCountries, p.country ?? p.geo ?? "");
          const edu = (p.education as Array<Record<string, unknown>>) ?? [];
          for (const e of edu) if (e.institution) inc(topUniversities, e.institution);
          const emp = (p.past_employers as Array<Record<string, unknown>>) ?? [];
          for (const e of emp) if (e.company) inc(topPastEmployers, e.company);
          const esp = (p.event_signal_profile as Record<string, unknown>) ?? {};
          ((esp.tech_tracks as string[]) ?? []).forEach(t => inc(communities, t));
          ((esp.roles_at_txc as string[]) ?? []).forEach(r => inc(communities, r));
          const ni = (p.networking_identity as Record<string, boolean>) ?? {};
          if (ni.open_to_alumni_connections) openToAlumni++;
          if (ni.open_to_past_colleague_connections) openToColleague++;
          if (ni.open_to_university_connections) openToUniversity++;
          if (ni.open_to_career_conversations) openToCareer++;
        }

        setData({
          topCountries,
          topUniversities,
          topPastEmployers,
          communities,
          openToAlumni,
          openToColleague,
          openToUniversity,
          openToCareer,
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
    { label: "Alumni connections", val: data.openToAlumni },
    { label: "Past colleagues", val: data.openToColleague },
    { label: "University community", val: data.openToUniversity },
    { label: "Career conversations", val: data.openToCareer },
  ].filter(i => i.val > 0) : [];

  return (
    <>
      <section className="story-hero story-hero--strong story-hero--spacious">
        <div className="section-kicker">Event pulse</div>
        <h1>The room is taking shape.</h1>
        <p>
          See where communities are forming, conversations are beginning, and
          opportunities are emerging across the event.
        </p>
      </section>

      <section className="story-section story-section--spacious no-top-border">
        <div className="story-head story-head--spacious">
          <span className="narrative-kicker">Who is here</span>
          <h2>Communities forming across the event.</h2>
          <p className="story-lead story-lead--wide">
            Geography, education, employers, and shared interests creating natural connection points.
          </p>
        </div>

        {loading && <p className="pulse-empty">Reading the room…</p>}

        {!loading && !hasRoom && (
          <p className="pulse-empty">Room signals will appear as attendees build their Compass profiles.</p>
        )}

        {!loading && data && hasRoom && (
          <>
            <div className="nostalgia-grid">
              <NostalgiaColumn
                title="Countries"
                rows={top(data.topCountries, 5)}
                renderLabel={name => (
                  <>
                    <span aria-hidden="true">{countryFlag(name)}</span> {name}
                  </>
                )}
              />
              <NostalgiaColumn title="Universities" rows={top(data.topUniversities, 5)} />
              <NostalgiaColumn title="Former employers" rows={top(data.topPastEmployers, 5)} />
              <NostalgiaColumn title="Communities" rows={top(data.communities, 5)} />
            </div>
            <p className="story-note">
              Aggregate signals only.{" "}
              <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
            </p>
          </>
        )}
      </section>

      {!loading && connectionItems.length > 0 && (
        <section className="story-section story-section--spacious">
          <div className="story-head story-head--spacious">
            <span className="narrative-kicker">Connection intent</span>
            <h2>Conversations people are open to having.</h2>
          </div>
          <ul className="pulse-intent-list">
            {connectionItems.map(item => (
              <li key={item.label}>
                <span>{item.label}</span>
                <em>{item.val} attendees</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>Your plan is already taking shape.</h2>
              <p>These room signals are personalised for your goals on My Experience.</p>
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
