// =============================================================================
// EventCompass — IBM Community  /txc/communities
// Connect attendee interests to official IBM Community destinations.
// =============================================================================

import Link from "next/link";
import { IBM_COMMUNITIES, IBM_COMMUNITY_METRICS } from "@/data/ibmCommunities";
import IbmCommunityCard from "@/components/communities/IbmCommunityCard";

const FEATURED_IDS = new Set([
  "global-ai-data-science",
  "ibm-community-hub",
  "global-business-analytics",
  "ibm-champions",
  "user-groups",
]);

const featuredCommunities = IBM_COMMUNITIES.filter(c => FEATURED_IDS.has(c.community_id));

export default function CommunitiesPage() {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">IBM Community</div>
        <h1>IBM Community</h1>
        <p>
          Continue the conversation with IBM topic groups, user groups, Champions, and peers beyond TechXchange.
        </p>
      </section>

      <section className="section no-top-border">
        <div className="ibm-community-metrics" aria-label="IBM Community scale">
          <article>
            <b>{IBM_COMMUNITY_METRICS.members}</b>
            <span>members</span>
          </article>
          <article>
            <b>{IBM_COMMUNITY_METRICS.topicGroups}</b>
            <span>topic groups</span>
          </article>
          <article>
            <b>{IBM_COMMUNITY_METRICS.userGroups}</b>
            <span>user groups</span>
          </article>
        </div>
      </section>

      <section className="section no-top-border">
        <div className="section-head narrow">
          <div>
            <div className="section-kicker">Destinations</div>
            <h2>Topic groups, user groups, and programs.</h2>
          </div>
          <p>
            IBM Community is the persistent home for learning and peer connection after the event.
            Live Huddles on My Compass are for in-the-moment TechXchange conversations — IBM Communities are where the conversation continues.
          </p>
        </div>

        <div className="ibm-community-grid">
          {featuredCommunities.map(community => (
            <IbmCommunityCard key={community.community_id} community={community} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head narrow">
          <div>
            <div className="section-kicker">Personalized</div>
            <h2>Recommended on My Compass.</h2>
          </div>
          <p>
            When your tracks and topic interests overlap IBM Community groups, Compass surfaces recommended destinations in the IBM Community section of My Experience — never mixed with live Huddles.
          </p>
        </div>
        <Link href="/txc/experience" className="action-chip">
          Open My Compass →
        </Link>
      </section>

      <section className="final-band">
        <div>
          <h2>Keep learning after TechXchange.</h2>
          <p>
            Join IBM topic groups and user groups to stay connected with practitioners, Champions, and IBM experts year-round.
          </p>
        </div>
        <a
          href="https://community.ibm.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Visit IBM Community →
        </a>
      </section>
    </>
  );
}
