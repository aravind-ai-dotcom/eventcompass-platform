// =============================================================================
// EventCompass — People Recommendations
// src/components/experience/PeopleRecommendations.tsx
//
// Phase 7: Category-based people discovery. 3-5 people per category.
// RULE: Never recommends the current user (currentUserId exclusion).
// Categories: AI, Cloud, Data, Security, First-Time, Community Leaders, Champions
// =============================================================================

"use client";

export interface RecommendedPerson {
  id:           string;
  display_name: string;
  title?:       string;
  organization?: string;
  photo_url?:   string;
  linkedin_url?: string;
  categories:   string[];
  bio?:         string;
  shared_keywords?: string[];
  is_champion?:  boolean;
  is_first_timer?: boolean;
}

interface Props {
  people:        RecommendedPerson[];
  currentUserId: string;  // REQUIRED — prevents self-match
  maxPerCategory?: number;
}

const CATEGORIES = [
  { id: "AI",                  label: "AI",                   kicker: "Explore AI together"           },
  { id: "Cloud",               label: "Cloud",                kicker: "Cloud practitioners"           },
  { id: "Data",                label: "Data",                 kicker: "Data & analytics"              },
  { id: "Security",            label: "Security",             kicker: "Security practitioners"        },
  { id: "First-Time",          label: "First-Time Attendees", kicker: "New to TechXchange"            },
  { id: "Community Leaders",   label: "Community Leaders",    kicker: "Driving the community"         },
  { id: "Champions",           label: "IBM Champions",        kicker: "Ask them anything"             },
];

function PersonMiniCard({ person }: { person: RecommendedPerson }) {
  const initial = person.display_name[0]?.toUpperCase() ?? "?";

  return (
    <div
      style={{
        display:    "flex",
        alignItems: "flex-start",
        gap:        "10px",
        padding:    "12px",
        border:     "1px solid var(--line)",
        background: "var(--panel)",
      }}
    >
      {/* Avatar */}
      {person.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photo_url} alt={person.display_name}
          style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div className="avatar-fallback" style={{ width: 40, height: 40, fontSize: "0.95rem", flexShrink: 0 }}>
          {initial}
        </div>
      )}

      {/* Identity */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--text)", letterSpacing: "-0.01em" }}>
            {person.display_name}
          </p>
          {person.is_champion && (
            <span style={{ fontSize: "0.65rem", padding: "1px 6px", border: "1px solid var(--accent)", color: "var(--accent)", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              Champion
            </span>
          )}
          {person.is_first_timer && (
            <span style={{ fontSize: "0.65rem", padding: "1px 6px", border: "1px solid var(--line)", color: "var(--muted)", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              First timer
            </span>
          )}
        </div>
        {(person.title || person.organization) && (
          <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.3 }}>
            {[person.title, person.organization].filter(Boolean).join(" · ")}
          </p>
        )}
        {person.shared_keywords && person.shared_keywords.length > 0 && (
          <p style={{ margin: "4px 0 0", color: "var(--accent)", fontSize: "0.74rem", fontWeight: 600 }}>
            Shares: {person.shared_keywords.slice(0, 2).join(", ")}
          </p>
        )}
        {/* Actions */}
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
          {person.linkedin_url && (
            <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", height: "24px", padding: "0 8px", border: "1px solid #0A66C2", color: "#0A66C2", fontSize: "0.72rem", fontWeight: 650, textDecoration: "none", whiteSpace: "nowrap" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          )}
          <button style={{ display: "inline-flex", alignItems: "center", height: "24px", padding: "0 8px", border: "1px solid var(--line)", background: "transparent", color: "var(--muted)", fontSize: "0.72rem", fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PeopleRecommendations({ people, currentUserId, maxPerCategory = 4 }: Props) {
  // RULE: never self-match
  const eligible = people.filter(p => p.id !== currentUserId);

  const populated = CATEGORIES.map(cat => ({
    ...cat,
    people: eligible
      .filter(p => p.categories.includes(cat.id))
      .slice(0, maxPerCategory),
  })).filter(cat => cat.people.length > 0);

  if (populated.length === 0) return null;

  return (
    <section>
      <div style={{ marginBottom: "20px" }}>
        <div className="section-kicker">People to meet</div>
        <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 520, letterSpacing: "-0.04em", margin: "4px 0 0", color: "var(--text)" }}>
          TechXchange is better when you find your people.
        </h2>
      </div>

      <div style={{ display: "grid", gap: "32px" }}>
        {populated.map(cat => (
          <div key={cat.id}>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>
                {cat.label}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: 0 }}>{cat.kicker}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
              {cat.people.map(p => <PersonMiniCard key={p.id} person={p} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
