"use client";

import Link from "next/link";

export default function PeoplePage() {
  return (
    <section className="section no-top-border">
      <div className="section-kicker">People intelligence</div>
      <h1>Find your people</h1>
      <p style={{ color: "var(--muted)", maxWidth: "640px", lineHeight: 1.55 }}>
        Champions, experts, and seller connections — matched to your Compass intent.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
        <Link href="/champions" className="btn-primary">Browse Champions →</Link>
        <Link href="/communities" className="btn-secondary">Communities →</Link>
      </div>
    </section>
  );
}
