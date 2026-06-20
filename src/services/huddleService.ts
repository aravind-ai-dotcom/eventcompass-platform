import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import {
  TXC_EVENT_ID,
  huddleDocPath,
  huddleResponsesCollection,
  huddlesCollection,
} from "@/lib/compassEventPaths";
import { defaultTimezone, withComputedStatus } from "@/lib/huddleSchedule";
import type {
  CreateHuddleInput,
  HuddleDoc,
  HuddleResponseDoc,
  HuddleResponseType,
} from "@/types/huddleDataModel";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeHuddle(id: string, data: Record<string, unknown>): HuddleDoc {
  const huddle: HuddleDoc = {
    id,
    event_id: String(data.event_id ?? TXC_EVENT_ID),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    classification: (data.classification as HuddleDoc["classification"]) ?? "general",
    topics: Array.isArray(data.topics) ? (data.topics as string[]) : [],
    target_audience: (data.target_audience as HuddleDoc["target_audience"]) ?? {},
    host_participant_id: String(data.host_participant_id ?? ""),
    host_name: String(data.host_name ?? ""),
    date: String(data.date ?? ""),
    start_time: String(data.start_time ?? ""),
    end_time: String(data.end_time ?? ""),
    timezone: String(data.timezone ?? defaultTimezone()),
    location: String(data.location ?? ""),
    status: (data.status as HuddleDoc["status"]) ?? "scheduled",
    visibility: (data.visibility as HuddleDoc["visibility"]) ?? "matched",
    on_my_way_count: Number(data.on_my_way_count ?? 0),
    on_my_way_names: Array.isArray(data.on_my_way_names)
      ? (data.on_my_way_names as string[])
      : [],
    created_at: String(data.created_at ?? nowIso()),
    updated_at: String(data.updated_at ?? nowIso()),
    expires_at: String(data.expires_at ?? ""),
  };
  return withComputedStatus(huddle);
}

export async function fetchActiveHuddles(max = 50): Promise<HuddleDoc[]> {
  const db = tryGetDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, huddlesCollection()),
      orderBy("created_at", "desc"),
      firestoreLimit(max),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => normalizeHuddle(d.id, d.data()))
      .filter(h => h.status !== "expired" && h.status !== "cancelled");
  } catch (err) {
    console.warn("[huddles] fetch failed", err);
    return [];
  }
}

export async function createHuddle(input: CreateHuddleInput): Promise<HuddleDoc> {
  const db = tryGetDb();
  if (!db) throw new Error("Firebase not configured");

  const id = `huddle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ts = nowIso();
  const endIso = new Date(`${input.date}T${input.end_time}:00`).toISOString();

  const record: Omit<HuddleDoc, "id"> & { id: string } = {
    id,
    event_id: TXC_EVENT_ID,
    title: input.title.trim(),
    description: input.description.trim(),
    classification: input.classification,
    topics: input.topics.filter(Boolean),
    target_audience: input.target_audience,
    host_participant_id: input.host_participant_id,
    host_name: input.host_name,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    timezone: input.timezone ?? defaultTimezone(),
    location: input.location.trim(),
    status: "scheduled",
    visibility: input.visibility ?? "matched",
    on_my_way_count: 0,
    on_my_way_names: [],
    created_at: ts,
    updated_at: ts,
    expires_at: endIso,
  };

  await setDoc(doc(db, huddleDocPath(id)), record);
  return withComputedStatus({ ...record });
}

export async function cancelHuddle(huddleId: string, hostParticipantId: string): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  const ref = doc(db, huddleDocPath(huddleId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  if (String(data.host_participant_id) !== hostParticipantId) return;

  await updateDoc(ref, {
    status: "cancelled",
    updated_at: nowIso(),
  });
}

export async function fetchUserHuddleResponses(
  participantId: string,
  huddleIds: string[],
): Promise<Record<string, HuddleResponseType>> {
  const db = tryGetDb();
  if (!db || huddleIds.length === 0) return {};

  const out: Record<string, HuddleResponseType> = {};
  await Promise.all(
    huddleIds.map(async (huddleId) => {
      try {
        const ref = doc(db, huddleResponsesCollection(huddleId), participantId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const r = snap.data().response as HuddleResponseType;
          if (r) out[huddleId] = r;
        }
      } catch {
        /* skip */
      }
    }),
  );
  return out;
}

export async function setHuddleResponse(
  huddleId: string,
  participantId: string,
  displayName: string,
  response: HuddleResponseType,
  previousResponse?: HuddleResponseType,
): Promise<void> {
  const db = tryGetDb();
  if (!db) throw new Error("Firebase not configured");

  const ts = nowIso();
  const responseDoc: HuddleResponseDoc = {
    participant_id: participantId,
    display_name: displayName,
    response,
    created_at: ts,
    updated_at: ts,
  };

  await setDoc(
    doc(db, huddleResponsesCollection(huddleId), participantId),
    responseDoc,
    { merge: true },
  );

  const huddleRef = doc(db, huddleDocPath(huddleId));
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  if (response === "on_my_way" && previousResponse !== "on_my_way") {
    await updateDoc(huddleRef, {
      on_my_way_count: increment(1),
      on_my_way_names: arrayUnion(firstName),
      updated_at: ts,
    });
  } else if (response !== "on_my_way" && previousResponse === "on_my_way") {
    await updateDoc(huddleRef, {
      on_my_way_count: increment(-1),
      on_my_way_names: arrayRemove(firstName),
      updated_at: ts,
    });
  }
}

export async function fetchHuddleResponsesForDisplay(
  huddleId: string,
): Promise<HuddleResponseDoc[]> {
  const db = tryGetDb();
  if (!db) return [];

  try {
    const snap = await getDocs(collection(db, huddleResponsesCollection(huddleId)));
    return snap.docs
      .map(d => d.data() as HuddleResponseDoc)
      .filter(r => r.response === "on_my_way");
  } catch {
    return [];
  }
}
