"use client";

import Link from "next/link";

export default function SkoPeoplePage() {
  return (
    <section className="sko-section">
      <p className="sko-kicker">People · SKO2H 2026</p>
      <h1>Seller & partner connections</h1>
      <p className="sko-lead">
        Experts, SE-Team contacts, and peer sellers matched to your geo, market, and persona.
      </p>
      <p className="sko-muted">
        People intelligence for SKO is coming soon. Refine your Compass intent to improve future matches.
      </p>
      <div className="sko-error-actions">
        <Link href="/sko/compass" className="sko-btn sko-btn--primary">Open My Compass</Link>
        <Link href="/sko/enroll" className="sko-btn sko-btn--secondary">Refine intent</Link>
      </div>
    </section>
  );
}
