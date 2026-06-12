"use client";
// =============================================================================
// EventCompass — Champions  /champions
//
// Wave 6: People actions (save/remove/do-not-suggest on champion cards)
//   • Logged-in users: View profile, Save, Remove, Do not suggest
//   • Anonymous users: View profile only
//   • State written to participants/{uid}:
//       saved_people[], removed_people[], do_not_suggest_people[]
//   • Carbon-inspired card design (circular avatar, neutral surface, IBM Blue)
//   • No email exposed. LinkedIn gated by logged-in state + existing URL.
//   • No Firestore champion schema changes.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BASE     = "organizations/ibm/events/txc2026";
const IBM_BLUE = "#0f62fe";

type RawDoc = Record<string, unknown>;

interface Champion {
  id: string;
  display_name: string;
  title?: string;
  organization?: string;
  company?: string;
  geo?: string;
  country?: string;
  profile?: { domains?: string[]; products?: string[] };
  attendance?: { available_for_1x1?: boolean };
  domains?: string[];
  linkedin_url?: string;
  consent?: { show_linkedin?: boolean };
}

// Threaded into each card
interface PeopleState {
  savedPeople:        string[];
  removedPeople:      string[];
  doNotSuggestPeople: string[];
  isLoggedIn:         boolean;
  onSave:             (id: string) => void;
  onRemove:           (id: string) => void;
  onDoNotSuggest:     (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Carbon atom — circular avatar
// ─────────────────────────────────────────────────────────────────────────────

function PersonAvatar({ initial }: { initial: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(15, 98, 254, 0.06)",
        border: "1px solid rgba(15, 98, 254, 0.20)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.82rem", fontWeight: 500, color: IBM_BLUE,
        letterSpacing: "0.02em", flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PeopleActionBar
// ─────────────────────────────────────────────────────────────────────────────

function PeopleActionBar({ id, linkedinUrl, pState }: {
  id: string;
  linkedinUrl?: string;
  pState: PeopleState;
}) {
  const isSaved   = pState.savedPeople.includes(id);
  const isRemoved = pState.removedPeople.includes(id);
  const isDns     = pState.doNotSuggestPeople.includes(id);

  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    height: "24px", padding: "0 9px",
    border: "1px solid var(--line)", background: "transparent",
    color: "var(--muted)", fontSize: "0.70rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.01em", whiteSpace: "nowrap" as const, textDecoration: "none",
  };
  const savedBtn: React.CSSProperties = {
    ...base, border: "1px solid rgba(15, 98, 254, 0.35)",
    color: IBM_BLUE, background: "rgba(15, 98, 254, 0.04)",
  };
  const badge: React.CSSProperties = {
    fontSize: "0.68rem", color: "var(--muted)", padding: "2px 7px",
    border: "1px solid var(--line)", letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{
      borderTop: "1px solid var(--line)", paddingTop: "8px", marginTop: "10px",
      display: "flex", flexWrap: "wrap" as const, gap: "5px", alignItems: "center",
    }}>
      {/* View profile — always visible */}
      <a href={"/champions/" + id} style={base}>Profile &#8599;</a>

      {/* LinkedIn — logged-in only, gated by existing URL */}
      {pState.isLoggedIn && linkedinUrl && (
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={base}>
          LinkedIn &#8599;
        </a>
      )}

      {/* Save / Saved — logged-in only */}
      {pState.isLoggedIn && (
        isSaved
          ? <button onClick={() => pState.onSave(id)} style={savedBtn} type="button">&#10003; Saved</button>
          : <button onClick={() => pState.onSave(id)} style={base}     type="button">Save</button>
      )}

      {/* Remove — logged-in only */}
      {pState.isLoggedIn && !isRemoved && (
        <button onClick={() => pState.onRemove(id)} style={{ ...base, opacity: 0.75 }} type="button">Remove</button>
      )}
      {isRemoved && <span style={badge}>Removed</span>}

      {/* Do not suggest — logged-in only */}
      {pState.isLoggedIn && !isDns && !isRemoved && (
        <button onClick={() => pState.onDoNotSuggest(id)} style={{ ...base, opacity: 0.75 }} type="button">Not for me</button>
      )}
      {isDns && !isRemoved && <span style={badge}>Dismissed</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChampionCard  (Carbon style)
// ─────────────────────────────────────────────────────────────────────────────

function ChampionCard({ c, pState }: { c: Champion; pState: PeopleState }) {
  const initial   = c.display_name[0]?.toUpperCase() ?? "C";
  const org       = c.organization ?? c.company ?? "";
  const loc       = c.geo ?? c.country ?? "";
  const domains   = [...(c.profile?.domains ?? []), ...(c.domains ?? [])].slice(0, 3);
  const avail     = c.attendance?.available_for_1x1;
  const isRemoved = pState.removedPeople.includes(c.id);

  return (
    <article
      style={{
        background:    "var(--panel)",
        border:        "1px solid var(--line)",
        padding:       "20px",
        display:       "flex",
        flexDirection: "column",
        gap:           "10px",
        opacity:       isRemoved ? 0.45 : 1,
        transition:    "opacity 0.2s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <PersonAvatar initial={initial} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {loc && (
            <p style={{ margin: "0 0 2px", fontSize: "0.73rem", fontWeight: 650, color: IBM_BLUE, letterSpacing: "0.02em" }}>
              {loc}
            </p>
          )}
          <h3 style={{
            margin: 0, fontSize: "0.97rem", fontWeight: 600,
            color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.01em",
          }}>
            {c.display_name}
          </h3>
          {(c.title || org) && (
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.35 }}>
              {[c.title, org].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Domains */}
      {domains.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {domains.map((d) => (
            <span key={d} style={{
              fontSize: "0.73rem", padding: "2px 8px",
              border: "1px solid var(--line)", color: "var(--muted)",
            }}>{d}</span>
          ))}
        </div>
      )}

      {/* 1:1 availability */}
      {avail && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: IBM_BLUE, fontWeight: 550 }}>
          Available for 1:1
        </p>
      )}

      {/* People actions */}
      <div style={{ marginTop: "auto" }}>
        <PeopleActionBar id={c.id} linkedinUrl={c.linkedin_url} pState={pState} />
      </div>
    </article>
  );
}

function championDomains(c: Champion): string[] {
  return [...(c.profile?.domains ?? []), ...(c.domains ?? [])];
}

function isCommunityLeader(c: Champion): boolean {
  const domains = championDomains(c).map(d => d.toLowerCase());
  const title = (c.title ?? "").toLowerCase();
  const org = (c.organization ?? c.company ?? "").toLowerCase();
  return (
    domains.some(d => /community|leader|advocate|ambassador/.test(d)) ||
    /community|leader|advocate|ambassador/.test(title) ||
    /community/.test(org)
  );
}

function domainsOverlap(championDomainsList: string[], signals: string[]): boolean {
  if (signals.length === 0) return false;
  const lowered = championDomainsList.map(d => d.toLowerCase());
  return lowered.some(d =>
    signals.some(s => d.includes(s) || s.includes(d))
  );
}

function incDomain(map: Record<string, number>, key: string) {
  const k = key.trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// IntelligenceBand — people intelligence presentation slice
// ─────────────────────────────────────────────────────────────────────────────

function PeopleIntelligenceBand({ kicker, title, desc, champions, pState }: {
  kicker: string;
  title: string;
  desc: string;
  champions: Champion[];
  pState: PeopleState;
}) {
  if (champions.length === 0) return null;
  return (
    <section className="section intelligence-band">
      <div className="section-head">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h2>{title}</h2>
        </div>
        <p>{desc}</p>
      </div>
      <div className="intelligence-row intelligence-row--people">
        {champions.map(c => <ChampionCard key={c.id} c={c} pState={pState} />)}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ChampionsPage() {
  const { user, enrolled } = useAuth();

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  // People action state
  const [savedPeople,        setSavedPeople]        = useState<string[]>([]);
  const [removedPeople,      setRemovedPeople]      = useState<string[]>([]);
  const [doNotSuggestPeople, setDoNotSuggestPeople] = useState<string[]>([]);
  const [pLoading,           setPLoading]           = useState(false);
  const [profileSignals,     setProfileSignals]     = useState<string[]>([]);

  // Load champions
  useEffect(() => {
    getDocs(collection(db, BASE + "/champions"))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Champion));
        setChampions(data.sort((a, b) => a.display_name.localeCompare(b.display_name)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load people action state when user is logged in
  useEffect(() => {
    if (!user?.uid) return;
    setPLoading(true);
    getDoc(doc(db, BASE + "/participants/" + user.uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as RawDoc;
        setSavedPeople(        (d.saved_people         as string[]) ?? []);
        setRemovedPeople(      (d.removed_people        as string[]) ?? []);
        setDoNotSuggestPeople( (d.do_not_suggest_people as string[]) ?? []);
        const sig = (d.event_signal_profile as RawDoc) ?? {};
        const signals = [
          ...((sig.tech_tracks as string[]) ?? []),
          ...((d.career_interests as string[]) ?? []),
          ...((sig.goals as string[]) ?? []),
        ]
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
          .map(v => v.toLowerCase());
        setProfileSignals(signals);
      })
      .catch(() => {})
      .finally(() => setPLoading(false));
  }, [user?.uid]);

  // ── Persist helper ─────────────────────────────────────────────────────────

  const persist = useCallback(async (updates: Record<string, unknown>) => {
    if (!user?.uid) return;
    try { await setDoc(doc(db, BASE + "/participants/" + user.uid), updates, { merge: true }); }
    catch (e) { console.error("[ChampionAction] persist failed:", e); }
  }, [user?.uid]);

  // ── People action handlers ─────────────────────────────────────────────────

  const handleSave = useCallback((id: string) => {
    const next = savedPeople.includes(id)
      ? savedPeople.filter((x) => x !== id)
      : [...savedPeople, id];
    setSavedPeople(next);
    persist({ saved_people: next });
  }, [savedPeople, persist]);

  const handleRemove = useCallback((id: string) => {
    const nextSaved   = savedPeople.filter((x) => x !== id);
    const nextRemoved = removedPeople.includes(id) ? removedPeople : [...removedPeople, id];
    setSavedPeople(nextSaved);
    setRemovedPeople(nextRemoved);
    persist({ saved_people: nextSaved, removed_people: nextRemoved });
  }, [savedPeople, removedPeople, persist]);

  const handleDns = useCallback((id: string) => {
    const next = doNotSuggestPeople.includes(id) ? doNotSuggestPeople : [...doNotSuggestPeople, id];
    setDoNotSuggestPeople(next);
    persist({ do_not_suggest_people: next });
  }, [doNotSuggestPeople, persist]);

  // ── Build PeopleState ──────────────────────────────────────────────────────

  const pState = useMemo<PeopleState>(() => ({
    savedPeople,
    removedPeople,
    doNotSuggestPeople,
    isLoggedIn:     !!user && !pLoading,
    onSave:         handleSave,
    onRemove:       handleRemove,
    onDoNotSuggest: handleDns,
  }), [savedPeople, removedPeople, doNotSuggestPeople, user, pLoading, handleSave, handleRemove, handleDns]);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const visibleChampions = useMemo(
    () => champions.filter(c =>
      !removedPeople.includes(c.id) && !doNotSuggestPeople.includes(c.id)
    ),
    [champions, removedPeople, doNotSuggestPeople]
  );

  const filtered = visibleChampions.filter((c) =>
    !search ||
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.organization ?? c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const recommendedExperts = useMemo(() => {
    const saved = savedPeople
      .map(id => visibleChampions.find(c => c.id === id))
      .filter((c): c is Champion => !!c);
    const savedIds = new Set(saved.map(c => c.id));
    const open = visibleChampions
      .filter(c => !savedIds.has(c.id) && c.attendance?.available_for_1x1)
      .slice(0, 6 - saved.length);
    return [...saved, ...open].slice(0, 6);
  }, [visibleChampions, savedPeople]);

  const sharedInterestChampions = useMemo(() => {
    if (profileSignals.length === 0) return [];
    const savedIds = new Set(recommendedExperts.map(c => c.id));
    return visibleChampions
      .filter(c => !savedIds.has(c.id) && domainsOverlap(championDomains(c), profileSignals))
      .slice(0, 6);
  }, [visibleChampions, profileSignals, recommendedExperts]);

  const mentors = useMemo(() => {
    const used = new Set([
      ...recommendedExperts.map(c => c.id),
      ...sharedInterestChampions.map(c => c.id),
    ]);
    return visibleChampions
      .filter(c => !used.has(c.id) && c.attendance?.available_for_1x1)
      .slice(0, 6);
  }, [visibleChampions, recommendedExperts, sharedInterestChampions]);

  const communityLeaders = useMemo(() => {
    const used = new Set([
      ...recommendedExperts.map(c => c.id),
      ...sharedInterestChampions.map(c => c.id),
      ...mentors.map(c => c.id),
    ]);
    return visibleChampions
      .filter(c => !used.has(c.id) && isCommunityLeader(c))
      .slice(0, 6);
  }, [visibleChampions, recommendedExperts, sharedInterestChampions, mentors]);

  const domainClusters = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of visibleChampions) {
      for (const d of championDomains(c)) incDomain(map, d);
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [visibleChampions]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <section className="compact-hero story-hero--strong">
        <div className="section-kicker">People intelligence</div>
        <h1>Experts, mentors, and community leaders.</h1>
        <p>
          IBM Champions bring practical knowledge and peer guidance into TechXchange.
          Compass surfaces who to meet — by expertise, shared interests, and availability.
        </p>
      </section>

      <section className="section no-top-border">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
              {loading ? "Loading…" : `${champions.length} Champion${champions.length !== 1 ? "s" : ""} indexed`}
            </p>
          </div>
          <Link href="/experience" className="btn-secondary" style={{ fontSize: "0.88rem" }}>
            See my matched champions
          </Link>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <input
            type="search"
            placeholder="Search by name or organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search champions"
            style={{
              width: "100%", maxWidth: "400px", height: "40px", padding: "0 12px",
              border: "1px solid var(--line-strong)", background: "var(--panel)",
              color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
            }}
          />
          {search && (
            <span style={{ color: "var(--muted)", fontSize: "0.88rem", marginLeft: "12px" }}>
              {filtered.length} of {champions.length}
            </span>
          )}
        </div>
      </section>

      {loading ? (
        <section className="section">
          <p style={{ color: "var(--muted)" }}>Loading champions from Firestore…</p>
        </section>
      ) : search ? (
        <section className="section">
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ color: "var(--muted)", marginBottom: "16px" }}>No champions match your search.</p>
              <button onClick={() => setSearch("")} className="btn-secondary">Clear search</button>
            </div>
          ) : (
            <div className="champion-grid three-champions">
              {filtered.map((c) => <ChampionCard key={c.id} c={c} pState={pState} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          {!user && domainClusters.length > 0 && (
            <section className="section intelligence-band intelligence-band--clusters">
              <div className="section-head">
                <div>
                  <div className="section-kicker">Expertise clusters</div>
                  <h2>Where knowledge concentrates.</h2>
                </div>
                <p>Domain coverage across the Champion guide — build your Compass for personalised matches.</p>
              </div>
              <div className="domain-cluster-row">
                {domainClusters.map(([domain, count]) => (
                  <div key={domain} className="domain-cluster-chip">
                    <span>{domain}</span>
                    <b>{count}</b>
                  </div>
                ))}
              </div>
            </section>
          )}

          <PeopleIntelligenceBand
            kicker="Recommended experts"
            title="Connection-ready Champions."
            desc={user && profileSignals.length > 0
              ? "Saved Champions and experts open for 1:1 conversations."
              : "Experts available for 1:1 — build your Compass for personalised matches on My Experience."}
            champions={recommendedExperts}
            pState={pState}
          />

          {user && profileSignals.length > 0 && (
            <PeopleIntelligenceBand
              kicker="Shared interests"
              title="Champions in your domains."
              desc="Experts whose domains overlap with your tracks, goals, and career interests."
              champions={sharedInterestChampions}
              pState={pState}
            />
          )}

          <PeopleIntelligenceBand
            kicker="Mentors"
            title="Open for 1:1 conversations."
            desc="Champions explicitly available to meet during TechXchange."
            champions={mentors}
            pState={pState}
          />

          <PeopleIntelligenceBand
            kicker="Community leaders"
            title="Guides shaping the event."
            desc="Champions focused on community, advocacy, and peer leadership."
            champions={communityLeaders}
            pState={pState}
          />

          <section className="section">
            <div className="section-head">
              <div>
                <div className="section-kicker">Browse all</div>
                <h2>Every Champion in the guide.</h2>
              </div>
              <p>Alphabetical directory — search above to narrow down.</p>
            </div>
            <div className="champion-grid three-champions">
              {visibleChampions.map((c) => <ChampionCard key={c.id} c={c} pState={pState} />)}
            </div>
          </section>
        </>
      )}

      <section className="final-band">
        <div>
          {user && enrolled ? (
            <>
              <h2>See which Champions match your profile.</h2>
              <p>My Experience scores Champions against your keywords, tracks, and goals — and shows exactly why each match was made.</p>
            </>
          ) : (
            <>
              <h2>Compass matches Champions to your profile.</h2>
              <p>Build your Compass to see which Champions align with your goals, tracks, and career interests.</p>
            </>
          )}
        </div>
        {user && enrolled
          ? <Link href="/experience" className="btn-primary">Open My Compass &#8594;</Link>
          : <Link href="/enroll"     className="btn-primary">Build My Compass &#8594;</Link>
        }
      </section>
    </>
  );
}
