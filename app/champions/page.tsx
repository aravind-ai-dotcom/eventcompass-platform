"use client";
// =============================================================================
// EventCompass — Champions  /champions
// Browse champion profiles. Privacy-aware: anonymous users see first-name-only
// previews with no employer/title/contact. Logged-in users see full profiles.
// Full scoring and matching available via /experience.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BASE = "organizations/ibm/events/txc2026";

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — first word of display_name for privacy-safe anonymous display
// ─────────────────────────────────────────────────────────────────────────────
function firstNameOnly(displayName: string): string {
  return displayName.split(/\s+/)[0] ?? displayName;
}

export default function ChampionsPage() {
  const { user, enrolled } = useAuth();
  const isLoggedIn = !!user;

  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    getDocs(collection(db, `${BASE}/champions`))
      .then(snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Champion));
        setChampions(data.sort((a, b) => a.display_name.localeCompare(b.display_name)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = champions.filter(c => {
    if (!search) return true;
    const q       = search.toLowerCase();
    const domains = [...(c.profile?.domains ?? []), ...(c.domains ?? [])];
    // Anonymous: search name + domains only (org is hidden, so don't filter by it)
    // Logged-in: also search org/company
    return (
      c.display_name.toLowerCase().includes(q) ||
      domains.some(d => d.toLowerCase().includes(q)) ||
      (isLoggedIn && (c.organization ?? c.company ?? "").toLowerCase().includes(q))
    );
  });

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Champions</div>
        <h1>Meet the people who make TechXchange extraordinary.</h1>
        <p>
          IBM Champions bring practical knowledge, generosity, and peer guidance into
          the event experience. For personalised champion matches scored against your
          profile, open My Experience.
        </p>
      </section>

      <section className="section no-top-border">
        {/* Counts */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div className="section-kicker" style={{ margin: 0 }}>All champions</div>
            <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.95rem" }}>
              {loading ? "Loading…" : `${champions.length} Champion${champions.length !== 1 ? "s" : ""} in the guide`}
            </p>
          </div>
          <Link href="/experience" className="btn-secondary" style={{ fontSize: "0.88rem" }}>
            See my matched champions
          </Link>
        </div>

        {/* Sign-in nudge — anonymous only, once data has loaded */}
        {!isLoggedIn && !loading && champions.length > 0 && (
          <div style={{
            marginBottom: "24px", padding: "14px 16px",
            border: "1px solid var(--line)", background: "var(--panel)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "12px",
          }}>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
              Sign in to see full profiles — names, titles, organisations, and personalised matches.
            </p>
            <Link href="/enroll" className="btn-secondary" style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
              Sign in →
            </Link>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="search"
            placeholder={isLoggedIn ? "Search by name or organisation…" : "Search by name or expertise…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
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

        {/* Champion grid */}
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading champions from Firestore…</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", marginBottom: "16px" }}>No champions match your search.</p>
            <button onClick={() => setSearch("")} className="btn-secondary">Clear search</button>
          </div>
        ) : (
          <div className="champion-grid three-champions">
            {filtered.map(c => {
              const domains = [...(c.profile?.domains ?? []), ...(c.domains ?? [])].slice(0, 3);
              const avail   = c.attendance?.available_for_1x1;

              if (!isLoggedIn) {
                // ── Anonymous: first name + domains only ─────────────────
                const firstName = firstNameOnly(c.display_name);
                const initial   = firstName[0]?.toUpperCase() ?? "C";
                return (
                  <article key={c.id} className="champion-mini">
                    <div className="avatar-fallback" aria-hidden="true">{initial}</div>
                    <div>
                      <h3>{firstName}</h3>
                      {domains.length > 0 && <small>{domains.join(" · ")}</small>}
                      {avail && (
                        <p style={{ color: "var(--accent)", fontSize: "0.82rem", marginTop: "8px" }}>
                          Available for 1:1
                        </p>
                      )}
                      <p style={{ color: "var(--muted)", fontSize: "0.80rem", marginTop: "8px", lineHeight: 1.4 }}>
                        <Link href="/enroll" style={{ color: "var(--accent)" }}>Sign in</Link> to see full profile
                      </p>
                    </div>
                  </article>
                );
              }

              // ── Logged-in: full details ───────────────────────────────
              const initial = c.display_name[0]?.toUpperCase() ?? "C";
              const org     = c.organization ?? c.company ?? "";
              const loc     = c.geo ?? c.country ?? "";
              return (
                <article key={c.id} className="champion-mini">
                  <div className="avatar-fallback" aria-hidden="true">{initial}</div>
                  <div>
                    {loc && (
                      <span style={{ color: "var(--accent)", fontSize: "0.78rem", fontWeight: 650 }}>
                        {loc}
                      </span>
                    )}
                    <h3>{c.display_name}</h3>
                    {(c.title || org) && (
                      <p>{[c.title, org].filter(Boolean).join(" · ")}</p>
                    )}
                    {domains.length > 0 && <small>{domains.join(" · ")}</small>}
                    {avail && (
                      <p style={{ color: "var(--accent)", fontSize: "0.82rem", marginTop: "8px" }}>
                        Available for 1:1
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

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
          ? <Link href="/experience" className="btn-primary">Open My Compass →</Link>
          : <Link href="/enroll"     className="btn-primary">Build My Compass →</Link>
        }
      </section>
    </>
  );
}
