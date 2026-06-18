// Compass My Experience — section collapse + module visibility (localStorage)

export const COMPASS_SECTION_IDS = [
  "today",
  "goals",
  "learning",
  "people",
  "profile",
  "community",
] as const;

export type CompassSectionId = (typeof COMPASS_SECTION_IDS)[number];

export const COMPASS_MODULE_IDS = [
  "ask_compass",
  "next_best_move",
  "conversations",
  "shared_moments",
  "certification_journey",
  "four_day_plan",
  "recommended_sessions",
  "my_schedule",
  "recommended_connections",
  "my_connections",
  "people_interested_in_me",
  "compass_signal",
  "profile_signals",
  "intent_summary",
  "week_balance",
  "community_activity",
  "techxchange_tv",
  "live_highlights",
  "export_panel",
] as const;

export type CompassModuleId = (typeof COMPASS_MODULE_IDS)[number];

export interface CompassUiPreferences {
  sections: Record<CompassSectionId, boolean>;
  modules: Record<CompassModuleId, boolean>;
}

export const COMPASS_UI_STORAGE_KEY = "compass_ui_preferences";

export const COMPASS_SECTION_LABELS: Record<CompassSectionId, string> = {
  today: "Today",
  goals: "My Goals",
  learning: "My Learning",
  people: "My People",
  profile: "My Profile",
  community: "Community",
};

export const COMPASS_MODULE_LABELS: Record<CompassModuleId, string> = {
  ask_compass: "Ask Compass",
  next_best_move: "Next Best Move",
  conversations: "Huddles & conversations",
  shared_moments: "Shared moments",
  certification_journey: "Certification Journey",
  four_day_plan: "Four-Day Plan",
  recommended_sessions: "Recommended sessions",
  my_schedule: "Saved schedule",
  recommended_connections: "Recommended connections",
  my_connections: "My Connections",
  people_interested_in_me: "People interested in me",
  compass_signal: "Compass Signal",
  profile_signals: "Profile signals",
  intent_summary: "Intent summary",
  week_balance: "Week in balance",
  community_activity: "Community activity",
  techxchange_tv: "TechXchange TV",
  live_highlights: "Live highlights",
  export_panel: "Save & export",
};

function defaultSections(isMobile: boolean): Record<CompassSectionId, boolean> {
  if (isMobile) {
    return {
      today: true,
      goals: false,
      learning: false,
      people: false,
      profile: false,
      community: false,
    };
  }
  return {
    today: true,
    goals: true,
    learning: true,
    people: false,
    profile: false,
    community: false,
  };
}

function defaultModules(): Record<CompassModuleId, boolean> {
  return Object.fromEntries(
    COMPASS_MODULE_IDS.map(id => [id, true]),
  ) as Record<CompassModuleId, boolean>;
}

export function defaultCompassUiPreferences(isMobile = false): CompassUiPreferences {
  return {
    sections: defaultSections(isMobile),
    modules: defaultModules(),
  };
}

function isSectionId(value: string): value is CompassSectionId {
  return (COMPASS_SECTION_IDS as readonly string[]).includes(value);
}

function isModuleId(value: string): value is CompassModuleId {
  return (COMPASS_MODULE_IDS as readonly string[]).includes(value);
}

export function readCompassUiPreferences(isMobile = false): CompassUiPreferences {
  const defaults = defaultCompassUiPreferences(isMobile);
  if (typeof window === "undefined") return defaults;

  try {
    const raw = localStorage.getItem(COMPASS_UI_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<CompassUiPreferences>;

    const sections = { ...defaults.sections };
    if (parsed.sections) {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (isSectionId(key) && typeof value === "boolean") sections[key] = value;
      }
    }

    const modules = { ...defaults.modules };
    if (parsed.modules) {
      for (const [key, value] of Object.entries(parsed.modules)) {
        if (isModuleId(key) && typeof value === "boolean") modules[key] = value;
      }
      // Migrate legacy people module ids
      const legacy = parsed.modules as Record<string, boolean | undefined>;
      if (legacy.champion_matches !== undefined && legacy.recommended_connections === undefined) {
        modules.recommended_connections = legacy.champion_matches;
      }
      if (legacy.connection_signals !== undefined) {
        if (legacy.my_connections === undefined && legacy.people_tracking === undefined) {
          modules.my_connections = legacy.connection_signals;
        }
        if (legacy.people_interested_in_me === undefined) {
          modules.people_interested_in_me = legacy.connection_signals;
        }
      }
      if (legacy.people_tracking !== undefined && legacy.my_connections === undefined) {
        modules.my_connections = legacy.people_tracking;
      }
    }

    return { sections, modules };
  } catch {
    return defaults;
  }
}

export function writeCompassUiPreferences(prefs: CompassUiPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPASS_UI_STORAGE_KEY, JSON.stringify(prefs));
}

export const COMPASS_MOBILE_BREAKPOINT = 768;

export function isCompassMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${COMPASS_MOBILE_BREAKPOINT}px)`).matches;
}
