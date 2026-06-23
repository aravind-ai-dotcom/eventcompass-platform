"use client";

import RecommendedConnectionCard, {
  type RecommendedPerson,
} from "@/components/people/RecommendedConnectionCard";
import { FORGE_EVENT } from "@/config/forgeBrand";

export interface TrackedConnection {
  person: RecommendedPerson;
  mutual?: boolean;
}

interface PeopleTrackingSectionProps {
  tracked: TrackedConnection[];
  profileSignals?: string[];
  onShowDetails?: (personId: string) => void;
  onSave: (id: string) => void;
  savedPeople: string[];
  embedded?: boolean;
}

export default function PeopleTrackingSection({
  tracked,
  profileSignals = [],
  onShowDetails,
  onSave,
  savedPeople,
  embedded = false,
}: PeopleTrackingSectionProps) {
  if (tracked.length === 0) return null;

  return (
    <section className={embedded ? "compass-module-block people-tracking-section" : "section people-tracking-section"}>
      <div className="section-head narrow">
        <div>
          <div className="section-kicker">People I&apos;m tracking</div>
          <h2>Connections you want to follow up with.</h2>
        </div>
        <p className="section-head-note">
          Track people you meet or want to reconnect with during {FORGE_EVENT.name}.
        </p>
      </div>

      <div className="champion-grid three-champions connection-cards-grid">
        {tracked.map(({ person, mutual }) => (
          <RecommendedConnectionCard
            key={person.id}
            person={person}
            profileSignals={profileSignals}
            badgeContext={{ isChampion: true }}
            mutual={mutual}
            compact
            actions={{
              savedPeople,
              hiddenPeople: [],
              onSave,
              onHide: () => {},
              onDetails: onShowDetails,
            }}
          />
        ))}
      </div>
    </section>
  );
}
