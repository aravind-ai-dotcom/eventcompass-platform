"use client";

import { useState } from "react";
import { savePendingHuddle, type PendingHuddleInput } from "@/lib/huddleStorage";
import { HUDDLE_COPY, formatHuddleClock, parseDateAndTimeInput } from "@/lib/huddleLifecycle";
import type { LiveOpportunity } from "@/types/liveOpportunity";

export const HUDDLE_TOPIC_TAGS = [
  "Alum",
  "Certification",
  "Career Fair",
  "Leadership",
  "AI",
  "Data",
  "Cloud",
  "Automation",
  "Security",
  "Developer",
  "Career Growth",
  "Partner",
  "Community",
] as const;

export const HUDDLE_LOCATION_SUGGESTIONS = [
  "Hilton Lounge, 2nd Floor",
  "Community Hub",
  "Certification Zone",
  "Sandbox Area",
  "Near Registration",
  "Lobby Bar",
  "Partner Pavilion",
] as const;

interface StartConversationModalProps {
  hostName: string;
  hostFirstName: string;
  onClose: () => void;
  onProposed: (huddle: LiveOpportunity) => void;
}

export default function StartConversationModal({
  hostName,
  hostFirstName,
  onClose,
  onProposed,
}: StartConversationModalProps) {
  const [step, setStep] = useState(1);
  const [topics, setTopics] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  function toggleTopic(tag: string) {
    setTopics(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }

  function handlePropose() {
    const input: PendingHuddleInput = {
      topics,
      title: title.trim() || "Open conversation",
      date,
      time,
      location: location.trim(),
      hostName,
      hostFirstName,
    };
    const huddle = savePendingHuddle(input);
    onProposed(huddle);
    onClose();
  }

  const canNext =
    (step === 1 && topics.length > 0) ||
    (step === 2 && title.trim().length > 0) ||
    (step === 3 && date.length > 0) ||
    (step === 4 && time.length > 0) ||
    (step === 5 && location.trim().length > 0);

  const reviewSchedule = date && time
    ? (() => {
        const scheduled = parseDateAndTimeInput(date, time);
        return scheduled ? formatHuddleClock(scheduled) : `${date} · ${time}`;
      })()
    : "Time TBD";

  return (
    <div className="huddle-mini-overlay huddle-mini-overlay--sheet-mobile" role="dialog" aria-modal="true" aria-label="Start a conversation">
      <button type="button" className="huddle-mini-backdrop" aria-label="Close" onClick={onClose} />
      <div className="start-conversation-modal">
        <div className="start-conversation-head">
          <div className="start-conversation-head-copy">
            <p className="live-opportunities-kicker">Start a conversation</p>
            <h3 className="start-conversation-title">Step {step} of 6</h3>
          </div>
          <button type="button" className="start-conversation-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="start-conversation-body">
        {step === 1 && (
          <div>
            <p className="start-conversation-lead">Choose topic</p>
            <div className="start-conversation-tags">
              {HUDDLE_TOPIC_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`action-chip${topics.includes(tag) ? " action-chip--active" : ""}`}
                  onClick={() => toggleTopic(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="start-conversation-lead" htmlFor="huddle-title">Conversation title</label>
            <input
              id="huddle-title"
              className="start-conversation-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Agentic AI Architecture Discussion"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="start-conversation-lead" htmlFor="huddle-date">Date</label>
            <input
              id="huddle-date"
              type="date"
              className="start-conversation-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="start-conversation-lead" htmlFor="huddle-time">Time</label>
            <input
              id="huddle-time"
              type="time"
              className="start-conversation-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        )}

        {step === 5 && (
          <div>
            <label className="start-conversation-lead" htmlFor="huddle-location">Location</label>
            <input
              id="huddle-location"
              className="start-conversation-input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Hilton Lounge, 2nd Floor"
              required
            />
            <p className="start-conversation-suggest-label">Suggestions</p>
            <div className="start-conversation-tags">
              {HUDDLE_LOCATION_SUGGESTIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  className={`action-chip${location === loc ? " action-chip--active" : ""}`}
                  onClick={() => setLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="start-conversation-review">
            <p className="start-conversation-lead">Review</p>
            <p><strong>{title}</strong></p>
            <p>{topics.join(" · ")}</p>
            <p>{reviewSchedule}</p>
            <p>{location}</p>
            <p>Host: {hostName}</p>
            <p className="start-conversation-note">{HUDDLE_COPY.modalNote}</p>
            <p className="start-conversation-note">{HUDDLE_COPY.proposeNote}</p>
          </div>
        )}
        </div>

        <div className="start-conversation-actions">
          {step > 1 && (
            <button type="button" className="action-chip" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              className="action-chip action-chip--primary"
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </button>
          ) : (
            <button type="button" className="action-chip action-chip--primary" onClick={handlePropose}>
              Propose
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
