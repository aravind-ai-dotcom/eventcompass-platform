export const EVENT_MOMENT_HIGHLIGHTS = [
  { id: "community-day", title: "Community Day", day: "Sunday, Oct 26", time: "All Day", location: "Georgia World Congress Center", description: "The kickoff day for IBM Champions, communities, and first-time attendees." },
  { id: "partner-day", title: "Partner Day", day: "Sunday, Oct 26", time: "All Day", location: "Georgia World Congress Center", description: "Dedicated programming for IBM Business Partners and ecosystem members." },
  { id: "keynote-tuesday", title: "Tuesday Keynote", day: "Tuesday, Oct 28", time: "8:30 AM", location: "Ballroom A", description: "The main stage moment that sets the direction for the week." },
  { id: "keynote-wednesday", title: "Wednesday Keynote", day: "Wednesday, Oct 29", time: "8:30 AM", location: "Ballroom A", description: "Day two main stage with product announcements and IBM leadership." },
  { id: "sandbox", title: "Sandbox Block Party", day: "Tuesday, Oct 28", time: "6:00 PM", location: "Exhibit Hall", description: "The unmissable evening social with demos, music, and networking." },
  { id: "closing", title: "Closing Session & Awards", day: "Thursday, Oct 30", time: "3:00 PM", location: "Ballroom A", description: "Celebrate the week, recognise excellence, and close TechXchange 2026." },
] as const;

export type EventMomentHighlight = (typeof EVENT_MOMENT_HIGHLIGHTS)[number];
