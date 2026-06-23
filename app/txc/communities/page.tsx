// =============================================================================
// EventCompass — Communities  /txc/communities
// Connect attendee interests to persistent community destinations.
// =============================================================================

import Link from "next/link";
import IbmCommunityBrowser from "@/components/communities/IbmCommunityBrowser";
import { IBM_COMMUNITIES, IBM_COMMUNITY_METRICS } from "@/data/ibmCommunities";
import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";

export default function CommunitiesPage() {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">{FORGE_LABELS.communities}</div>
        <h1>Communities that endure.</h1>
        <p>
          Browse {IBM_COMMUNITIES.length} {FORGE_EVENT.name} communities — filter by category and keyword to find your people.
          The conversation continues long after the week ends.
        </p>
      </section>

      <section className="section no-top-border">
        <div className="ibm-community-metrics" aria-label="Community scale">
          <article>
            <b>{IBM_COMMUNITY_METRICS.members}</b>
            <span>members</span>
          </article>
          <article>
            <b>{IBM_COMMUNITIES.length}</b>
            <span>in catalog</span>
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
            Communities are the persistent home for learning and peer connection after the event.
            Live Huddles on {FORGE_PRODUCT.myJourney} are for in-the-moment {FORGE_EVENT.name} conversations — communities are where the conversation continues.
          </p>
        </div>

        <IbmCommunityBrowser communities={IBM_COMMUNITIES} />
      </section>

      <section className="section">
        <div className="section-head narrow">
          <div>
            <div className="section-kicker">Personalized</div>
            <h2>Recommended on {FORGE_PRODUCT.myJourney}.</h2>
          </div>
          <p>
            When your tracks and topic interests overlap community groups, Compass surfaces recommended destinations in the Communities section of My Experience — never mixed with live Huddles.
          </p>
        </div>
        <Link href="/txc/experience" className="action-chip">
          Open {FORGE_PRODUCT.myJourney} →
        </Link>
      </section>

      <section className="final-band">
        <div>
          <h2>Keep learning after {FORGE_EVENT.name}.</h2>
          <p>
            Join topic groups and user groups to stay connected with practitioners, {FORGE_LABELS.guides.toLowerCase()}, and experts year-round.
          </p>
        </div>
        <Link href="/txc/communities" className="btn-primary">
          Explore {FORGE_LABELS.communities} →
        </Link>
      </section>
    </>
  );
}
