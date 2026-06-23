"use client";

import { useMemo } from "react";
import CompassModuleHead from "@/components/experience/CompassModuleHead";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";
import { recommendIbmCommunities } from "@/lib/ibmCommunityMatching";
import type { IbmCommunity } from "@/data/ibmCommunities";
import { FORGE_EVENT, FORGE_LABELS } from "@/config/forgeBrand";

interface Props {
  tracks?: string[];
  topics?: string[];
  goals?: string[];
  products?: string[];
  roles?: string[];
  intentKeywords?: string[];
  catalog?: IbmCommunity[];
  limit?: number;
  embedded?: boolean;
}

export default function RecommendedIbmCommunities({
  tracks = [],
  topics = [],
  goals = [],
  products = [],
  roles = [],
  intentKeywords = [],
  catalog,
  limit = 3,
  embedded = false,
}: Props) {
  const recommendations = useMemo(
    () => recommendIbmCommunities({
      tracks,
      topics,
      goals,
      products,
      roles,
      intentKeywords,
      catalog,
      limit,
    }),
    [tracks, topics, goals, products, roles, intentKeywords, catalog, limit],
  );

  const hasPersonalMatch = recommendations.some(r => r.matchScore > 0);

  return (
    <section className={embedded ? "compass-module-block" : "section no-top-border"}>
      <CompassModuleHead
        kicker={`Recommended ${FORGE_LABELS.communities}`}
        title={hasPersonalMatch ? "Groups aligned with your interests." : "Explore community destinations."}
        description={
          hasPersonalMatch
            ? "Persistent topic groups and user groups — separate from live event Huddles."
            : `Join communities and programs that continue beyond ${FORGE_EVENT.name}.`
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
