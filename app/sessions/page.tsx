"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";
const DEV_FALLBACK_ID = "ATT-0001";

const W = {
  track: 25,
  goal: 20,
  need: 15,
  role: 10,
  industry: 10,
  keyword: 5,
  executive: 5,
  broad: 5,
  handsOn: 5,
} as const;

type RawDoc = Record<string, unknown>;

interface ScoredSession {
  id: string;
  title: string;
  session_type?: string;
  activity_type?: string;
  schedule?: { day?: string; date?: string; start_time?: string; end_time?: string; room?: string };
  tracks?: { primary_track?: string; secondary_tracks?: string[]; topics?: string[]; products?: string[] };
  capacity?: { available_slots?: number; status?: string };
  recommendation_rules?: { executive_relevant?: boolean; everyone_encouraged?: boolean; hands_on?: boolean };
  date?: string;
  start_time?: string;
  room?: string;
  tech_track?: string | string[];
  compass_score: number;
  compass_reasons: string[];
}

function lower(items: (string | undefined | null)[]): string[] {
  return items
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.toLowerCase());
}

function resolve(raw: RawDoc, legacyKey: string, nestedPath: string): string {
  let cur: unknown = raw;
  for (const p of nestedPath.split(".")) {
    if (!cur || typeof cur !== "object") {
      cur = undefined;
      break;
    }
    cur = (cur as RawDoc)[p];
  }
  if (typeof cur === "string" && cur.trim()) return cur;
  const flat = raw[legacyKey];
  return typeof flat === "string" && flat.trim() ? flat : "";
}

function allTracks(raw: RawDoc): string[] {
  const tracks = (raw.tracks as RawDoc | undefined) ?? {};
  const primary = (tracks.primary_track as string) ?? "";
  const secondary = (tracks.secondary_tracks as string[]) ?? [];
  const legacy = raw.tech_track;
  const legacyArr = Array.isArray(legacy)
    ? (legacy as string[])
    : typeof legacy === "string" && legacy
      ? [legacy]
      : [];

  return [primary, ...secondary, ...legacyArr].filter(Boolean);
}

function sessionType(s: ScoredSession): string {
  return (s.session_type ?? s.activity_type ?? "Session").trim();
}

function sessionDay(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "date", "schedule.day");
}

function sessionStart(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "start_time", "schedule.start_time");
}

function sessionRoom(s: ScoredSession): string {
  return resolve(s as unknown as RawDoc, "room", "schedule.room");
}

function sessionMeta(s: ScoredSession): string {
  return [sessionDay(s), sessionStart(s), sessionRoom(s)].filter(Boolean).join(" · ");
}

function primaryTrack(s: ScoredSession): string {
  return s.tracks?.primary_track ?? "";
}

function scoreSession(participant: RawDoc, raw: RawDoc): ScoredSession {
  let score = 0;
  const reasons: string[] = [];

  const sig = (participant.event_signal_profile as RawDoc) ?? {};
  const intel = (participant.compass_intelligence as RawDoc) ?? {};
  const reg = (participant.registration as RawDoc) ?? {};
  const intent = (sig.intent as RawDoc) ?? {};

  const pTracks = lower((sig.tech_tracks as string[]) ?? []);
  const pGoals = lower((sig.goals as string[]) ?? []);
  const pNeeds = lower((intent.needs as string[]) ?? []);
  const pKeywords = lower((intel.matching_keywords as string[]) ?? []);
  const pRoles = lower((sig.roles_at_txc as string[]) ?? []);
  const pIndustry = ((reg.industry as string) ?? "").toLowerCase().trim();

  const sCI = (raw.compass_intelligence as RawDoc) ?? {};
  const sAudience = (raw.audience as RawDoc) ?? {};
  const sRules = (raw.recommendation_rules as RawDoc) ?? {};

  const sTracks = lower(allTracks(raw));
  const sIntents = lower((sCI.intent_tags as string[]) ?? []);
  const sNeeds = lower((sCI.need_tags as string[]) ?? []);
  const sKeywords = lower((sCI.matching_keywords as string[]) ?? []);
  const sRoles = lower((sAudience.roles as string[]) ?? []);
  const sIndustries = lower((sAudience.industries as string[]) ?? []);

  for (const t of pTracks) if (sTracks.includes(t)) { score += W.track; reasons.push(`Track match: ${t}`); }
  for (const g of pGoals) if (sIntents.includes(g)) { score += W.goal; reasons.push(`Goal match: ${g}`); }
  for (const n of pNeeds) if (sNeeds.includes(n)) { score += W.need; reasons.push(`Need match: ${n}`); }
  for (const r of pRoles) if (sRoles.includes(r)) { score += W.role; reasons.push(`Role match: ${r}`); }
  if (pIndustry && sIndustries.includes(pIndustry)) { score += W.industry; reasons.push(`Industry match: ${reg.industry}`); }
  for (const k of pKeywords) if (sKeywords.includes(k)) { score += W.keyword; reasons.push(`Keyword match: ${k}`); }
  if (sRules.executive_relevant) { score += W.executive; reasons.push("Executive relevant"); }
  if (sRules.everyone_encouraged) { score += W.broad; reasons.push("Broad event relevance"); }
  if (sRules.hands_on) { score += W.handsOn; reasons.push("Hands-on learning"); }

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "Untitled session"),
    session_type: raw.session_type as string | undefined,
    activity_type: raw.activity_type as string | undefined,
    schedule: raw.schedule as ScoredSession["schedule"],
    tracks: raw.tracks as ScoredSession["tracks"],
    capacity: raw.capacity as ScoredSession["capacity"],
    recommendation_rules: raw.recommendation_rules as ScoredSession["recommendation_rules"],
    date: raw.date as string | undefined,
    start_time: raw.start_time as string | undefined,
    room: raw.room as string | undefined,
    tech_track: raw.tech_track as string | string[] | undefined,
    compass_score: score,
    compass_reasons: reasons,
  };
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) return null;

  return (
    <div className="compass-score-badge" style={{ minWidth: "46px", minHeight: "46px", flexShrink: 0 }} title={`Compass score: ${score}`}>
      <span className="score-number" style={{ fontSize: "1.15rem" }}>{score}</span>
      <span className="score-label">fit</span>
    </div>
  );
}

function RecommendedCard({ session }: { session: ScoredSession }) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const meta = sessionMeta(session);
  const tags = [...(session.tracks?.topics ?? []), ...(session.tracks?.products ?? [])].slice(0, 4);

  return (
    <article className="opportunity-card">
      <div className="card-meta">
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <ScoreBadge score={session.compass_score} />
      </div>
      <h3>{session.title}</h3>
      {meta && <p>{meta}</p>}
      {tags.length > 0 && (
        <div className="chip-row" style={{ marginTop: 0, marginBottom: "12px" }}>
          {tags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
        </div>
      )}
      {session.compass_reasons.length > 0 && (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 680, margin: "12px 0 6px" }}>
            Why Compass matched this
          </p>
          <ul className="reason-list">
            {session.compass_reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}
          </ul>
        </>
      )}
    </article>
  );
}

function CatalogRow({ session }: { session: ScoredSession }) {
  const type = sessionType(session);
  const track = primaryTrack(session);
  const day = sessionDay(session);
  const start = sessionStart(session);
  const room = sessionRoom(session);
  const capacity = session.capacity?.available_slots ?? 0;
  const status = session.capacity?.status ?? "";

  return (
    <article>
      <time>{day}{start ? ` · ${start}` : ""}</time>
      <div>
        <span>{type}{track ? ` · ${track}` : ""}</span>
        <h3>{session.title}</h3>
        <p>
          {room}
          {session.compass_score > 0 && <> · <span style={{ color: "var(--accent)", fontWeight: 600 }}>Score {session.compass_score}</span></>}
          {session.compass_reasons[0] && <> · {session.compass_reasons[0]}</>}
        </p>
      </div>
      <b>
        {capacity > 0 ? `${capacity} seats` : ""}
        {status ? <><br /><small style={{ fontSize: "0.72rem" }}>{status}</small></> : null}
      </b>
    </article>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "32px",
        padding: "0 12px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-text)" : "var(--soft)",
        fontSize: "0.82rem",
        fontWeight: active ? 680 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const participantId = user?.uid ?? DEV_FALLBACK_ID;

  const [allScored, setAllScored] = useState<ScoredSession[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("All");

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      try {
        const [pSnap, sessSnap] = await Promise.all([
          getDoc(doc(db, `${BASE}/participants/${participantId}`)),
          getDocs(collection(db, `${BASE}/sessions`)),
        ]);

        const pData = pSnap.exists() ? (pSnap.data() as RawDoc) : {};
        const rawSessions = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));

        const scored = rawSessions
          .map((s) => scoreSession(pData, s))
          .sort((a, b) => b.compass_score - a.compass_score);

        setAllScored(scored);
        setTotalCount(scored.length);
        setStatus("ready");
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        setErrorMsg(`${e.code ? `(${e.code}) ` : ""}${e.message ?? String(err)}`);
        setStatus("error");
      }
    }

    load();
  }, [authLoading, participantId]);

  const { tracks, types, days } = useMemo(() => {
    const trackSet = new Set<string>();
    const typeSet = new Set<string>();
    const daySet = new Set<string>();

    for (const s of allScored) {
      const t = primaryTrack(s);
      if (t) trackSet.add(t);
      typeSet.add(sessionType(s));
      const d = sessionDay(s);
      if (d) daySet.add(d);
    }

    return {
      tracks: ["All", ...Array.from(trackSet).sort()],
      types: ["All", ...Array.from(typeSet).sort()],
      days: ["All", ...Array.from(daySet).sort()],
    };
  }, [allScored]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return allScored.filter((s) => {
      if (q && !s.title.toLowerCase().includes(q)) return false;
      if (trackFilter !== "All" && primaryTrack(s) !== trackFilter) return false;
      if (typeFilter !== "All" && sessionType(s) !== typeFilter) return false;
      if (dayFilter !== "All" && sessionDay(s) !== dayFilter) return false;
      return true;
    });
  }, [allScored, search, trackFilter, typeFilter, dayFilter]);

  const isFiltered = search !== "" || trackFilter !== "All" || typeFilter !== "All" || dayFilter !== "All";
  const recommended = isFiltered ? filtered.slice(0, 6) : allScored.slice(0, 6);
  const catalogSessions = isFiltered ? filtered : allScored;

  if (status === "loading") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker">Loading…</div>
        <h1 style={{ fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "12px 0 16px", color: "var(--text)" }}>
          Scoring sessions against your profile…
        </h1>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="section no-top-border">
        <div className="section-kicker" style={{ color: "var(--accent)" }}>Error</div>
        <h2>Could not load sessions</h2>
        <p style={{ color: "var(--muted)", maxWidth: "640px" }}>{errorMsg}</p>
      </section>
    );
  }

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Session Guide</div>
        <h1>Sessions matched to you.</h1>
        <p>
          Compass ranks {totalCount} sessions by your goals, tracks, role, needs,
          industry, and keywords. The highest match is shown first.
        </p>
      </section>

      <section className="section no-top-border">
        <div style={{ marginBottom: "20px" }}>
          <input
            type="search"
            placeholder="Search sessions by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search sessions"
            style={{
              width: "100%",
              maxWidth: "480px",
              height: "42px",
              padding: "0 14px",
              border: "1px solid var(--line-strong)",
              background: "var(--panel)",
              color: "var(--text)",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {tracks.length > 2 && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Tech track</p>
            <div className="chip-row" style={{ marginTop: 0 }}>
              {tracks.slice(0, 12).map((track) => (
                <FilterChip key={track} label={track} active={trackFilter === track} onClick={() => setTrackFilter(track)} />
              ))}
            </div>
          </div>
        )}

        {types.length > 2 && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Session type</p>
            <div className="chip-row" style={{ marginTop: 0 }}>
              {types.slice(0, 10).map((type) => (
                <FilterChip key={type} label={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} />
              ))}
            </div>
          </div>
        )}

        {days.length > 2 && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 680, margin: "0 0 8px" }}>Day</p>
            <div className="chip-row" style={{ marginTop: 0 }}>
              {days.map((day) => (
                <FilterChip key={day} label={day} active={dayFilter === day} onClick={() => setDayFilter(day)} />
              ))}
            </div>
          </div>
        )}

        {isFiltered && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{filtered.length} of {totalCount} sessions</span>
            <button
              onClick={() => { setSearch(""); setTrackFilter("All"); setTypeFilter("All"); setDayFilter("All"); }}
              style={{ background: "transparent", border: 0, color: "var(--accent)", fontSize: "0.88rem", fontFamily: "inherit", cursor: "pointer", padding: 0 }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {recommended.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="section-kicker">{isFiltered ? "Top matches in results" : "Recommended for you"}</div>
              <h2>{isFiltered ? `Top ${recommended.length} from your search` : "Your highest-scored sessions."}</h2>
            </div>
            <p>
              {isFiltered
                ? "Compass scores within your filtered results. Score reflects match to your profile."
                : "Ranked by track alignment, goals, needs, role, industry, and keyword overlap."}
            </p>
          </div>

          <div className="opportunity-grid three">
            {recommended.map((s) => <RecommendedCard key={s.id} session={s} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">{isFiltered ? "Filtered catalog" : "All sessions"}</div>
            <h2>{isFiltered ? `${catalogSessions.length} session${catalogSessions.length !== 1 ? "s" : ""}` : `All ${totalCount} sessions`}</h2>
          </div>
          <p>Sorted by Compass score — highest match first.</p>
        </div>

        {catalogSessions.length === 0 ? (
          <div style={{ borderTop: "1px solid var(--line)", padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "1.05rem", margin: "0 0 16px" }}>
              No sessions match your current filters.
            </p>
            <button
              onClick={() => { setSearch(""); setTrackFilter("All"); setTypeFilter("All"); setDayFilter("All"); }}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="catalog-list">
            {catalogSessions.map((s) => <CatalogRow key={s.id} session={s} />)}
          </div>
        )}
      </section>

      <section className="final-band">
        <div>
          <h2>Your full experience is on the Compass page.</h2>
          <p>
            Sessions are one pillar. Community, Next Best Move, and Voice Compass
            are on your Experience page.
          </p>
        </div>
        <a href="/experience" className="btn-primary">
          Open My Compass
        </a>
      </section>
    </>
  );
}