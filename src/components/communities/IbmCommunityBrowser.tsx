"use client";

import { useMemo, useState } from "react";
import type { IbmCommunity } from "@/data/ibmCommunities";
import {
  buildCommunityFilterFacets,
  filterIbmCommunities,
} from "@/lib/ibmCommunityFilter";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";

interface Props {
  communities: IbmCommunity[];
}

export default function IbmCommunityBrowser({ communities }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  const facets = useMemo(
    () => buildCommunityFilterFacets(communities),
    [communities],
  );

  const filtered = useMemo(
    () => filterIbmCommunities(communities, category, keywords),
    [communities, category, keywords],
  );

  const toggleKeyword = (kw: string) => {
    setKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw],
    );
  };

  const clearFilters = () => {
    setCategory(null);
    setKeywords([]);
  };

  const hasFilters = category !== null || keywords.length > 0;

  return (
    <div className="ibm-community-browser">
      <div className="ibm-community-filters">
        <div className="ibm-community-filters__group">
          <p className="ibm-community-filters__label">Category</p>
          <div className="ibm-community-filters__chips" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`ibm-community-filter-chip${category === null ? " is-active" : ""}`}
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
            >
              All
            </button>
            {facets.categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`ibm-community-filter-chip${category === cat ? " is-active" : ""}`}
                aria-pressed={category === cat}
                onClick={() => setCategory(prev => (prev === cat ? null : cat))}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="ibm-community-filters__group">
          <p className="ibm-community-filters__label">Keywords</p>
          <div className="ibm-community-filters__chips" role="group" aria-label="Filter by keyword">
            {facets.keywords.map(kw => (
              <button
                key={kw}
                type="button"
                className={`ibm-community-filter-chip ibm-community-filter-chip--keyword${keywords.includes(kw) ? " is-active" : ""}`}
                aria-pressed={keywords.includes(kw)}
                onClick={() => toggleKeyword(kw)}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        <div className="ibm-community-filters__status">
          <p className="ibm-community-filters__count">
            Showing {filtered.length} of {communities.length} communities
          </p>
          {hasFilters && (
            <button type="button" className="ibm-community-filters__clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="ibm-community-grid">
          {filtered.map(community => (
            <IbmCommunityCard key={community.community_id} community={community} />
          ))}
        </div>
      ) : (
        <p className="ibm-community-filters__empty">
          No communities match these filters. Try removing a keyword or choosing a different category.
        </p>
      )}
    </div>
  );
}
