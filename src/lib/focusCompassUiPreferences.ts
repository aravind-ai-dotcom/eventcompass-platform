// Focus Compass — block visibility (localStorage)

import type { FocusCompassGroupId } from "@/lib/focusCompassPreferences";

export const FOCUS_COMPASS_BLOCK_IDS = [
  "next_best_move",
  "live_huddles",
  "learning_plan",
  "event_moments",
  "certifications",
  "people_to_meet",
  "ibm_communities",
] as const;

export type FocusCompassBlockId = (typeof FOCUS_COMPASS_BLOCK_IDS)[number];

export interface FocusCustomizeGroup {
  id: FocusCompassGroupId;
  label: string;
  blocks: Array<{ id: FocusCompassBlockId; label: string }>;
}

/** Customize panel groups — order matches Focus page; Voice Compass is always on. */
export const FOCUS_CUSTOMIZE_GROUPS: FocusCustomizeGroup[] = [
  {
    id: "today",
    label: "Today",
    blocks: [{ id: "next_best_move", label: "Next best move" }],
  },
  {
    id: "conversations",
    label: "Live",
    blocks: [{ id: "live_huddles", label: "Conversations around you" }],
  },
  {
    id: "learning",
    label: "My Learning",
    blocks: [{ id: "learning_plan", label: "Your learning plan" }],
  },
  {
    id: "moments",
    label: "Don't Miss These Moments",
    blocks: [{ id: "event_moments", label: "Event highlights" }],
  },
  {
    id: "people",
    label: "People To Meet",
    blocks: [{ id: "people_to_meet", label: "People recommendations" }],
  },
  {
    id: "certifications",
    label: "Working Toward a Certification",
    blocks: [{ id: "certifications", label: "Certification journey" }],
  },
  {
    id: "community",
    label: "Recommended IBM Communities",
    blocks: [{ id: "ibm_communities", label: "Community recommendations" }],
  },
];

export const FOCUS_BLOCK_TO_GROUP: Record<FocusCompassBlockId, FocusCompassGroupId> = {
  next_best_move: "today",
  live_huddles: "conversations",
  learning_plan: "learning",
  event_moments: "moments",
  certifications: "certifications",
  people_to_meet: "people",
  ibm_communities: "community",
};

export interface FocusCompassUiPreferences {
  blocks: Record<FocusCompassBlockId, boolean>;
}

export const FOCUS_COMPASS_UI_STORAGE_KEY = "focus_compass_ui_preferences";

function defaultBlocks(): Record<FocusCompassBlockId, boolean> {
  return {
    next_best_move: true,
    live_huddles: true,
    learning_plan: true,
    event_moments: true,
    certifications: true,
    people_to_meet: true,
    ibm_communities: true,
  };
}

export function defaultFocusCompassUiPreferences(): FocusCompassUiPreferences {
  return { blocks: defaultBlocks() };
}

export function readFocusCompassUiPreferences(): FocusCompassUiPreferences {
  const defaults = defaultFocusCompassUiPreferences();
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(FOCUS_COMPASS_UI_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<FocusCompassUiPreferences>;
    const blocks = { ...defaults.blocks };
    if (parsed.blocks) {
      for (const id of FOCUS_COMPASS_BLOCK_IDS) {
        if (typeof parsed.blocks[id] === "boolean") blocks[id] = parsed.blocks[id];
      }
    }
    return { blocks };
  } catch {
    return defaults;
  }
}

export function writeFocusCompassUiPreferences(prefs: FocusCompassUiPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_COMPASS_UI_STORAGE_KEY, JSON.stringify(prefs));
}

export function isFocusGroupVisible(
  groupId: FocusCompassGroupId,
  blocks: Record<FocusCompassBlockId, boolean>,
): boolean {
  switch (groupId) {
    case "today":
      return blocks.next_best_move;
    case "conversations":
      return blocks.live_huddles;
    case "learning":
      return blocks.learning_plan;
    case "moments":
      return blocks.event_moments;
    case "certifications":
      return blocks.certifications;
    case "people":
      return blocks.people_to_meet;
    case "community":
      return blocks.ibm_communities;
    default:
      return true;
  }
}
