"use client";
// =============================================================================
// EventCompass — Pulse  /pulse
// Live event intelligence: connection intent and room composition.
// Aggregate Firestore participant data only — no catalog metrics.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

const FLAG_MAP: Record<string, string> = {
  "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
  "united kingdom": "🇬🇧", uk: "🇬🇧", gb: "🇬🇧", "great britain": "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦",
  germany: "🇩🇪", de: "🇩🇪",
  australia: "🇦🇺", au: "🇦🇺",
  india: "🇮🇳", in: "🇮🇳",
  france: "🇫🇷", fr: "🇫🇷",
  brazil: "🇧🇷", br: "🇧🇷",
  netherlands: "🇳🇱", nl: "🇳🇱", "the netherlands": "🇳🇱",
  spain: "🇪🇸", es: "🇪🇸",
  italy: "🇮🇹", it: "🇮🇹",
  japan: "🇯🇵", jp: "🇯🇵",
  china: "🇨🇳", cn: "🇨🇳",
  singapore: "🇸🇬", sg: "🇸🇬",
  mexico: "🇲🇽", mx: "🇲🇽",
  sweden: "🇸🇪", se: "🇸🇪",
  norway: "🇳🇴", no: "🇳🇴",
  denmark: "🇩🇰", dk: "🇩🇰",
  finland: "🇫🇮", fi: "🇫🇮",
  "south africa": "🇿🇦", za: "🇿🇦",
  "new zealand": "🇳🇿", nz: "🇳🇿",
  ireland: "🇮🇪", ie: "🇮🇪",
  poland: "🇵🇱", pl: "🇵🇱",
  switzerland: "🇨🇭", ch: "🇨🇭",
  portugal: "🇵🇹", pt: "🇵🇹",
  belgium: "🇧🇪", be: "🇧🇪",
  austria: "🇦🇹", at: "🇦🇹",
  ukraine: "🇺🇦", ua: "🇺🇦",
  israel: "🇮🇱", il: "🇮🇱",
  uae: "🇦🇪", "united arab emirates": "🇦🇪", ae: "🇦🇪",
  argentina: "🇦🇷", ar: "🇦🇷",
  colombia: "🇨🇴", co: "🇨🇴",
  chile: "🇨🇱", cl: "🇨🇱",
  kenya: "🇰🇪", ke: "🇰🇪",
  nigeria: "🇳🇬", ng: "🇳🇬",
  egypt: "🇪🇬", eg: "🇪🇬",
  indonesia: "🇮🇩", id: "🇮🇩",
  malaysia: "🇲🇾", my: "🇲🇾",
  thailand: "🇹🇭", th: "🇹🇭",
  philippines: "🇵🇭", ph: "🇵🇭",
  pakistan: "🇵🇰", pk: "🇵🇰",
  bangladesh: "🇧🇩", bd: "🇧🇩",
  "sri lanka": "🇱🇰", lk: "🇱🇰",
};

function countryFlag(country: string): string {
  return FLAG_MAP[country.toLowerCase().trim()] ?? "🌍";
}

function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

function top(map: Record<string, number>, n = 6) {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, n);
}

interface PulseData {
  topCountries: Record<string, number>;
  topUniversities: Record<string, number>;
  topPastEmployers: Record<string, number>;
  communities: Record<string, number>;
  careerInterests: Record<string, number>;
  openToAlumni: number;
  openToColleague: number;
  openToUniversity: number;
  openToCareer: number;
}

function RoomList({
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
    <div className="room-list">
      <h3 className="room-list-title">{title}</h3>
      <ul className="room-list-items">
        {rows.map(([name, count]) => (
          <li key={name}>
            <span>{renderLabel ? renderLabel(name) : name}</span>
            <b>{count}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="pulse-empty">{message}</p>
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
        const careerInterests: Record<string, number> = {};
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
          ((p.career_interests as string[]) ?? []).forEach(c => inc(careerInterests, c));
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
          careerInterests,
          openToAlumni,
          openToColleague,
          openToUniversity,
          openToCareer,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const connectionTotal = data
    ? data.openToAlumni + data.openToColleague + data.openToUniversity + data.openToCareer
    : 0;

  const hasRoomData = data && (
    Object.keys(data.topCountries).length > 0 ||
    Object.keys(data.topUniversities).length > 0 ||
    Object.keys(data.topPastEmployers).length > 0 ||
    Object.keys(data.communities).length > 0 ||
    Object.keys(data.careerInterests).length > 0
  );

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
          <span className="narrative-kicker">Connection intent</span>
          <h2>Conversations people are open to having.</h2>
          <p className="story-lead story-lead--wide">
            Attendees are signalling the types of connections they want this week —
            alumni reunions, colleague catch-ups, university peers, and career talks.
          </p>
        </div>

        {loading && <EmptyState message="Reading connection signals…" />}

        {!loading && connectionTotal === 0 && (
          <EmptyState message="Connection signals will appear here once attendees build their Compass." />
        )}

        {!loading && data && connectionTotal > 0 && (
          <>
            <div className="intent-strip">
              {[
                { label: "Alumni connections", val: data.openToAlumni },
                { label: "Past colleagues", val: data.openToColleague },
                { label: "University community", val: data.openToUniversity },
                { label: "Career conversations", val: data.openToCareer },
              ].map(item => (
                <div key={item.label} className="intent-strip-item">
                  <p className="intent-strip-count">{item.val}</p>
                  <p className="intent-strip-label">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="story-note">
              Aggregate counts only.{" "}
              <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your signal →</Link>
            </p>
          </>
        )}
      </section>

      <section className="story-section story-section--spacious">
        <div className="story-head story-head--spacious">
          <span className="narrative-kicker">Room composition</span>
          <h2>Who is already here.</h2>
          <p className="story-lead story-lead--wide">
            Geography, education, employers, communities, and career interests
            shaping the conversations ahead.
          </p>
        </div>

        {loading && <EmptyState message="Reading the room…" />}

        {!loading && !hasRoomData && (
          <EmptyState message="Room composition will populate as attendee profiles arrive." />
        )}

        {!loading && data && hasRoomData && (
          <>
            <div className="room-composition">
              <RoomList
                title="Countries"
                rows={top(data.topCountries, 6)}
                renderLabel={name => (
                  <>
                    <span aria-hidden="true">{countryFlag(name)}</span> {name}
                  </>
                )}
              />
              <RoomList title="Universities" rows={top(data.topUniversities, 6)} />
              <RoomList title="Former employers" rows={top(data.topPastEmployers, 6)} />
              <RoomList title="Communities" rows={top(data.communities, 6)} />
              <RoomList title="Career interests" rows={top(data.careerInterests, 6)} />
            </div>
            <p className="story-note">
              Aggregate counts only. No individual attendee information is shown.{" "}
              <Link href="/enroll" style={{ color: "var(--accent)" }}>Add your background →</Link>
            </p>
          </>
        )}
      </section>

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
