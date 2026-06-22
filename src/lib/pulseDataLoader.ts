import { collection, getDocs } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import {
  accumulateEducation,
  accumulatePastEmployers,
  accumulateParticipantTrendingTopics,
  incPublicCommunity,
  incPublicSignal,
  isInternalParticipant,
  participantNetworkingIdentity,
} from "@/lib/roomSignals";
import { isOpenToAlumniConnections, isOpenToMentoringConversations } from "@/lib/networkingIdentity";
import { aggregateIdentitySignals } from "@/lib/identitySignals";
import { PULSE_AUDIENCE_SEED, type PulseAudienceData } from "@/lib/pulseAudienceSeed";

const BASE = "organizations/ibm/events/txc2026";
type RawDoc = Record<string, unknown>;

export type PulseDataSource = "live" | "aggregated";

export interface PulseLoadResult {
  data: PulseAudienceData;
  source: PulseDataSource;
}

function aggregateParticipants(docs: RawDoc[]): PulseAudienceData {
  let audienceTotal = 0;
  const trendingTopics: Record<string, number> = {};
  const topCountries: Record<string, number> = {};
  const topUniversities: Record<string, number> = {};
  const topPastEmployers: Record<string, number> = {};
  const communities: Record<string, number> = {};
  let openToAlumni = 0;
  let openToColleague = 0;
  let openToCareer = 0;
  let openToMentoring = 0;

  for (const p of docs) {
    if (!isInternalParticipant(p)) audienceTotal++;
    accumulateParticipantTrendingTopics(trendingTopics, p);
    incPublicSignal(topCountries, String(p.country ?? ""));
    accumulateEducation(topUniversities, p.education);
    accumulatePastEmployers(topPastEmployers, p.past_employers);
    for (const c of (p.community as string[] | undefined) ?? []) incPublicCommunity(communities, c);
    const ni = participantNetworkingIdentity(p);
    if (isOpenToAlumniConnections(ni)) openToAlumni++;
    if (ni.open_to_past_colleague_connections) openToColleague++;
    if (ni.open_to_career_conversations) openToCareer++;
    if (isOpenToMentoringConversations(p)) openToMentoring++;
  }

  return {
    audienceTotal,
    trendingTopics,
    topCountries,
    topUniversities,
    topPastEmployers,
    communities,
    openToAlumni,
    openToColleague,
    openToCareer,
    openToMentoring,
    identity: aggregateIdentitySignals(docs),
  };
}

function isPermissionDenied(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? "";
  return code === "permission-denied" || code === "PERMISSION_DENIED";
}

export async function loadPulseAudience(isSignedIn: boolean): Promise<PulseLoadResult> {
  const db = tryGetDb();
  if (!db || !isSignedIn) {
    return { data: PULSE_AUDIENCE_SEED, source: "aggregated" };
  }

  try {
    const snap = await getDocs(collection(db, `${BASE}/participants`));
    const docs = snap.docs.map(d => d.data() as RawDoc);
    if (docs.length === 0) {
      return { data: PULSE_AUDIENCE_SEED, source: "aggregated" };
    }
    return { data: aggregateParticipants(docs), source: "live" };
  } catch (err) {
    if (isPermissionDenied(err)) {
      return { data: PULSE_AUDIENCE_SEED, source: "aggregated" };
    }
    console.warn("[Pulse] load failed; using aggregated seed", err);
    return { data: PULSE_AUDIENCE_SEED, source: "aggregated" };
  }
}
