import Link from "next/link";
import type { ReactNode } from "react";
import CompassSignalCompact from "@/components/experience/CompassSignalCompact";
import EnergyIndicator from "@/components/experience/EnergyIndicator";
import WeekInBalance from "@/components/experience/WeekInBalance";

type RawDoc = Record<string, unknown>;

interface FocusCompassHeroProps {
  displayName: string;
  participant: RawDoc;
  tracks: string[];
  goals: string[];
  peopleCount: number;
  learningCount: number;
  communityCount: number;
  funCount: number;
  onCustomize?: () => void;
  /** Always-on Ask Compass — embedded in the command center shell. */
  voicePanel?: ReactNode;
}

export default function FocusCompassHero({
  displayName,
  participant,
  tracks,
  goals,
  peopleCount,
  learningCount,
  communityCount,
  funCount,
  onCustomize,
  voicePanel,
}: FocusCompassHeroProps) {
  const jobTitle = String(participant.job_title ?? "");
  const company = String(participant.organization ?? participant.company ?? "");
  const signalItems = [...tracks, ...goals];
  const visibleSignals = signalItems.slice(0, 5);
  const extraSignals = signalItems.length - visibleSignals.length;

  return (
    <header className="focus-command-center focus-compass-hero section no-top-border">
      <div className="focus-compass-hero__toolbar">
        <div className="section-kicker">My Compass</div>
        <div className="focus-compass-hero__links">
          {onCustomize && (
            <button
              type="button"
              className="compass-customize-trigger"
              onClick={() => onCustomize()}
              aria-label="Customize My Compass"
            >
              Customize
            </button>
          )}
          <Link href="/txc/enroll?mode=edit" className="focus-compass-hero__link">
            Edit profile
          </Link>
          <Link href="/txc/enroll?mode=edit" className="focus-compass-hero__link focus-compass-hero__link--accent">
            Refine My Compass →
          </Link>
        </div>
      </div>

      <div className="focus-command-center__shell">
        <div className="focus-command-center__identity experience-hero-title-row">
          <div className="focus-compass-hero__copy">
            <h1 className="focus-compass-hero__title">{displayName}</h1>
            <p className="focus-compass-hero__subtitle">
              A focused plan for what to learn, who to meet, and where to engage.
            </p>

            {(jobTitle || company) && (
              <p className="focus-compass-hero__role">
                {[jobTitle, company].filter(Boolean).join(" · ")}
              </p>
            )}

            {visibleSignals.length > 0 && (
              <div className="focus-compass-hero__signals">
                {visibleSignals.map(item => (
                  <span key={item} className="experience-hero-chip">{item}</span>
                ))}
                {extraSignals > 0 && (
                  <span className="experience-hero-chip experience-hero-chip--muted">
                    +{extraSignals} more
                  </span>
                )}
              </div>
            )}
          </div>

          <aside className="focus-command-center__metrics" aria-label="Compass signals">
            <EnergyIndicator
              learning={learningCount}
              community={communityCount}
              fun={funCount}
              strip
            />
            <WeekInBalance
              people={peopleCount}
              learning={learningCount}
              community={communityCount}
              fun={funCount}
              strip
            />
            <CompassSignalCompact participant={participant} strip />
          </aside>
        </div>

        {voicePanel && (
          <div className="focus-command-center__voice" aria-label="Ask Compass">
            {voicePanel}
          </div>
        )}
      </div>
    </header>
  );
}
