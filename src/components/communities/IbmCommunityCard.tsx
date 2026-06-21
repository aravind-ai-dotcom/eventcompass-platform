import type { IbmCommunity } from "@/data/ibmCommunities";
import { formatMemberCount } from "@/lib/ibmCommunityMatching";

interface Props {
  community: IbmCommunity;
  matchReasons?: string[];
}

export default function IbmCommunityCard({ community, matchReasons }: Props) {
  const members = formatMemberCount(community.member_count);

  return (
    <article className="ibm-community-card">
      <div className="ibm-community-card__meta">
        <span className="ibm-community-card__type">{community.type}</span>
        {members && <span className="ibm-community-card__stat">{members}</span>}
      </div>
      <h3 className="ibm-community-card__name">{community.name}</h3>
      <p className="ibm-community-card__desc">{community.description}</p>
      {community.topics.length > 0 && (
        <div className="ibm-community-card__topics" aria-label="Topics">
          {community.topics.slice(0, 5).map(topic => (
            <span key={topic} className="ibm-community-card__topic">{topic}</span>
          ))}
        </div>
      )}
      {matchReasons && matchReasons.length > 0 && (
        <p className="ibm-community-card__match">
          Matched on {matchReasons.slice(0, 2).join(" · ")}
        </p>
      )}
      <a
        href={community.url}
        target="_blank"
        rel="noopener noreferrer"
        className="action-chip ibm-community-card__cta"
      >
        Visit Community →
      </a>
    </article>
  );
}
