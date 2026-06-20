import { doc, getDoc, setDoc } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import { TXC_EVENT_ID, eventBasePath } from "@/lib/compassEventPaths";
import type { HuddleClassification } from "@/types/huddleDataModel";

export interface HuddlePreferences {
  hidden_huddle_ids: string[];
  muted_classifications: HuddleClassification[];
  reported_huddle_ids: string[];
}

const EMPTY: HuddlePreferences = {
  hidden_huddle_ids: [],
  muted_classifications: [],
  reported_huddle_ids: [],
};

function participantPath(uid: string): string {
  return `${eventBasePath(TXC_EVENT_ID)}/participants/${uid}`;
}

export function normalizeHuddlePreferences(raw: unknown): HuddlePreferences {
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const o = raw as Record<string, unknown>;
  return {
    hidden_huddle_ids: Array.isArray(o.hidden_huddle_ids)
      ? (o.hidden_huddle_ids as string[])
      : [],
    muted_classifications: Array.isArray(o.muted_classifications)
      ? (o.muted_classifications as HuddleClassification[])
      : [],
    reported_huddle_ids: Array.isArray(o.reported_huddle_ids)
      ? (o.reported_huddle_ids as string[])
      : [],
  };
}

export async function loadHuddlePreferences(uid: string): Promise<HuddlePreferences> {
  const db = tryGetDb();
  if (!db) return { ...EMPTY };

  try {
    const snap = await getDoc(doc(db, participantPath(uid)));
    if (!snap.exists()) return { ...EMPTY };
    return normalizeHuddlePreferences(snap.data().huddle_preferences);
  } catch {
    return { ...EMPTY };
  }
}

async function savePreferences(uid: string, prefs: HuddlePreferences): Promise<void> {
  const db = tryGetDb();
  if (!db) return;
  await setDoc(
    doc(db, participantPath(uid)),
    { huddle_preferences: prefs },
    { merge: true },
  );
}

export async function hideHuddle(uid: string, huddleId: string): Promise<HuddlePreferences> {
  const prefs = await loadHuddlePreferences(uid);
  if (!prefs.hidden_huddle_ids.includes(huddleId)) {
    prefs.hidden_huddle_ids.push(huddleId);
  }
  await savePreferences(uid, prefs);
  return prefs;
}

export async function notForMeHuddle(
  uid: string,
  huddleId: string,
  classification: HuddleClassification,
): Promise<HuddlePreferences> {
  const prefs = await loadHuddlePreferences(uid);
  if (!prefs.hidden_huddle_ids.includes(huddleId)) {
    prefs.hidden_huddle_ids.push(huddleId);
  }
  if (!prefs.muted_classifications.includes(classification)) {
    prefs.muted_classifications.push(classification);
  }
  await savePreferences(uid, prefs);
  return prefs;
}

export async function reportHuddle(uid: string, huddleId: string): Promise<HuddlePreferences> {
  const prefs = await loadHuddlePreferences(uid);
  if (!prefs.reported_huddle_ids.includes(huddleId)) {
    prefs.reported_huddle_ids.push(huddleId);
  }
  if (!prefs.hidden_huddle_ids.includes(huddleId)) {
    prefs.hidden_huddle_ids.push(huddleId);
  }
  await savePreferences(uid, prefs);
  return prefs;
}
