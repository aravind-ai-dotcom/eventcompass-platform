"use client";

import EventHighlightCard from "@/components/experience/EventHighlightCard";
import { EVENT_MOMENT_HIGHLIGHTS } from "@/lib/eventMoments";

export default function DontMissMomentsSection() {
  return (
    <div className="dont-miss-moments__grid">
      {EVENT_MOMENT_HIGHLIGHTS.map(moment => (
        <EventHighlightCard key={moment.id} moment={moment} />
      ))}
    </div>
  );
}
