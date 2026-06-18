"use client";

import RecommendedConnectionCard, {
  type PersonActionState,
  type RecommendedPerson,
} from "@/components/people/RecommendedConnectionCard";
import ChampionMatchCarousel from "@/components/experience/ChampionMatchCarousel";
import type { ConnectionBadgeContext } from "@/lib/connectionBadges";

interface RecommendedConnectionsSectionProps {
  people: RecommendedPerson[];
  experts?: RecommendedPerson[];
  profileSignals?: string[];
  badgeContext?: Omit<ConnectionBadgeContext, "isChampion">;
  actions?: PersonActionState;
  embedded?: boolean;
  anonymous?: boolean;
}

export default function RecommendedConnectionsSection({
  people,
  experts = [],
  profileSignals = [],
  badgeContext,
  actions,
  embedded = false,
  anonymous = false,
}: RecommendedConnectionsSectionProps) {
  if (people.length === 0 && experts.length === 0) return null;

  const renderCard = (person: RecommendedPerson) => (
    <RecommendedConnectionCard
      key={person.id}
      person={person}
      profileSignals={profileSignals}
      badgeContext={{
        ...badgeContext,
        isChampion: true,
        isSpeaker: person.is_speaker,
      }}
      primaryReason={person.compass_reasons?.[0] ?? null}
      actions={actions}
      anonymous={anonymous}
    />
  );

  const expertIds = new Set(experts.map(e => e.id));
  const championCards = people.filter(p => !expertIds.has(p.id)).map(renderCard);
  const expertCards = experts.map(renderCard);

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

      {expertCards.length > 0 && (
        <div className="recommended-experts-block">
          <header className="recommended-experts-block__head">
            <p className="recommended-experts-block__kicker">Recommended experts</p>
            <p className="recommended-experts-block__note">
              Speakers and domain experts matched to your goals — including people behind sessions Compass recommends.
            </p>
          </header>
          <div className="champion-grid three-champions champion-grid--desktop-only connection-cards-grid">
            {expertCards}
          </div>
          <ChampionMatchCarousel count={expertCards.length}>
            {expertCards}
          </ChampionMatchCarousel>
        </div>
      )}

      {championCards.length > 0 && (
        <>
          {expertCards.length > 0 && (
            <header className="recommended-experts-block__head recommended-experts-block__head--secondary">
              <p className="recommended-experts-block__kicker">Recommended connections</p>
            </header>
          )}
          <div className="champion-grid three-champions champion-grid--desktop-only connection-cards-grid">
            {championCards}
          </div>
          <ChampionMatchCarousel count={championCards.length}>
            {championCards}
          </ChampionMatchCarousel>
        </>
      )}
    </section>
  );
}
