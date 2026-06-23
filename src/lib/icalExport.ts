import type { ExperienceScoredSession } from "@/lib/experienceScoring";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

function fallbackSessionTime(index: number): { start: Date; end: Date } {
  const days = [26, 27, 28, 29];
  const slots = [
    { h: 9, m: 0 },
    { h: 10, m: 30 },
    { h: 12, m: 0 },
    { h: 13, m: 30 },
    { h: 15, m: 0 },
    { h: 16, m: 30 },
  ];
  const day = days[Math.floor(index / slots.length) % days.length];
  const slot = slots[index % slots.length];
  const start = new Date(Date.UTC(2026, 9, day, slot.h, slot.m, 0));
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  return { start, end };
}

function parseSessionDateTime(
  session: ExperienceScoredSession,
  index: number,
): { start: Date; end: Date } {
  const raw = session as unknown as Record<string, unknown>;
  const date = String(session.schedule?.day ?? session.date ?? raw.date ?? "");
  const startTime = String(session.schedule?.start_time ?? session.start_time ?? raw.start_time ?? "");
  const endTime = String(session.schedule?.end_time ?? raw.end_time ?? "");

  const startCandidate = date && startTime ? new Date(`${date} ${startTime}`) : null;
  const endCandidate = date && endTime ? new Date(`${date} ${endTime}`) : null;

  if (startCandidate && !Number.isNaN(startCandidate.getTime())) {
    const start = startCandidate;
    const end =
      endCandidate && !Number.isNaN(endCandidate.getTime())
        ? endCandidate
        : new Date(start.getTime() + 45 * 60 * 1000);
    return { start, end };
  }

  return fallbackSessionTime(index);
}

/** Download FORGE plan as .ics (Apple Calendar, Google, Outlook). */
export function downloadIcsPlan(
  sessions: ExperienceScoredSession[],
  filename = "my-forge-plan.ics",
): void {
  if (typeof window === "undefined") return;

  const usable = sessions.slice(0, 60);
  if (usable.length === 0) {
    window.alert("No sessions available to export yet.");
    return;
  }

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventCompass//FORGE 2027//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:My FORGE Plan",
  ];

  usable.forEach((s, index) => {
    const { start, end } = parseSessionDateTime(s, index);
    const raw = s as unknown as Record<string, unknown>;
    const loc = esc(String(s.room ?? raw.room ?? s.schedule?.room ?? "TBA"));
    const reasons = (s.compass_reasons ?? []).slice(0, 3).join("; ");

    lines.push(
      "BEGIN:VEVENT",
      `UID:txc2026-${esc(s.id)}@eventcompass`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${esc(s.title)}`,
      `DESCRIPTION:${esc(reasons ? `Match ${s.compass_score}. ${reasons}` : `Match ${s.compass_score}`)}`,
      `LOCATION:${loc}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
