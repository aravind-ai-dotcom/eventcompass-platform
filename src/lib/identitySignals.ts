/**
 * TechXchange identity signals — Champion status, alumni history, attendance memory.
 * Stored on participants/{id} as identity_signals + activity_memory.
 */

export type ChampionStatus =
  | "ibm_champion"
  | "former_champion"
  | "champion_nominee"
  | "interested_in_becoming_champion"
  | "not_applicable"
  | "prefer_not_to_answer";

export interface IdentitySignals {
  champion_status: ChampionStatus | "";
  attended_txc_before: boolean | null;
  techxchange_history: string[];
  attendance_memory_enabled: boolean | null;
}

export interface ActivityMemory {
  attended_sessions: string[];
  partially_attended_sessions: string[];
  missed_sessions: string[];
  met_people: string[];
  meaningful_huddles: string[];
  wants_session_followup: boolean;
}

export const CHAMPION_STATUS_OPTIONS: Array<{ id: ChampionStatus; label: string }> = [
  { id: "ibm_champion", label: "IBM Champion" },
  { id: "former_champion", label: "Former IBM Champion" },
  { id: "champion_nominee", label: "Champion Nominee" },
  { id: "interested_in_becoming_champion", label: "Interested in becoming a Champion" },
  { id: "not_applicable", label: "Not Applicable" },
  { id: "prefer_not_to_answer", label: "Prefer not to answer" },
];

export const TXC_HISTORY_EVENTS: Array<{ id: string; label: string }> = [
  { id: "txc2023_las_vegas", label: "TechXchange 2023 — Las Vegas" },
  { id: "txc2024_emea_barcelona", label: "TechXchange 2024 EMEA — Barcelona" },
  { id: "txc2024_las_vegas", label: "TechXchange 2024 — Las Vegas" },
  { id: "txc2025_orlando", label: "TechXchange 2025 — Orlando" },
];

export const TXC_HISTORY_LABEL_BY_ID = new Map(TXC_HISTORY_EVENTS.map(e => [e.id, e.label]));

export const DEFAULT_ACTIVITY_MEMORY: ActivityMemory = {
  attended_sessions: [],
  partially_attended_sessions: [],
  missed_sessions: [],
  met_people: [],
  meaningful_huddles: [],
  wants_session_followup: false,
};

const VALID_CHAMPION_STATUSES = new Set<string>(CHAMPION_STATUS_OPTIONS.map(o => o.id));

export function parseIdentitySignals(raw: Record<string, unknown> | null | undefined): IdentitySignals | null {
  if (!raw?.identity_signals || typeof raw.identity_signals !== "object") return null;
  const sig = raw.identity_signals as Record<string, unknown>;
  const status = String(sig.champion_status ?? "");
  const champion_status = VALID_CHAMPION_STATUSES.has(status) ? (status as ChampionStatus) : "";
  const attendedRaw = sig.attended_txc_before;
  const attended_txc_before =
    attendedRaw === true ? true : attendedRaw === false ? false : null;
  const techxchange_history = Array.isArray(sig.techxchange_history)
    ? sig.techxchange_history.map(String).filter(id => TXC_HISTORY_LABEL_BY_ID.has(id))
    : [];
  const memoryRaw = sig.attendance_memory_enabled;
  const attendance_memory_enabled =
    memoryRaw === true ? true : memoryRaw === false ? false : null;
  if (!champion_status && attended_txc_before === null && techxchange_history.length === 0 && attendance_memory_enabled === null) {
    return null;
  }
  return { champion_status, attended_txc_before, techxchange_history, attendance_memory_enabled };
}

export function parseActivityMemory(raw: Record<string, unknown> | null | undefined): ActivityMemory {
  if (!raw?.activity_memory || typeof raw.activity_memory !== "object") {
    return { ...DEFAULT_ACTIVITY_MEMORY };
  }
  const m = raw.activity_memory as Record<string, unknown>;
  return {
    attended_sessions: Array.isArray(m.attended_sessions) ? m.attended_sessions.map(String) : [],
    partially_attended_sessions: Array.isArray(m.partially_attended_sessions)
      ? m.partially_attended_sessions.map(String)
      : [],
    missed_sessions: Array.isArray(m.missed_sessions) ? m.missed_sessions.map(String) : [],
    met_people: Array.isArray(m.met_people) ? m.met_people.map(String) : [],
    meaningful_huddles: Array.isArray(m.meaningful_huddles) ? m.meaningful_huddles.map(String) : [],
    wants_session_followup: m.wants_session_followup === true,
  };
}

export function buildIdentitySignalsPayload(signals: IdentitySignals): Record<string, unknown> {
  return {
    champion_status: signals.champion_status || "prefer_not_to_answer",
    attended_txc_before: signals.attended_txc_before,
    techxchange_history: signals.attended_txc_before === true ? signals.techxchange_history : [],
    attendance_memory_enabled: signals.attendance_memory_enabled ?? false,
  };
}

export interface IdentityBadge {
  id: string;
  label: string;
  variant: "champion" | "alum" | "first-time";
}

export function getIdentityBadges(signals: IdentitySignals | null): IdentityBadge[] {
  if (!signals) return [];
  const badges: IdentityBadge[] = [];

  if (signals.champion_status === "ibm_champion") {
    badges.push({ id: "champion", label: "IBM Champion", variant: "champion" });
  } else if (signals.champion_status === "former_champion") {
    badges.push({ id: "former-champion", label: "Former IBM Champion", variant: "champion" });
  }

  if (signals.attended_txc_before === true) {
    badges.push({ id: "alum", label: "TechXchange Alum", variant: "alum" });
  } else if (signals.attended_txc_before === false) {
    badges.push({ id: "first-time", label: "First-time TechXchange attendee", variant: "first-time" });
  }

  return badges;
}

export function getIdentityWelcomeLine(signals: IdentitySignals | null, firstName?: string): string | null {
  if (!signals) return null;
  const isChampion =
    signals.champion_status === "ibm_champion" || signals.champion_status === "former_champion";
  const greeting = firstName?.trim() ? `Welcome back, ${firstName.trim()}` : "Welcome back";

  if (isChampion && signals.attended_txc_before === true) {
    return `${greeting} — IBM Champion and TechXchange Alum.`;
  }
  if (signals.champion_status === "ibm_champion") {
    return `${greeting}, IBM Champion.`;
  }
  if (signals.attended_txc_before === true) {
    return `${greeting} to TechXchange.`;
  }
  if (signals.attended_txc_before === false) {
    return "Your first TechXchange — Compass is here to help you make the most of it.";
  }
  return null;
}

export function formatAlumHistorySubtitle(history: string[]): string | null {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const label = TXC_HISTORY_LABEL_BY_ID.get(latest) ?? latest;
  const short = label.replace(/^TechXchange\s+/, "").replace(/\s+—\s+/, " · ");
  return history.length === 1
    ? `Returning attendee · ${short}`
    : `Returning attendee since ${short}`;
}

export interface IdentityAggregate {
  respondents: number;
  alumni: { returning: number; firstTime: number; noResponse: number };
  champion: {
    ibm_champion: number;
    former_champion: number;
    champion_nominee: number;
    interested: number;
    not_applicable: number;
    no_response: number;
  };
  history: Record<string, number>;
  memory: { enabled: number; disabled: number; noResponse: number };
}

export const IDENTITY_AGGREGATE_SEED: IdentityAggregate = {
  respondents: 1284,
  alumni: { returning: 540, firstTime: 612, noResponse: 132 },
  champion: {
    ibm_champion: 186,
    former_champion: 94,
    champion_nominee: 48,
    interested: 112,
    not_applicable: 724,
    no_response: 120,
  },
  history: {
    txc2025_orlando: 312,
    txc2024_las_vegas: 198,
    txc2024_emea_barcelona: 86,
    txc2023_las_vegas: 64,
  },
  memory: { enabled: 892, disabled: 268, noResponse: 124 },
};

export function aggregateIdentitySignals(participants: Record<string, unknown>[]): IdentityAggregate {
  const out: IdentityAggregate = {
    respondents: 0,
    alumni: { returning: 0, firstTime: 0, noResponse: 0 },
    champion: {
      ibm_champion: 0,
      former_champion: 0,
      champion_nominee: 0,
      interested: 0,
      not_applicable: 0,
      no_response: 0,
    },
    history: {},
    memory: { enabled: 0, disabled: 0, noResponse: 0 },
  };

  for (const p of participants) {
    const signals = parseIdentitySignals(p);

    const status = signals?.champion_status;
    if (!status || status === "prefer_not_to_answer") {
      out.champion.no_response++;
    } else {
      switch (status) {
        case "ibm_champion":
          out.champion.ibm_champion++;
          break;
        case "former_champion":
          out.champion.former_champion++;
          break;
        case "champion_nominee":
          out.champion.champion_nominee++;
          break;
        case "interested_in_becoming_champion":
          out.champion.interested++;
          break;
        case "not_applicable":
          out.champion.not_applicable++;
          break;
      }
    }

    if (signals?.attended_txc_before === true) {
      out.alumni.returning++;
      for (const eventId of signals.techxchange_history) {
        out.history[eventId] = (out.history[eventId] ?? 0) + 1;
      }
    } else if (signals?.attended_txc_before === false) {
      out.alumni.firstTime++;
    } else {
      out.alumni.noResponse++;
    }

    if (signals?.attendance_memory_enabled === true) out.memory.enabled++;
    else if (signals?.attendance_memory_enabled === false) out.memory.disabled++;
    else out.memory.noResponse++;
  }

  out.respondents = participants.length;

  return out;
}

export function pctOf(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function identityPctRows(
  buckets: Record<string, number>,
  total: number,
): Array<{ label: string; pct: number; count: number }> {
  return Object.entries(buckets)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({ label, count, pct: pctOf(count, total) }))
    .sort((a, b) => b.count - a.count);
}
