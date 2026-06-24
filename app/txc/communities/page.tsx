// =============================================================================
// EventCompass — Communities  /txc/communities
// Connect attendee interests to persistent community destinations.
// =============================================================================

import Link from "next/link";
import IbmCommunityBrowser from "@/components/communities/IbmCommunityBrowser";
import {
  ForgeCatalogIcon,
  ForgeMembersIcon,
  ForgeUserGroupsIcon,
} from "@/components/icons/ForgeIcons";
import { IBM_COMMUNITIES, IBM_COMMUNITY_METRICS } from "@/data/ibmCommunities";
import { FORGE_EVENT, FORGE_LABELS, FORGE_PRODUCT } from "@/config/forgeBrand";

const COMMUNITY_METRICS = [
  { value: IBM_COMMUNITY_METRICS.members, label: "Members", Icon: ForgeMembersIcon, accent: "members" },
  { value: String(IBM_COMMUNITIES.length), label: "In catalog", Icon: ForgeCatalogIcon, accent: "catalog" },
  { value: IBM_COMMUNITY_METRICS.userGroups, label: "User groups", Icon: ForgeUserGroupsIcon, accent: "groups" },
] as const;

export default function CommunitiesPage() {
  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">{FORGE_LABELS.communities}</div>
        <h1>IBM Community at TechXchange.</h1>
        <p>
          Topic groups, user groups, and Champions programs — the persistent home for learning
          and networking. Compass connects your interests to the right IBM Community destinations.
        </p>
      </section>

      <section className="section no-top-border">
        <div className="ibm-community-metrics" aria-label="Community scale">
          {COMMUNITY_METRICS.map(({ value, label, Icon, accent }) => (
            <article key={label}>
              <span className={`ibm-community-metrics__icon ibm-community-metrics__icon--${accent}`}>
                <Icon size={24} />
              </span>
              <b>{value}</b>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section no-top-border">
        <div className="section-head narrow">
          <div>
            <div className="section-kicker">Destinations</div>
            <h2>Topic groups, user groups, and programs.</h2>
          </div>
          <p>
            Communities are part of IBM Community — not a separate Compass network.
            Live Huddles on {FORGE_PRODUCT.myJourney} are for in-the-moment {FORGE_EVENT.shortName} conversations;
            IBM Community is where knowledge sharing continues year-round.
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
