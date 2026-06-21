import { collection, getDocs } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import {
  IBM_COMMUNITIES,
  mapFirestoreCommunityDoc,
  type IbmCommunity,
} from "@/data/ibmCommunities";
import { EXPERIENCE_EVENT_BASE } from "@/lib/experienceScoring";

export type IbmCommunityCatalogSource = "firestore" | "seed";

export interface IbmCommunityCatalogResult {
  communities: IbmCommunity[];
  source: IbmCommunityCatalogSource;
}

/** Load active communities from Firestore; fall back to bundled seed catalog. */
export async function loadIbmCommunityCatalog(): Promise<IbmCommunityCatalogResult> {
  const db = tryGetDb();
  if (!db) {
    return { communities: IBM_COMMUNITIES, source: "seed" };
  }

  try {
    const snap = await getDocs(collection(db, `${EXPERIENCE_EVENT_BASE}/communities`));
    if (snap.empty) {
      return { communities: IBM_COMMUNITIES, source: "seed" };
    }

    const mapped = snap.docs
      .map(d => mapFirestoreCommunityDoc({ id: d.id, ...d.data() }))
      .filter((c): c is IbmCommunity => c !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (mapped.length === 0) {
      return { communities: IBM_COMMUNITIES, source: "seed" };
    }

    return { communities: mapped, source: "firestore" };
  } catch {
    return { communities: IBM_COMMUNITIES, source: "seed" };
  }
}
