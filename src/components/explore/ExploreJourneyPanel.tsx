"use client";

import Image from "next/image";
import Link from "next/link";
import {
  explorePreviewGateCopy,
  resolveJourneyCta,
  resolveJourneyPreviews,
  type ExploreJourney,
} from "@/data/exploreJourneys";

interface ExploreJourneyPanelProps {
  journey: ExploreJourney;
  enrolled?: boolean;
}

export default function ExploreJourneyPanel({ journey, enrolled = false }: ExploreJourneyPanelProps) {
  const previews = resolveJourneyPreviews(journey, enrolled);
  const cta = resolveJourneyCta(journey, enrolled);

  return (
    <article
      className="explore-journey-feature"
      aria-labelledby={`journey-feature-${journey.id}`}
      style={{ "--journey-accent": journey.accent } as React.CSSProperties}
    >
      <div className="explore-journey-feature__media">
        <Image
          src={journey.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="explore-journey-feature__body">
        <h2 id={`journey-feature-${journey.id}`} className="explore-journey-feature__title">
          {journey.title}
        </h2>
        <p className="explore-journey-feature__outcome">{journey.outcome}</p>

        <div className="explore-journey-feature__helps">
          <p className="explore-journey-feature__helps-kicker">Compass will:</p>
          <ul>
            {journey.helps.map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <p className="explore-journey-feature__gate">{explorePreviewGateCopy(enrolled)}</p>

        <div className="explore-journey-feature__previews" aria-label="How Compass surfaces recommendations">
          {previews.map(card => (
            <div
              key={`${journey.id}-${card.kicker}-${card.title}`}
              className={`explore-preview-card explore-preview-card--${card.kind}`}
            >
              <div className="explore-preview-card__top">
                <span className="explore-preview-card__kicker">{card.kicker}</span>
              </div>
              <p className="explore-preview-card__title">{card.title}</p>
              <p className="explore-preview-card__meta">{card.meta}</p>
            </div>
          ))}
        </div>

        <div className="explore-journey-feature__foot">
          <Link href={cta.href} className="btn-primary">
            {cta.label} →
          </Link>
        </div>
      </div>
    </article>
  );
}
