"use client";

import { useMemo } from "react";
import CompassModuleHead from "@/components/experience/CompassModuleHead";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";
import { recommendIbmCommunities } from "@/lib/ibmCommunityMatching";

interface Props {
  tracks?: string[];
  topics?: string[];
  goals?: string[];
  products?: string[];
  limit?: number;
  embedded?: boolean;
}

export default function RecommendedIbmCommunities({
  tracks = [],
  topics = [],
  goals = [],
  products = [],
  limit = 3,
  embedded = false,
}: Props) {
  const recommendations = useMemo(
    () => recommendIbmCommunities({ tracks, topics, goals, products, limit }),
    [tracks, topics, goals, products, limit],
  );

  const hasPersonalMatch = recommendations.some(r => r.matchScore > 0);

  return (
    <section className={embedded ? "compass-module-block" : "section no-top-border"}>
      <CompassModuleHead
        kicker="Recommended IBM Communities"
        title={hasPersonalMatch ? "Groups aligned with your interests." : "Explore IBM Community destinations."}
        description={
          hasPersonalMatch
            ? "Persistent IBM topic groups and user groups — separate from live event Huddles."
            : "Join IBM topic groups, user groups, and programs that continue beyond TechXchange."
        }
      />
      <div className="ibm-community-grid">
        {recommendations.map(community => (
          <IbmCommunityCard
            key={community.community_id}
            community={community}
            matchReasons={community.matchScore > 0 ? community.matchReasons : undefined}
          />
        ))}
      </div>
    </section>
  );
}
