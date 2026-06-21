export type EventMomentBadge =
  | "keynote"
  | "celebration"
  | "networking"
  | "community"
  | "partner"
  | "innovation"
  | "recognition";

export type EventMomentStatus =
  | "upcoming"
  | "today"
  | "happening_now"
  | "completed";

export interface EventMomentHighlight {
  id: string;
  title: string;
  /** Display date e.g. "Sunday, Oct 26" */
  day: string;
  /** ISO date for status (YYYY-MM-DD) */
  date: string;
  time: string;
  /** Optional end time HH:MM for happening-now window */
  endTime?: string;
  location: string;
  description: string;
  whyAttend: string;
  badge: EventMomentBadge;
  sortOrder: number;
}

export const EVENT_MOMENT_BADGE_LABELS: Record<EventMomentBadge, string> = {
  keynote: "Keynote",
  celebration: "Celebration",
  networking: "Networking",
  community: "Community",
  partner: "Partner",
  innovation: "Innovation",
  recognition: "Recognition",
};

export const EVENT_MOMENT_HIGHLIGHTS = ([
  {
    id: "opening-keynote",
    title: "Opening Keynote",
    day: "Tuesday, Oct 28",
    date: "2026-10-28",
    time: "8:30 AM",
    endTime: "10:00",
    location: "Ballroom A",
    description: "IBM leadership sets the technology vision and direction for the week ahead.",
    whyAttend: "Hear IBM's technology vision",
    badge: "keynote",
    sortOrder: 1,
  },
  {
    id: "partner-day",
    title: "Partner Day",
    day: "Sunday, Oct 26",
    date: "2026-10-26",
    time: "All Day",
    location: "Georgia World Congress Center",
    description: "Dedicated programming for IBM Business Partners and the broader ecosystem.",
    whyAttend: "Meet partners and peers",
    badge: "partner",
    sortOrder: 2,
  },
  {
    id: "community-day",
    title: "Community Day",
    day: "Sunday, Oct 26",
    date: "2026-10-26",
    time: "All Day",
    location: "Georgia World Congress Center",
    description: "The kickoff for IBM Champions, user groups, and community-led experiences.",
    whyAttend: "Celebrate the community",
    badge: "community",
    sortOrder: 3,
  },
  {
    id: "data-summit",
    title: "Data Technical Summit",
    day: "Monday, Oct 27",
    date: "2026-10-27",
    time: "9:00 AM",
    location: "Summit Theater",
    description: "Deep technical programming for data practitioners across governance, engineering, and AI.",
    whyAttend: "Connect beyond the sessions",
    badge: "innovation",
    sortOrder: 4,
  },
  {
    id: "student-day",
    title: "Student Developer Day",
    day: "Monday, Oct 27",
    date: "2026-10-27",
    time: "9:00 AM",
    location: "Learning Hub",
    description: "Career sessions, hands-on labs, and mentor access for students and early-career technologists.",
    whyAttend: "Experience hands-on innovation",
    badge: "community",
    sortOrder: 5,
  },
  {
    id: "sandbox",
    title: "Sandbox Block Party",
    day: "Tuesday, Oct 28",
    date: "2026-10-28",
    time: "6:00 PM",
    endTime: "21:00",
    location: "Exhibit Hall",
    description: "The signature evening social with demos, music, builder energy, and open networking.",
    whyAttend: "Experience hands-on innovation",
    badge: "networking",
    sortOrder: 6,
  },
  {
    id: "champions-recognition",
    title: "Champions Recognition",
    day: "Wednesday, Oct 29",
    date: "2026-10-29",
    time: "4:00 PM",
    endTime: "17:30",
    location: "Community Lounge",
    description: "Celebrate IBM Champions and community leaders who shape the technical ecosystem.",
    whyAttend: "Celebrate the community",
    badge: "recognition",
    sortOrder: 7,
  },
  {
    id: "closing",
    title: "Closing Session",
    day: "Thursday, Oct 30",
    date: "2026-10-30",
    time: "2:00 PM",
    endTime: "15:00",
    location: "Ballroom A",
    description: "Reflect on the week and look ahead with IBM leadership and the TechXchange community.",
    whyAttend: "Hear IBM's technology vision",
    badge: "keynote",
    sortOrder: 8,
  },
  {
    id: "awards",
    title: "Awards & Celebration",
    day: "Thursday, Oct 30",
    date: "2026-10-30",
    time: "3:00 PM",
    endTime: "17:00",
    location: "Ballroom A",
    description: "Recognise excellence, celebrate achievements, and close TechXchange 2026 together.",
    whyAttend: "Celebrate the community",
    badge: "celebration",
    sortOrder: 9,
  },
] as EventMomentHighlight[]).sort((a, b) => a.sortOrder - b.sortOrder);

export const EVENT_MOMENT_STATUS_LABELS: Record<EventMomentStatus, string> = {
  upcoming: "Upcoming",
  today: "Today",
  happening_now: "Happening Now",
  completed: "Completed",
};

/** Parse "8:30 AM" / "6:00 PM" to minutes from midnight. */
function parseTimeMinutes(time: string): number | null {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3]?.toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

/** Status from calendar date + optional time window (not profile-scored). */
export function resolveEventMomentStatus(
  moment: Pick<EventMomentHighlight, "date" | "time" | "endTime">,
  now: Date = new Date(),
): EventMomentStatus {
  const todayStr = now.toISOString().slice(0, 10);
  if (moment.date < todayStr) return "completed";
  if (moment.date > todayStr) return "upcoming";

  if (/all day/i.test(moment.time)) return "today";

  const start = parseTimeMinutes(moment.time);
  const end = moment.endTime ? parseTimeMinutes(moment.endTime) : null;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (start == null) return "today";
  if (end != null) {
    if (nowMin >= start && nowMin <= end) return "happening_now";
    if (nowMin > end) return "completed";
    return "today";
  }
  if (nowMin >= start) return "happening_now";
  return "today";
}

/** Voice + concierge copy — not personalized. */
export function formatEventHighlightsVoice(limit = 5): string {
  const items = EVENT_MOMENT_HIGHLIGHTS.slice(0, limit);
  const parts = items.map(m => `${m.title} on ${m.day.split(",")[0]} at ${m.time}`);
  return `Don't miss these defining TechXchange moments: ${parts.join("; ")}. Everyone sees these highlights — they're not session recommendations. Open Don't Miss These Moments on My Compass for the full list.`;
}

export function formatEventHighlightsDisplay(): string {
  return EVENT_MOMENT_HIGHLIGHTS.slice(0, 6).map(m => m.title).join(" · ");
}

export function findEventMomentByQuery(query: string): EventMomentHighlight | null {
  const q = query.toLowerCase();
  return EVENT_MOMENT_HIGHLIGHTS.find(m =>
    m.title.toLowerCase().includes(q)
    || m.id.includes(q.replace(/\s+/g, "-")),
  ) ?? null;
}
