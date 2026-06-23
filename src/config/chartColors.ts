/**
 * Neutral chart palette for admin analytics (dark surfaces).
 * Use THEME_VARS in attendee-facing inline styles.
 */
export const CHART_COLORS = {
  primary: "#7c3aed",
  primaryLight: "#a78bfa",
  purple: "#8b5cf6",
  cyan: "#14b8a6",
  green: "#10b981",
  red: "#f87171",
  yellow: "#fbbf24",
  orange: "#fb923c",
  maroon: "#c026d3",
  teal: "#2dd4bf",
} as const;

/** CSS variable references for component inline styles */
export const THEME_VARS = {
  accent: "var(--accent)",
  text: "var(--text)",
  muted: "var(--muted)",
  line: "var(--line)",
  accentBorder: "var(--purple-border)",
  accentBg: "var(--purple-bg)",
} as const;
