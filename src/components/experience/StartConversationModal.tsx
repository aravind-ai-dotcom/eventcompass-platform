"use client";

import { useState } from "react";
import { HUDDLE_CLASSIFICATIONS, type CreateHuddleInput, type HuddleClassification, type HuddleDoc } from "@/types/huddleDataModel";
import { classificationLabel } from "@/services/huddleMatchingService";
import { addMinutesToTime, defaultTimezone } from "@/lib/huddleSchedule";
import { parseDateAndTimeInput } from "@/lib/huddleLifecycle";

export const HUDDLE_TOPIC_SUGGESTIONS = [
  "AI",
  "Data",
  "Cloud",
  "Automation",
  "Security",
  "Hybrid Cloud",
  "Certification",
  "Career Growth",
  "Partner",
  "Community",
] as const;

export const HUDDLE_LOCATION_SUGGESTIONS = [
  "Lunch Hall B",
  "Main Lobby",
  "Certification Center",
  "Community Hub",
  "Near Registration",
  "Conference Lounge",
  "Networking Area",
  "Sandbox Area",
  "Lobby Bar",
  "Partner Pavilion",
] as const;

interface StartConversationModalProps {
  hostParticipantId: string;
  hostName: string;
  hostJobTitle?: string;
  hostOrganization?: string;
  onClose: () => void;
  onCreate: (input: CreateHuddleInput) => Promise<void | HuddleDoc>;
}

export default function StartConversationModal({
  hostParticipantId,
  hostName,
  hostJobTitle,
  hostOrganization,
  onClose,
  onCreate,
}: StartConversationModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classification, setClassification] = useState<HuddleClassification>("general");
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [endTimeManual, setEndTimeManual] = useState(false);
  const [location, setLocation] = useState("");
  const [university, setUniversity] = useState("");
  const [company, setCompany] = useState("");
  const [certification, setCertification] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  const titleError = touched.title && !title.trim() ? "Add a title for your invitation." : "";
  const dateError = touched.date && !date ? "Pick a date." : "";
  const startError = touched.startTime && !startTime ? "Pick a start time." : "";
  const endError = touched.endTime && !endTime ? "Pick an end time." : "";
  const locationError = touched.location && !location.trim() ? "Add a meeting location." : "";
  const universityError = touched.university && classification === "alumni" && !university.trim()
    ? "University name is required for alumni huddles."
    : "";
  const companyError = touched.company && classification === "past_employer" && !company.trim()
    ? "Company name is required for past employer huddles."
    : "";

  function toggleTopic(tag: string) {
    setTopics(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }

  function addCustomTopic() {
    const t = customTopic.trim();
    if (!t || topics.includes(t)) return;
    setTopics(prev => [...prev, t]);
    setCustomTopic("");
  }

  function handleStartTimeChange(value: string) {
    setStartTime(value);
    if (!endTimeManual && value) {
      setEndTime(addMinutesToTime(value, 30));
    }
    if (!value && !endTimeManual) {
      setEndTime("");
    }
  }

  function handleEndTimeChange(value: string) {
    setEndTimeManual(true);
    setEndTime(value);
  }

  function buildTargetAudience() {
    switch (classification) {
      case "alumni":
        return { universities: university.trim() ? [university.trim()] : [] };
      case "past_employer":
        return { past_employers: company.trim() ? [company.trim()] : [] };
      case "certification":
        return { certifications: certification.trim() ? [certification.trim()] : [] };
      case "technology":
        return { tracks: topics, products: topics };
      default:
        return { tracks: topics, roles: topics };
    }
  }

  async function handlePublish() {
    setError("");
    if (!title.trim()) {
      setError("Add a title for your invitation.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }
    if (!startTime) {
      setError("Pick a start time.");
      return;
    }
    if (!endTime) {
      setError("Pick an end time (defaults to 30 minutes after start).");
      return;
    }
    if (!location.trim()) {
      setError("Add a meeting location.");
      return;
    }
    if (classification === "alumni" && !university.trim()) {
      setError("University name is required for alumni huddles.");
      return;
    }
    if (classification === "past_employer" && !company.trim()) {
      setError("Company name is required for past employer huddles.");
      return;
    }

    const start = parseDateAndTimeInput(date, startTime);
    const end = parseDateAndTimeInput(date, endTime);
    if (!start || !end) {
      setError("Date or time could not be read — check your entries.");
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        classification,
        topics,
        target_audience: buildTargetAudience(),
        host_participant_id: hostParticipantId,
        host_name: hostName,
        host_job_title: hostJobTitle,
        host_organization: hostOrganization,
        date,
        start_time: startTime,
        end_time: endTime,
        timezone: defaultTimezone(),
        location: location.trim(),
        visibility: "matched",
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish huddle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="huddle-mini-overlay huddle-mini-overlay--sheet-mobile" role="dialog" aria-modal="true" aria-label="Start a conversation">
      <button type="button" className="huddle-mini-backdrop" aria-label="Close" onClick={onClose} />
      <div className="start-conversation-modal">
        <div className="start-conversation-head">
          <div className="start-conversation-head-copy">
            <p className="live-opportunities-kicker">Start a conversation</p>
            <h3 className="start-conversation-title">Publish an invitation</h3>
          </div>
          <button type="button" className="start-conversation-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="start-conversation-body">
          <label className="start-conversation-lead" htmlFor="huddle-title">Title</label>
          <input
            id="huddle-title"
            className={`start-conversation-input${titleError ? " start-conversation-input--error" : ""}`}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => touch("title")}
            placeholder="Alumni catch-up over coffee"
            aria-invalid={!!titleError}
          />
          {titleError && <p className="start-conversation-field-error">{titleError}</p>}

          <label className="start-conversation-lead" htmlFor="huddle-desc">Description</label>
          <textarea
            id="huddle-desc"
            className="start-conversation-input start-conversation-input--textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Quick intro to what you'd like to discuss."
            rows={3}
          />

          <p className="start-conversation-lead">Category</p>
          <div className="start-conversation-tags">
            {HUDDLE_CLASSIFICATIONS.map(c => (
              <button
                key={c}
                type="button"
                className={`action-chip${classification === c ? " action-chip--active" : ""}`}
                onClick={() => setClassification(c)}
              >
                {classificationLabel(c)}
              </button>
            ))}
          </div>

          {classification === "alumni" && (
            <>
              <label className="start-conversation-lead" htmlFor="huddle-uni">University</label>
              <input
                id="huddle-uni"
                className={`start-conversation-input${universityError ? " start-conversation-input--error" : ""}`}
                value={university}
                onChange={e => setUniversity(e.target.value)}
                onBlur={() => touch("university")}
                placeholder="Your university name"
                aria-invalid={!!universityError}
              />
              {universityError && <p className="start-conversation-field-error">{universityError}</p>}
            </>
          )}

          {classification === "past_employer" && (
            <>
              <label className="start-conversation-lead" htmlFor="huddle-co">Past employer</label>
              <input
                id="huddle-co"
                className={`start-conversation-input${companyError ? " start-conversation-input--error" : ""}`}
                value={company}
                onChange={e => setCompany(e.target.value)}
                onBlur={() => touch("company")}
                placeholder="Former company name"
                aria-invalid={!!companyError}
              />
              {companyError && <p className="start-conversation-field-error">{companyError}</p>}
            </>
          )}

          {classification === "certification" && (
            <>
              <label className="start-conversation-lead" htmlFor="huddle-cert">Certification goal</label>
              <input
                id="huddle-cert"
                className="start-conversation-input"
                value={certification}
                onChange={e => setCertification(e.target.value)}
                placeholder="Certification you're pursuing"
              />
            </>
          )}

          {(classification === "technology" || classification === "general" || classification === "industry") && (
            <>
              <p className="start-conversation-lead">Topics</p>
              <div className="start-conversation-tags">
                {HUDDLE_TOPIC_SUGGESTIONS.map(tag => (
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
              <div className="start-conversation-inline-add">
                <input
                  className="start-conversation-input"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="Add topic"
                />
                <button type="button" className="action-chip" onClick={addCustomTopic}>Add</button>
              </div>
            </>
          )}

          <label className="start-conversation-lead" htmlFor="huddle-date">Date</label>
          <input
            id="huddle-date"
            type="date"
            className={`start-conversation-input start-conversation-input--date${dateError ? " start-conversation-input--error" : ""}`}
            value={date}
            onChange={e => setDate(e.target.value)}
            onBlur={() => touch("date")}
            aria-invalid={!!dateError}
          />
          {dateError && <p className="start-conversation-field-error">{dateError}</p>}

          <div className="start-conversation-time-grid">
            <div>
              <label className="start-conversation-lead" htmlFor="huddle-start">Start time</label>
              <input
                id="huddle-start"
                type="time"
                className={`start-conversation-input start-conversation-input--time${startError ? " start-conversation-input--error" : ""}`}
                value={startTime}
                onChange={e => handleStartTimeChange(e.target.value)}
                onBlur={() => touch("startTime")}
                aria-invalid={!!startError}
              />
              {startError && <p className="start-conversation-field-error">{startError}</p>}
            </div>
            <div>
              <label className="start-conversation-lead" htmlFor="huddle-end">End time</label>
              <input
                id="huddle-end"
                type="time"
                className={`start-conversation-input start-conversation-input--time${endError ? " start-conversation-input--error" : ""}`}
                value={endTime}
                onChange={e => handleEndTimeChange(e.target.value)}
                onBlur={() => touch("endTime")}
                aria-invalid={!!endError}
              />
              {endError && <p className="start-conversation-field-error">{endError}</p>}
              <p className="start-conversation-hint">Defaults to 30 min after start.</p>
            </div>
          </div>

          <label className="start-conversation-lead" htmlFor="huddle-location">Location</label>
          <input
            id="huddle-location"
            className={`start-conversation-input${locationError ? " start-conversation-input--error" : ""}`}
            value={location}
            onChange={e => setLocation(e.target.value)}
            onBlur={() => touch("location")}
            placeholder="Where should people meet?"
            aria-invalid={!!locationError}
          />
          {locationError && <p className="start-conversation-field-error">{locationError}</p>}
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

          {error && <p className="start-conversation-error">{error}</p>}
        </div>

        <div className="start-conversation-actions">
          <button type="button" className="action-chip" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="action-chip action-chip--primary"
            disabled={saving}
            onClick={() => void handlePublish()}
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
