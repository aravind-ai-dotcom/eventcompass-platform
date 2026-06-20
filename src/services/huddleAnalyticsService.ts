import { collection, doc, setDoc } from "firebase/firestore";
import { tryGetDb } from "@/lib/firebase";
import { TXC_EVENT_ID, eventBasePath } from "@/lib/compassEventPaths";
import type { HuddleClassification } from "@/types/huddleDataModel";

export type HuddleAnalyticsEventType =
  | "view"
  | "match"
  | "on_my_way"
  | "not_for_me"
  | "hide"
  | "report"
  | "create"
  | "cancel"
  | "extend"
  | "duplicate";

export interface HuddleAnalyticsEvent {
  id: string;
  event_type: HuddleAnalyticsEventType;
  huddle_id: string;
  classification?: HuddleClassification;
  participant_id?: string;
  university?: string;
  employer?: string;
  certification?: string;
  topic?: string;
  created_at: string;
}

function analyticsCollection(): string {
  return `${eventBasePath(TXC_EVENT_ID)}/huddleAnalytics`;
}

export async function logHuddleAnalytics(
  event: Omit<HuddleAnalyticsEvent, "id" | "created_at">,
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  const id = `ha-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: HuddleAnalyticsEvent = {
    ...event,
    id,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, analyticsCollection(), id), record);
  } catch (err) {
    console.warn("[huddle-analytics]", err);
  }
}
