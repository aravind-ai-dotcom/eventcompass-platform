"use client";

import RecommendedConnectionCard, {
  type RecommendedPerson,
} from "@/components/people/RecommendedConnectionCard";
import ChampionMatchCarousel from "@/components/experience/ChampionMatchCarousel";
import type { ConnectionBadgeContext } from "@/lib/connectionBadges";

interface RecommendedConnectionsSectionProps {
  people: RecommendedPerson[];
  profileSignals?: string[];
  badgeContext?: Omit<ConnectionBadgeContext, "isChampion">;
  actions?: {
    savedPeople: string[];
    hiddenPeople: string[];
    onSave: (id: string) => void;
    onHide: (id: string) => void;
    onDetails?: (id: string) => void;
  };
  embedded?: boolean;
}

export default function RecommendedConnectionsSection({
  people,
  profileSignals = [],
  badgeContext,
  actions,
  embedded = false,
}: RecommendedConnectionsSectionProps) {
  if (people.length === 0) return null;

  const cards = people.map(person => (
    <RecommendedConnectionCard
      key={person.id}
      person={person}
      profileSignals={profileSignals}
      badgeContext={{ ...badgeContext, isChampion: true }}
      actions={actions}
    />
  ));

  return (
    <section className={embedded ? "compass-module-block intelligence-band" : "section intelligence-band"}>
      <div className="section-head narrow">
        <div>
          <div className="section-kicker">Recommended connections</div>
          <h2>Who should I meet?</h2>
        </div>
        <p className="section-head-note">
          One clear reason per person — badges show what kind of connection this is.
        </p>
      </div>

      <div className="recommended-connections-stack recommended-connections-stack--desktop">
        {cards}
      </div>

      <ChampionMatchCarousel count={people.length}>
        {cards}
      </ChampionMatchCarousel>
    </section>
  );
}
