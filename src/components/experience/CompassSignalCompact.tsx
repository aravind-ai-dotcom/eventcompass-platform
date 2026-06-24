import Link from "next/link";

type RawDoc = Record<string, unknown>;

/** Profile completeness — compact card with Refine My Compass CTA. */
export default function CompassSignalCompact({
  participant,
  compact = false,
  strip = false,
}: {
  participant: RawDoc;
  compact?: boolean;
  strip?: boolean;
}) {
  const sig = (participant.event_signal_profile as RawDoc) ?? {};
  const ni = (participant.networking_identity as Record<string, boolean>) ?? {};
  const edu = (participant.education as { institution?: string }[] | undefined) ?? [];
  const emp = (participant.past_employers as { company?: string }[] | undefined) ?? [];
  const ci = (participant.career_interests as string[] | undefined) ?? [];
  const cons = (participant.consent as Record<string, boolean> | undefined) ?? {};

  const dimensions = [
    { label: "Identity", done: !!(participant.first_name && participant.last_name) },
    {
      label: "Professional",
      done: !!(participant.job_title && (participant.organization ?? participant.company)),
    },
    {
      label: "Background",
      done: !!(edu[0]?.institution || emp[0]?.company || ci.length > 0),
    },
    {
      label: "Intent",
      done: !!(((sig.goals as string[] | undefined) ?? []).length > 0 &&
        ((sig.tech_tracks as string[] | undefined) ?? []).length > 0),
    },
    {
      label: "Consent",
      done: Object.keys(cons).length > 0 || Object.values(ni).some(Boolean),
    },
  ];

  const score = dimensions.filter(d => d.done).length;
  const pct = Math.round((score / dimensions.length) * 100);
  const complete = pct === 100;

  if (strip) {
    return (
      <Link
        href="/txc/enroll?mode=edit&focus=intent"
        className={`focus-metric-block focus-metric-block--link${complete ? " focus-metric-block--complete" : ""}`}
      >
        <span className="focus-metric-row__label">Signal</span>
        <div className="focus-metric-block__body">
          <div className="focus-metric-block__bar-row">
            <div className="compass-signal-bar focus-metric-row__track">
              <div
                className={`compass-signal-bar-fill${complete ? " compass-signal-bar-fill--complete" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`focus-metric-row__value${complete ? " focus-metric-row__value--complete" : ""}`}>
              {pct}%
            </span>
          </div>
          <div className={`compass-signal-chips focus-metric-block__chips${complete ? " compass-signal-chips--complete" : ""}`}>
            {dimensions.map(d => (
              <span
                key={d.label}
                className={[
                  "compass-signal-chip",
                  d.done ? "compass-signal-chip--done" : "",
                  d.done && complete ? "compass-signal-chip--complete" : "",
                ].filter(Boolean).join(" ")}
              >
                {d.done ? "✓" : "○"} {d.label}
              </span>
            ))}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/txc/enroll?mode=edit&focus=intent"
      className={`compass-signal-card compass-signal-card--clickable${complete ? " compass-signal-card--complete" : ""}${compact ? " compass-signal-card--compact" : ""}`}
    >
      <div className="compass-signal-head">
        <p className="compass-signal-kicker">Compass Signal</p>
        <span className={`compass-signal-pct${complete ? " compass-signal-pct--complete" : ""}`}>
          {pct}%
        </span>
      </div>

      <div className="compass-signal-bar">
        <div
          className={`compass-signal-bar-fill${complete ? " compass-signal-bar-fill--complete" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={`compass-signal-chips${complete ? " compass-signal-chips--complete" : ""}${compact ? " compass-signal-chips--compact" : ""}`}>
        {dimensions.map(d => (
          <span
            key={d.label}
            className={[
              "compass-signal-chip",
              d.done ? "compass-signal-chip--done" : "",
              d.done && complete ? "compass-signal-chip--complete" : "",
            ].filter(Boolean).join(" ")}
          >
            {d.done ? "✓" : "○"} {d.label}
          </span>
        ))}
      </div>

      {pct < 100 && (
        <span className="compass-refine-chip">Refine My Compass →</span>
      )}
    </Link>
  );
}
