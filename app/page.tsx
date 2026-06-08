export default function HomePage() {
  return (
    <>
      <section className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow">EventCompass</span>
          <h1>AI-powered event intelligence.</h1>
          <p>
            Compass helps attendees navigate IBM TechXchange through personalized
            guidance across Community, Learning, and Fun.
          </p>

          <div className="hero-actions">
            <a href="/experience" className="btn-primary">
              Enter Compass
            </a>
            <a href="/experience" className="btn-secondary">
              View My Experience
            </a>
          </div>

          <p className="pillar-line">
            Built around <strong>Community</strong> / <strong>Learning</strong> /{" "}
            <strong>Fun</strong>.
          </p>
        </div>

        <aside className="signal-panel">
          <div>
            <span className="panel-label">IBM TechXchange 2026</span>
            <h2>Your event, orchestrated around intent.</h2>
          </div>

          <div className="metrics-list">
            <div>
              <strong>28</strong>
              <span>attendee signals</span>
            </div>
            <div>
              <strong>100</strong>
              <span>sessions indexed</span>
            </div>
            <div>
              <strong>20</strong>
              <span>champions mapped</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Compass experience</div>
            <h2>Not another event catalog.</h2>
          </div>
          <p>
            EventCompass turns attendee goals, sessions, people, and event
            moments into one living experience layer.
          </p>
        </div>

        <div className="opportunity-grid three">
          <article className="opportunity-card">
            <div className="card-meta">
              <span>01</span>
              <b>Learning</b>
            </div>
            <h3>Find the sessions that actually matter.</h3>
            <p>
              Weighted recommendations based on tracks, goals, needs, roles,
              industry, and keywords.
            </p>
          </article>

          <article className="opportunity-card">
            <div className="card-meta">
              <span>02</span>
              <b>Community</b>
            </div>
            <h3>Meet the people worth finding.</h3>
            <p>
              Champion and peer matching turns the event from a catalog into a
              network.
            </p>
          </article>

          <article className="opportunity-card">
            <div className="card-meta">
              <span>03</span>
              <b>Fun</b>
            </div>
            <h3>Make the week memorable.</h3>
            <p>
              Compass surfaces receptions, keynotes, meetups, and social moments
              at the right time.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}