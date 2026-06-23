"use client";

import { DonutChart, type DonutSegment } from "@/components/pulse/PulseDonutBox";

const TONE_VAR: Record<NonNullable<DonutSegment["tone"]>, string> = {
  accent: "var(--accent)",
  teal: "#14b8a6",
  purple: "#8b5cf6",
  green: "#10b981",
  gray: "#6f6f6f",
  muted: "var(--line-strong)",
};

interface HomeJourneyTileProps {
  segments: DonutSegment[];
  title?: string;
}

export default function HomeJourneyTile({ segments, title = "FORGE Journey" }: HomeJourneyTileProps) {
  const visible = segments.filter(s => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  const pct = (value: number) => Math.round((value / total) * 100);

  return (
    <div className="home-journey-tile">
      <div className="home-journey-tile__body">
        <div className="home-journey-tile__ring" aria-hidden="true">
          <DonutChart
            segments={visible}
            size={44}
            stroke={6}
            split
            centerFill="var(--surface)"
          />
        </div>
        <dl className="home-journey-tile__rows">
          {visible.map(segment => (
            <div key={segment.label} className="home-journey-tile__row">
              <dt className="home-journey-tile__label">
                <span
                  className="home-journey-tile__dot"
                  style={{ background: TONE_VAR[segment.tone ?? "accent"] }}
                />
                {segment.label}
              </dt>
              <dd className="home-journey-tile__pct">{pct(segment.value)}%</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="home-proof-strip__label home-journey-tile__title">{title}</p>
    </div>
  );
}
