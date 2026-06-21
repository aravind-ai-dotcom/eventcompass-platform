/** Demo/runtime LinkedIn visibility — respects consent; fills gaps when URLs are missing. */

export type LinkedInVisibility = "visible" | "consent_blocked" | "none";

export interface PersonLinkedInFields {
  id: string;
  display_name?: string;
  linkedin_url?: string;
  consent?: {
    show_linkedin?: boolean;
    public_profile?: boolean;
  };
}

export interface LinkedInEnrichmentResult {
  linkedin_url?: string;
  consent?: PersonLinkedInFields["consent"];
  linkedinVisibility: LinkedInVisibility;
}

function hashBucket(id: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i)) % buckets;
  }
  return h;
}

function slugFromPerson(id: string, displayName?: string): string {
  const fromName = (displayName ?? "attendee")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = id.replace(/[^a-z0-9]/gi, "").slice(-5).toLowerCase() || "txc";
  return `${fromName || "attendee"}-${suffix}`;
}

/**
 * Resolve LinkedIn link for display:
 * - visible: URL + consent to show
 * - consent_blocked: has profile but attendee opted out of sharing
 * - none: no URL or fully private — omit from UI
 */
export function enrichLinkedInForPerson(person: PersonLinkedInFields): LinkedInEnrichmentResult {
  const existingUrl = person.linkedin_url?.trim();
  const consent = person.consent ?? {};
  const publicProfile = consent.public_profile !== false;

  if (existingUrl) {
    if (!publicProfile) {
      return { linkedin_url: undefined, consent, linkedinVisibility: "none" };
    }
    if (consent.show_linkedin === false) {
      return { linkedin_url: existingUrl, consent, linkedinVisibility: "consent_blocked" };
    }
    return { linkedin_url: existingUrl, consent, linkedinVisibility: "visible" };
  }

  const bucket = hashBucket(person.id, 10);
  if (bucket <= 1) {
    return { linkedin_url: undefined, consent, linkedinVisibility: "none" };
  }

  const dummyUrl = `https://www.linkedin.com/in/${slugFromPerson(person.id, person.display_name)}`;

  if (bucket <= 4) {
    return {
      linkedin_url: dummyUrl,
      consent: { ...consent, show_linkedin: false },
      linkedinVisibility: "consent_blocked",
    };
  }

  return {
    linkedin_url: dummyUrl,
    consent: { ...consent, show_linkedin: true },
    linkedinVisibility: "visible",
  };
}
