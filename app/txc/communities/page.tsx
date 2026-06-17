// =============================================================================
// EventCompass — Communities  /communities
// Placeholder — Community architecture designed in Phase 8.
// Shows the vision and links to working pages.
// =============================================================================
import Link from "next/link";

const COMMUNITY_EXAMPLES = [
  { name: "AI Community",             type: "Topic",      desc: "AI practitioners and builders. Labs, agentic workflows, LLMs, and enterprise AI strategy." },
  { name: "Cloud & Modernization",    type: "Topic",      desc: "Hybrid cloud, containerization, Red Hat OpenShift, and platform engineering." },
  { name: "Data & Analytics",         type: "Topic",      desc: "Data architecture, AI/BI, governance, and the analytics lifecycle." },
  { name: "IBM Champions",            type: "Role",       desc: "Champion-to-Champion connection, mentoring, and community leadership." },
  { name: "Women in Technology",      type: "Identity",   desc: "Peer support, mentoring, leadership conversations, and community building." },
  { name: "First-Time Attendees",     type: "Experience", desc: "Orientation, peer connection, and making the most of your first TechXchange." },
  { name: "CIO Roundtable",           type: "Role",       desc: "Executive peer conversations, strategic briefings, and IBM leadership access." },
  { name: "Open Source Community",    type: "Topic",      desc: "Open source practitioners, contributors, and advocates across IBM technologies." },
  { name: "IBM Z & LinuxONE",         type: "Topic",      desc: "Mainframe practitioners, architects, and the next generation of IBM Z builders." },
];

export default function CommunitiesPage() {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Communities</div>
        <h1>Find your people at TechXchange.</h1>
        <p>
          Communities are a first-class experience pillar — equal to Learning and Fun.
          They connect attendees through shared interests, identities, goals, and event activities.
          Full community features are coming in a future Compass release.
        </p>
      </section>

      {/* Coming soon notice */}
      <section className="section no-top-border">
        <div style={{ border: "1px solid var(--accent)", background: "var(--panel)", padding: "20px 24px", marginBottom: "40px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            Coming soon
          </p>
          <p style={{ color: "var(--soft)", margin: 0, fontSize: "0.95rem", lineHeight: 1.55 }}>
            The full Communities layer — discovery, matching, Birds of a Feather, roundtables, Pulse, and community events — is designed and ready to build.
            Community recommendations will appear in My Experience and the Next Best Move card.
          </p>
        </div>

        {/* Community preview cards */}
        <div className="section-head" style={{ marginBottom: "24px" }}>
          <div>
            <div className="section-kicker">Communities at TechXchange 2026</div>
            <h2>Groups worth joining.</h2>
          </div>
          <p>These are the communities planned for TechXchange 2026. When the Communities layer launches, Compass will score each one against your profile and surface the best matches.</p>
        </div>

        <div className="opportunity-grid three">
          {COMMUNITY_EXAMPLES.map(c => (
            <article key={c.name} className="opportunity-card">
              <div className="card-meta">
                <span>{c.type}</span>
              </div>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
              <small style={{ marginTop: "auto", color: "var(--muted)", fontSize: "0.8rem" }}>
                Available when Communities launches
              </small>
            </article>
          ))}
        </div>
      </section>

      {/* What communities will include */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">What communities include</div>
            <h2>More than a list of groups.</h2>
          </div>
          <p>Communities in Compass are built around activity, connection, and shared signal — not just a membership roster.</p>
        </div>
        <div className="experience-strip">
          {[
            { num: "01", title: "Community discovery",   body: "Compass scores communities against your profile and explains why each one matches your goals and keywords." },
            { num: "02", title: "Community events",       body: "Birds of a Feather, roundtables, lunches, and meetups — all surfaced in your Next Best Move at the right time." },
            { num: "03", title: "Community pulse",        body: "See which communities are most active, growing fastest, and have the strongest signal in your tracks." },
            { num: "04", title: "People you share",       body: "Compass shows how many matched attendees are already in a community before you join." },
          ].map(s => (
            <article key={s.num}>
              <span style={{ fontFamily: "var(--font-mono,ui-monospace)", color: "var(--accent)", fontSize: "0.78rem" }}>{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-band">
        <div>
          <h2>Your community recommendations live in My Experience.</h2>
          <p>Until Communities launches fully, the Community pillar in My Experience shows champion matches and community-type sessions scored for your profile.</p>
        </div>
        <Link href="/experience" className="btn-primary">Open My Compass</Link>
      </section>
    </>
  );
}
