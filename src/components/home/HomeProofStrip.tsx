"use client";

import HomeJourneyTile from "@/components/home/HomeJourneyTile";
import {
  ForgeCommunitiesIcon,
  ForgeGuidesIcon,
  ForgeSessionsIcon,
} from "@/components/icons/ForgeIcons";
import { alumniDonutSegments } from "@/components/pulse/PulseDonutBox";
import { FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";
import { IBM_COMMUNITY_METRICS } from "@/data/ibmCommunities";
import { proofCountLabel, useEventProofCounts } from "@/hooks/useEventProofCounts";

function statDisplay(
  key: "sessions" | "champions" | "communities",
  counts: ReturnType<typeof useEventProofCounts>,
): string {
  if (key === "communities") {
    if (counts.isLive && counts.communities > 0) return counts.communities.toLocaleString();
    return IBM_COMMUNITY_METRICS.topicGroups;
  }
  return proofCountLabel(counts[key], counts.isLive);
}

const STATS = [
  { key: "sessions" as const, label: "Sessions", Icon: ForgeSessionsIcon, accent: "sessions" },
  { key: "champions" as const, label: FORGE_LABELS.expertGuides, Icon: ForgeGuidesIcon, accent: "guides" },
  { key: "communities" as const, label: FORGE_LABELS.communities, Icon: ForgeCommunitiesIcon, accent: "communities" },
] as const;

function homeJourneySegments(returning: number | null, firstTime: number | null) {
  if (returning == null || firstTime == null || returning <= 0 || firstTime <= 0) return null;
  return alumniDonutSegments(returning, firstTime).map(segment => ({
    ...segment,
    label:
      segment.label === "Returning Attendees"
        ? "Returning"
        : segment.label === "First-Time Attendees"
          ? "First-time"
          : segment.label,
  }));
}

export default function HomeProofStrip() {
  const counts = useEventProofCounts();
  const alumniSegments = homeJourneySegments(counts.alumniReturning, counts.alumniFirstTime);

  const showJourney = alumniSegments != null && alumniSegments.length > 0;

  return (
    <section className="home-proof-strip" aria-label="TechXchange scale">
      <ul className={`home-proof-strip__list${showJourney ? " home-proof-strip__list--with-journey" : ""}`}>
        {STATS.map(({ key, label, Icon, accent }) => (
          <li key={key} className="home-proof-strip__item">
            <span className={`home-proof-strip__icon home-proof-strip__icon--${accent}`}>
              <Icon size={24} />
            </span>
            <span className="home-proof-strip__value" aria-busy={counts.loading}>
              {statDisplay(key, counts)}
            </span>
            <span className="home-proof-strip__label">{label}</span>
          </li>
        ))}

        {showJourney && (
          <li className="home-proof-strip__item home-proof-strip__item--journey" aria-busy={counts.loading}>
            <HomeJourneyTile segments={alumniSegments} title={FORGE_PRODUCT.forgeJourney} />
          </li>
        )}
      </ul>
    </section>
  );
}
