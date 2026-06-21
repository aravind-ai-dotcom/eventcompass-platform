/** Why Firestore returned no live huddles (diagnostic for QA / dev). */
export type HuddleFetchDiagnostic =
  | "live"
  | "sample"
  | "permission-fallback"
  | "firebase-disabled"
  | "empty-collection";

/** What the attendee sees in the Conversations section. */
export type HuddleDisplayMode = "live" | "demo";

export interface HuddleModeCopy {
  label: string;
  hint: string;
}

export const HUDDLE_MODE_COPY: Record<HuddleDisplayMode, HuddleModeCopy> = {
  demo: {
    label: "Demo huddles",
    hint: "Showing sample invitations. Start a conversation to create a live Firestore huddle.",
  },
  live: {
    label: "Live huddles",
    hint: "Showing active invitations from Firestore.",
  },
};

export function huddleDisplayMode(activeFirestoreCount: number): HuddleDisplayMode {
  return activeFirestoreCount > 0 ? "live" : "demo";
}

/** Dev-only status line — maps empty collection to sample when UI shows demo cards. */
export function huddleDevSourceLabel(
  displayMode: HuddleDisplayMode,
  fetchDiagnostic: HuddleFetchDiagnostic,
): string {
  if (displayMode === "live") return "live";
  if (fetchDiagnostic === "firebase-disabled") return "firebase-disabled";
  if (fetchDiagnostic === "permission-fallback") return "permission-fallback";
  if (fetchDiagnostic === "empty-collection") return "sample";
  return "sample";
}
