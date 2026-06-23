import type { CSSProperties } from "react";
import Link from "next/link";
import { FORGE_EDGE } from "@/config/forgeBrand";

function EdgeIcon({ id }: { id: string }) {
  switch (id) {
    case "engineering":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" />
        </svg>
      );
    case "systems":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
        </svg>
      );
    case "builders":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
        </svg>
      );
  }
}

export default function HomeEdgeGrid() {
  return (
    <section className="forge-edge" aria-labelledby="forge-edge-heading">
      <div className="forge-edge__head">
        <span className="section-kicker">Capabilities</span>
        <h2 id="forge-edge-heading">Find your edge</h2>
      </div>
      <div className="forge-edge__grid">
        {FORGE_EDGE.map(card => (
          <Link
            key={card.id}
            href={card.href}
            className="forge-edge-card"
            style={{ "--edge-accent": card.accent } as CSSProperties}
          >
            <span className="forge-edge-card__icon">
              <EdgeIcon id={card.id} />
            </span>
            <h3 className="forge-edge-card__title">{card.title}</h3>
            <p className="forge-edge-card__body">{card.body}</p>
            <span className="forge-edge-card__arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
