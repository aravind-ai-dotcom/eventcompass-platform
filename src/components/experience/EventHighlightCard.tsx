"use client";

import { useState } from "react";
import {
  EVENT_MOMENT_BADGE_LABELS,
  EVENT_MOMENT_STATUS_LABELS,
  resolveEventMomentStatus,
  type EventMomentHighlight,
} from "@/lib/eventMoments";

interface Props {
  moment: EventMomentHighlight;
  compact?: boolean;
}

export default function EventHighlightCard({ moment, compact = true }: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = resolveEventMomentStatus(moment);
  const badgeLabel = EVENT_MOMENT_BADGE_LABELS[moment.badge];
  const statusLabel = EVENT_MOMENT_STATUS_LABELS[status];
  const dayShort = moment.day.split(",")[0];

  return (
    <>
      <article
        className={`event-highlight-card${compact ? " event-highlight-card--compact" : ""}`}
        onClick={() => setExpanded(true)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="event-highlight-card__top">
          <span className={`event-highlight-badge event-highlight-badge--${moment.badge}`}>
            {badgeLabel}
          </span>
          <span className={`event-highlight-status event-highlight-status--${status}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="event-highlight-card__title">{moment.title}</h3>
        <p className="event-highlight-card__when">
          {dayShort} · {moment.time}
        </p>
        <p className="event-highlight-card__purpose">{moment.whyAttend}</p>
        {!compact && (
          <>
            <p className="event-highlight-card__location">{moment.location}</p>
            <p className="event-highlight-card__desc">{moment.description}</p>
          </>
        )}
      </article>

      {expanded && (
        <div
          className="event-highlight-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={moment.title}
        >
          <button
            type="button"
            className="event-highlight-sheet-backdrop"
            aria-label="Close"
            onClick={() => setExpanded(false)}
          />
          <article className="event-highlight-sheet">
            <div className="event-highlight-sheet__handle" aria-hidden="true" />
            <div className="event-highlight-card__top">
              <span className={`event-highlight-badge event-highlight-badge--${moment.badge}`}>
                {badgeLabel}
              </span>
              <span className={`event-highlight-status event-highlight-status--${status}`}>
                {statusLabel}
              </span>
            </div>
            <h3 className="event-highlight-sheet__title">{moment.title}</h3>
            <p className="event-highlight-sheet__meta">
              {moment.day} · {moment.time} · {moment.location}
            </p>
            <p className="event-highlight-sheet__desc">{moment.description}</p>
            <div className="event-highlight-sheet__why">
              <p className="event-highlight-sheet__why-kicker">Why Attend</p>
              <p className="event-highlight-sheet__why-text">{moment.whyAttend}</p>
            </div>
            <button
              type="button"
              className="action-chip action-chip--quiet"
              onClick={() => setExpanded(false)}
            >
              Close
            </button>
          </article>
        </div>
      )}
    </>
  );
}
