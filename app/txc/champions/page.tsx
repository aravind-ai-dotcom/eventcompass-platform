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
import { tryGetDb } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ChampionDetailModal from "@/components/people/ChampionDetailModal";
import { displayFirstName, deriveIntentSnapshot, deriveMatchReasons } from "@/lib/personCardHelpers";
import { isMutualWithInbound, SAMPLE_INBOUND_SIGNALS } from "@/lib/sampleConnectionSignals";

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
  compass_reasons?: string[];
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
  onDetails:          (id: string) => void;
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

function canShowLinkedIn(c: { linkedin_url?: string; consent?: { show_linkedin?: boolean } }, isLoggedIn: boolean): boolean {
  if (!isLoggedIn || !c.linkedin_url?.trim()) return false;
  return c.consent?.show_linkedin !== false;
}

function PeopleActionBar({ id, linkedinUrl, showLinkedIn, pState }: {
  id: string;
  linkedinUrl?: string;
  showLinkedIn?: boolean;
  pState: PeopleState;
}) {
  const isSaved = pState.savedPeople.includes(id);
  const isDns   = pState.doNotSuggestPeople.includes(id);

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
      <button type="button" onClick={() => pState.onDetails(id)} style={base}>Details</button>

      {showLinkedIn && linkedinUrl && (
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={base}>
          LinkedIn ↗
        </a>
      )}

      {pState.isLoggedIn && (
        isSaved
          ? <button onClick={() => pState.onSave(id)} style={savedBtn} type="button">&#10003; Saved</button>
          : <button onClick={() => pState.onSave(id)} style={base}     type="button">Save person</button>
      )}

      {pState.isLoggedIn && !isDns && (
        <button onClick={() => pState.onDoNotSuggest(id)} style={{ ...base, opacity: 0.75 }} type="button">Not for me</button>
      )}
      {isDns && <span style={badge}>Dismissed</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChampionCard  (Carbon style)
// ─────────────────────────────────────────────────────────────────────────────

function ChampionCard({ c, pState, anonymous = false, profileSignals = [] }: {
  c: Champion;
  pState: PeopleState;
  anonymous?: boolean;
  profileSignals?: string[];
}) {
  const initial   = c.display_name[0]?.toUpperCase() ?? "C";
  const org       = c.organization ?? c.company ?? "";
  const loc       = c.geo ?? c.country ?? "";
  const profileExtra = c.profile as { domains?: string[]; products?: string[]; community_interests?: string[] } | undefined;
  const domains   = [...(profileExtra?.domains ?? []), ...(c.domains ?? [])].slice(0, 4);
  const products  = (profileExtra?.products ?? []).slice(0, 4);
  const communities = profileExtra?.community_interests ?? [];
  const tags      = [...new Set([...domains, ...products, ...communities])].slice(0, 5);
  const isRemoved = pState.removedPeople.includes(c.id);
  const shownName = anonymous ? displayFirstName(c.display_name) : c.display_name;
  const matchReasons = deriveMatchReasons(c, profileSignals);
  const intentSnapshot = deriveIntentSnapshot(c);
  const isMutual = !anonymous && pState.isLoggedIn
    && pState.savedPeople.includes(c.id)
    && isMutualWithInbound(c.display_name, c.id, pState.savedPeople, SAMPLE_INBOUND_SIGNALS);

  return (
    <article className={`champion-person-card${isRemoved ? " champion-person-card--dim" : ""}`}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <PersonAvatar initial={initial} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {!anonymous && loc && (
            <p style={{ margin: "0 0 2px", fontSize: "0.73rem", fontWeight: 650, color: IBM_BLUE, letterSpacing: "0.02em" }}>
              {loc}
            </p>
          )}
          <h3 style={{
            margin: 0, fontSize: "0.97rem", fontWeight: 600,
            color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.01em",
          }}>
            {shownName}
          </h3>
          {!anonymous && (c.title || org) && (
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.35 }}>
              {[c.title, org].filter(Boolean).join(" · ")}
            </p>
          )}
          {isMutual && (
            <span className="connection-signal-badge connection-signal-badge--mutual" style={{ marginTop: "6px", display: "inline-block" }}>
              Mutual interest
            </span>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="champion-person-tags">
          {anonymous && (
            <p className="connection-card-skills-kicker champion-person-skills-kicker">Skills &amp; domains</p>
          )}
          {tags.map((d) => (
            <span key={d} className="champion-person-tag">{d}</span>
          ))}
        </div>
      )}

      {!anonymous && intentSnapshot.length > 0 && (
        <div className="champion-person-intent">
          {intentSnapshot.map(item => (
            <span key={item} className="champion-person-intent-tag">{item}</span>
          ))}
        </div>
      )}

      {!anonymous && matchReasons.length > 0 && (
        <div className="champion-person-match">
          <p className="champion-person-match-kicker">Why Compass matched this person</p>
          <ul className="champion-person-match-list">
            {matchReasons.slice(0, 3).map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}

      {!anonymous && (
        <div style={{ marginTop: "auto" }}>
          <PeopleActionBar
            id={c.id}
            linkedinUrl={c.linkedin_url}
            showLinkedIn={canShowLinkedIn(c, pState.isLoggedIn)}
            pState={pState}
          />
        </div>
      )}
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

function PeopleIntelligenceBand({ kicker, desc, champions, pState, anonymous = false, profileSignals = [] }: {
  kicker: string;
  desc: string;
  champions: Champion[];
  pState: PeopleState;
  anonymous?: boolean;
  profileSignals?: string[];
}) {
  if (champions.length === 0) return null;
  return (
    <section className="section intelligence-band">
      <div className="champion-band-head">
        <span className="narrative-kicker">{kicker}</span>
        <p className="champion-band-desc">{desc}</p>
      </div>
      <div className="intelligence-row intelligence-row--people">
        {champions.map(c => (
          <ChampionCard key={c.id} c={c} pState={pState} anonymous={anonymous} profileSignals={profileSignals} />
        ))}
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
  const [detailChampion,     setDetailChampion]     = useState<Champion | null>(null);

  // Load champions
  useEffect(() => {
    const db = tryGetDb();
    if (!db) {
      setLoading(false);
      return;
    }
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
    const db = tryGetDb();
    if (!db) return;
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
    const db = tryGetDb();
    if (!user?.uid || !db) return;
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

  const handleDetails = useCallback((id: string) => {
    const found = champions.find(c => c.id === id);
    if (found) setDetailChampion(found);
  }, [champions]);

  // ── Build PeopleState ──────────────────────────────────────────────────────

  const pState = useMemo<PeopleState>(() => ({
    savedPeople,
    removedPeople,
    doNotSuggestPeople,
    isLoggedIn:     !!user && !pLoading,
    onSave:         handleSave,
    onRemove:       handleRemove,
    onDoNotSuggest: handleDns,
    onDetails:      handleDetails,
  }), [savedPeople, removedPeople, doNotSuggestPeople, user, pLoading, handleSave, handleRemove, handleDns, handleDetails]);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const visibleChampions = useMemo(
    () => champions.filter(c =>
      !removedPeople.includes(c.id) && !doNotSuggestPeople.includes(c.id)
    ),
    [champions, removedPeople, doNotSuggestPeople]
  );

  const filtered = visibleChampions.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (user && enrolled) {
      return (
        c.display_name.toLowerCase().includes(q) ||
        (c.organization ?? c.company ?? "").toLowerCase().includes(q) ||
        championDomains(c).some(d => d.toLowerCase().includes(q))
      );
    }
    const first = displayFirstName(c.display_name).toLowerCase();
    return (
      first.startsWith(q) ||
      championDomains(c).some(d => d.toLowerCase().includes(q))
    );
  });

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
      <section className="compact-hero champions-hero">
        <div className="section-kicker">People intelligence</div>
        <h1>Find your people before you arrive.</h1>
        <p>
          Compass helps identify experts, mentors, peers, and community leaders
          based on your interests, goals, and experience.
        </p>
      </section>

      <section className="section no-top-border">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
            {loading ? "Loading…" : `${champions.length} expert${champions.length !== 1 ? "s" : ""} indexed`}
          </p>
          <Link
            href={user && enrolled ? "/experience" : "/enroll"}
            className="btn-secondary"
            style={{ fontSize: "0.88rem" }}
          >
            {user && enrolled ? "See my matched champions" : "Build My Compass to match"}
          </Link>
        </div>

        {user && enrolled ? (
          <div style={{ marginBottom: "8px" }}>
            <input
              type="search"
              placeholder="Search by name, organization, or expertise…"
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
        ) : (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0, maxWidth: "520px" }}>
            Build your Compass to search by name. Browse expertise tags below to explore who is in the room.
          </p>
        )}
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
              {filtered.map((c) => (
                <ChampionCard key={c.id} c={c} pState={pState} anonymous={!user} profileSignals={profileSignals} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {!user && domainClusters.length > 0 && (
            <section className="section intelligence-band intelligence-band--clusters">
              <div className="champion-band-head">
                <span className="narrative-kicker">In the room</span>
                <p className="champion-band-desc">Expertise clusters forming across the Champion guide.</p>
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
            kicker="Recommended"
            desc="Experts and mentors aligned to common TechXchange interests."
            champions={recommendedExperts}
            pState={pState}
            anonymous={!user}
            profileSignals={profileSignals}
          />

          {user && profileSignals.length > 0 && (
            <PeopleIntelligenceBand
              kicker="Shared interests"
              desc="Champions in domains that overlap your tracks and goals."
              champions={sharedInterestChampions}
              pState={pState}
              anonymous={false}
              profileSignals={profileSignals}
            />
          )}

          <PeopleIntelligenceBand
            kicker="Mentors"
            desc="Experts open for conversations during the event."
            champions={mentors}
            pState={pState}
            anonymous={!user}
            profileSignals={profileSignals}
          />

          <PeopleIntelligenceBand
            kicker="Community leaders"
            desc="Guides shaping community conversations across TechXchange."
            champions={communityLeaders}
            pState={pState}
            anonymous={!user}
            profileSignals={profileSignals}
          />

          <section className="section">
            <div className="champion-band-head">
              <span className="narrative-kicker">Directory</span>
              <p className="champion-band-desc">Every expert in the guide.</p>
            </div>
            <div className="champion-grid three-champions">
              {visibleChampions.map((c) => (
                <ChampionCard key={c.id} c={c} pState={pState} anonymous={!user} profileSignals={profileSignals} />
              ))}
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

      {detailChampion && (
        <ChampionDetailModal
          champion={detailChampion}
          anonymous={!user}
          onClose={() => setDetailChampion(null)}
        />
      )}
    </>
  );
}
