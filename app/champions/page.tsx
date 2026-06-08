"use client";
// =============================================================================
// EventCompass — Champions  /champions
// Browse champion profiles. Placeholder v1 — reads live Firestore data.
// Full scoring and matching available via /experience.
// =============================================================================
import { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import Link from "next/link";

const BASE = "organizations/ibm/events/txc2026";
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
}

export default function ChampionsPage() {
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

  const filtered = champions.filter(c =>
    !search || c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.organization ?? c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

        {/* Search */}
        <div style={{ marginBottom: "24px" }}>
          <input type="search" placeholder="Search by name or organisation…" value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search champions"
            style={{ width: "100%", maxWidth: "400px", height: "40px", padding: "0 12px", border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit" }}
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
              const initial  = c.display_name[0]?.toUpperCase() ?? "C";
              const org      = c.organization ?? c.company ?? "";
              const loc      = c.geo ?? c.country ?? "";
              const domains  = [...(c.profile?.domains ?? []), ...(c.domains ?? [])].slice(0, 3);
              const avail    = c.attendance?.available_for_1x1;
              return (
                <article key={c.id} className="champion-mini">
                  <div className="avatar-fallback" aria-hidden="true">{initial}</div>
                  <div>
                    {loc && <span style={{ color: "var(--accent)", fontSize: "0.78rem", fontWeight: 650 }}>{loc}</span>}
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
          <h2>See which Champions match your profile.</h2>
          <p>My Experience scores Champions against your keywords, tracks, and goals — and shows exactly why each match was made.</p>
        </div>
        <Link href="/experience" className="btn-primary">Open My Compass</Link>
      </section>
    </>
  );
}
