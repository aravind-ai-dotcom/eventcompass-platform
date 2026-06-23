import type { IbmCommunity } from "@/data/ibmCommunities";
import { formatMemberCount } from "@/lib/ibmCommunityMatching";
import { buildCommunityMatchReasons } from "@/lib/communityIntelligence";

interface Props {
  community: IbmCommunity;
  matchReasons?: string[];
  /** Compact card for Focus mode — matches event moment tiles. */
  compact?: boolean;
}

function CommunityReasonsList({ reasons, compact }: { reasons: string[]; compact?: boolean }) {
  const lines = buildCommunityMatchReasons(reasons);
  if (lines.length === 0) return null;

  return (
    <div className={`community-intel${compact ? " community-intel--compact" : ""}`}>
      <p className="community-intel__kicker">Why Recommended</p>
      <ul className="community-intel__reasons">
        {lines.slice(0, 4).map(reason => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}

export default function IbmCommunityCard({ community, matchReasons, compact = false }: Props) {
  const members = formatMemberCount(community.member_count);

  if (compact) {
    return (
      <article className="opportunity-card focus-moment-card ibm-community-card--focus">
        <div className="card-meta">
          <span>{community.type}</span>
          {members ? <span>{members}</span> : <span>Community</span>}
        </div>
        <h3>{community.name}</h3>
        {matchReasons && matchReasons.length > 0 && (
          <CommunityReasonsList reasons={matchReasons} compact />
        )}
        <p>{community.description}</p>
        <div className="focus-session-card__actions">
          <a
            href={community.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-chip action-chip--quiet"
          >
            Visit Community →
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="ibm-community-card">
      <div className="ibm-community-card__meta">
        <span className="ibm-community-card__type">{community.category}</span>
        <span className="ibm-community-card__stat">{community.primary_product}</span>
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
        <CommunityReasonsList reasons={matchReasons} />
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
