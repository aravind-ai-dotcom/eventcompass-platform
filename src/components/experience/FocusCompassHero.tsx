import Link from "next/link";
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
}: FocusCompassHeroProps) {
  const jobTitle = String(participant.job_title ?? "");
  const company = String(participant.organization ?? participant.company ?? "");
  const signalItems = [...tracks, ...goals];
  const visibleSignals = signalItems.slice(0, 5);
  const extraSignals = signalItems.length - visibleSignals.length;

  return (
    <header className="focus-compass-hero section no-top-border">
      <div className="focus-compass-hero__toolbar">
        <div className="section-kicker">My Compass</div>
        <div className="focus-compass-hero__links">
          <Link href="/txc/enroll?mode=edit" className="focus-compass-hero__link">
            Edit profile
          </Link>
          <Link href="/txc/enroll?mode=edit" className="focus-compass-hero__link focus-compass-hero__link--accent">
            Refine My Compass →
          </Link>
        </div>
      </div>

      <div className="focus-compass-hero__title-row experience-hero-title-row">
        <div className="focus-compass-hero__copy carbon-panel carbon-panel--hero">
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

        <aside className="focus-compass-hero__metrics carbon-panel carbon-panel--metrics">
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
    </header>
  );
}
