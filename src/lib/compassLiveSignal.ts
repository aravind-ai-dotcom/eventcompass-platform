const LIVE_SIGNALS = [
  "14 new attendee signals today",
  "6 conversations forming nearby",
  "Updated moments ago",
] as const;

/** One rotating live indicator — stable for the current hour. */
export function compassLiveSignalText(): string {
  const hour = new Date().getHours();
  return LIVE_SIGNALS[hour % LIVE_SIGNALS.length];
}
