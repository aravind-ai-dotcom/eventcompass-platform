"use client";

export type DonutTone =
  | "accent"
  | "teal"
  | "purple"
  | "green"
  | "gray"
  | "muted";

export interface DonutSegment {
  label: string;
  value: number;
  tone?: DonutTone;
}

const TONE_VAR: Record<DonutTone, string> = {
  accent: "var(--accent)",
  teal: "#14b8a6",
  purple: "#8b5cf6",
  green: "#10b981",
  gray: "#6f6f6f",
  muted: "var(--line-strong)",
};

interface PulseDonutBoxProps {
  title: string;
  lead?: string;
  segments: DonutSegment[];
  compact?: boolean;
  /** Two-segment split ring — balanced yin-yang style layout. */
  split?: boolean;
  /** Nested inside another stat column (Home proof strip). */
  embed?: boolean;
  /** Compact inline ring + legend for Home proof strip. */
  mini?: boolean;
}

function DonutChart({
  segments,
  size = 120,
  stroke = 16,
  split = false,
  centerFill = "var(--panel)",
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  split?: boolean;
  centerFill?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  if (split && segments.length === 2) {
    const [a, b] = segments;
    const aPct = a.value / total;
    const aDash = aPct * circumference;
    const bDash = circumference - aDash;

    return (
      <svg
        className="pulse-donut__svg pulse-donut__svg--split"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          opacity={0.45}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={TONE_VAR[a.tone ?? "accent"]}
          strokeWidth={stroke}
          strokeDasharray={`${aDash} ${circumference - aDash}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={TONE_VAR[b.tone ?? "teal"]}
          strokeWidth={stroke}
          strokeDasharray={`${bDash} ${circumference - bDash}`}
          strokeLinecap="butt"
          transform={`rotate(${-90 + aPct * 360} ${cx} ${cy})`}
        />
        <circle cx={cx} cy={cy} r={radius - stroke * 0.55} fill={centerFill} />
      </svg>
    );
  }

  return (
    <svg
      className="pulse-donut__svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
        opacity={0.55}
      />
      {segments.map((segment, index) => {
        const fraction = segment.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const startAngle = (segments.slice(0, index).reduce((sum, s) => sum + s.value, 0) / total) * 360;
        const rotation = -90 + startAngle;
        const color = TONE_VAR[segment.tone ?? "accent"];

        return (
          <circle
            key={`${segment.label}-${index}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

export { DonutChart };

export default function PulseDonutBox({
  title,
  lead,
  segments,
  compact = false,
  split = false,
  embed = false,
  mini = false,
}: PulseDonutBoxProps) {
  const visible = segments.filter(s => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  const pct = (value: number) => Math.round((value / total) * 100);
  const chartSize = mini ? 52 : embed ? 64 : compact ? 88 : 120;
  const chartStroke = mini ? 7 : embed ? 9 : compact ? 12 : 16;
  const useSplit = split && visible.length === 2;

  const legend = (
    <ul
      className={[
        "pulse-donut-box__legend",
        useSplit ? " pulse-donut-box__legend--split" : "",
        visible.length > 2 ? " pulse-donut-box__legend--dense" : "",
        embed ? " pulse-donut-box__legend--embed" : "",
        mini ? " pulse-donut-box__legend--mini" : "",
      ].join("")}
    >
      {visible.map(segment => (
        <li key={segment.label}>
          <span
            className="pulse-donut-box__swatch"
            style={{ background: TONE_VAR[segment.tone ?? "accent"] }}
            aria-hidden="true"
          />
          <span className="pulse-donut-box__legend-copy">
            <span className="pulse-donut-box__legend-label">{segment.label}</span>
            <span className="pulse-donut-box__legend-pct">{pct(segment.value)}%</span>
          </span>
        </li>
      ))}
    </ul>
  );

  const chart = (
    <div
      className={[
        "pulse-donut-box__chart-wrap",
        embed ? " pulse-donut-box__chart-wrap--embed" : "",
        mini ? " pulse-donut-box__chart-wrap--mini" : "",
      ].join("")}
    >
      <DonutChart
        segments={visible}
        size={chartSize}
        stroke={chartStroke}
        split={useSplit}
      />
    </div>
  );

  return (
    <article
      className={[
        "pulse-donut-box",
        compact ? " pulse-donut-box--compact" : "",
        useSplit ? " pulse-donut-box--split" : "",
        embed ? " pulse-donut-box--embed" : "",
        mini ? " pulse-donut-box--mini" : "",
      ].join("")}
    >
      <div className={`pulse-donut-box__head${embed ? " pulse-donut-box__head--embed" : ""}`}>
        <h3 className="pulse-donut-box__title">{title}</h3>
        {lead && !embed && <p className="pulse-donut-box__lead">{lead}</p>}
      </div>

      {mini ? (
        <div className="pulse-donut-box__inline">
          {chart}
          {legend}
        </div>
      ) : (
        <>
          {chart}
          {legend}
        </>
      )}
    </article>
  );
}

export function alumniDonutSegments(returning: number, firstTime: number): DonutSegment[] {
  return [
    { label: "Returning Attendees", value: returning, tone: "accent" as const },
    { label: "First-Time Attendees", value: firstTime, tone: "teal" as const },
  ].filter(s => s.value > 0);
}

export function championDonutSegments(
  guides: number,
  former: number,
  interested: number,
  nominee: number,
): DonutSegment[] {
  return [
    { label: "Guides", value: guides, tone: "accent" as const },
    { label: "Former Guides", value: former, tone: "purple" as const },
    { label: "Nominees", value: nominee, tone: "teal" as const },
    { label: "Rising Guides", value: interested, tone: "green" as const },
  ].filter(s => s.value > 0);
}

/** Public pulse — only show when at least two guide buckets have signal. */
export function hasChampionCommunityMix(
  guides: number,
  former: number,
  interested: number,
  nominee: number,
): boolean {
  const buckets = [guides, former, interested, nominee].filter(n => n > 0);
  return buckets.length >= 2;
}
