"use client";

import {
  pctOf,
  TXC_HISTORY_EVENTS,
  TXC_HISTORY_LABEL_BY_ID,
  type IdentityAggregate,
} from "@/lib/identitySignals";
import { FORGE_EVENT, FORGE_LABELS } from "@/config/forgeBrand";

const IBM = {
  text: "#f4f4f4",
  muted: "#a8a8a8",
  dim: "#6f6f6f",
  accent: "#78a9ff",
  border: "rgba(255,255,255,0.12)",
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${IBM.border}`, padding: "18px 20px" }}>
      {children}
    </div>
  );
}

function CountRow({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "6px 0", borderBottom: `1px solid ${IBM.border}` }}>
      <span style={{ color: IBM.muted, fontSize: "0.84rem" }}>{label}</span>
      <span style={{ color: IBM.text, fontSize: "0.84rem", fontVariantNumeric: "tabular-nums" }}>
        {count.toLocaleString()} <span style={{ color: IBM.dim }}>({pctOf(count, total)}%)</span>
      </span>
    </div>
  );
}

function Card({
  title,
  rows,
  total,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
  total: number;
}) {
  return (
    <Panel>
      <p style={{ color: IBM.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
        {title}
      </p>
      {rows.map(row => (
        <CountRow key={row.label} label={row.label} count={row.count} total={total} />
      ))}
    </Panel>
  );
}

interface IdentitySignalsAdminViewProps {
  identitySignals: IdentityAggregate;
  totalParticipants: number;
}

export default function IdentitySignalsAdminView({
  identitySignals,
  totalParticipants,
}: IdentitySignalsAdminViewProps) {
  const total = totalParticipants || identitySignals.respondents || 1;

  const historyRows = TXC_HISTORY_EVENTS.map(event => ({
    label: TXC_HISTORY_LABEL_BY_ID.get(event.id) ?? event.label,
    count: identitySignals.history[event.id] ?? 0,
  })).filter(row => row.count > 0);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: IBM.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          Attendees
        </p>
        <h1 style={{ color: IBM.text, fontSize: "1.75rem", fontWeight: 520, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Identity Signals
        </h1>
        <p style={{ color: IBM.muted, fontSize: "0.9rem", margin: 0, maxWidth: "52rem", lineHeight: 1.5 }}>
          {FORGE_LABELS.guide} status, {FORGE_EVENT.name} alumni history, and attendance memory preferences — raw counts for operators.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        <Card
          title={`${FORGE_EVENT.name} Alumni Status`}
          total={total}
          rows={[
            { label: "Returning", count: identitySignals.alumni.returning },
            { label: "First Time", count: identitySignals.alumni.firstTime },
            { label: "No Response", count: identitySignals.alumni.noResponse },
          ]}
        />
        <Card
          title="Previous Event Breakdown"
          total={total}
          rows={
            historyRows.length > 0
              ? historyRows
              : [{ label: "No prior events recorded", count: 0 }]
          }
        />
        <Card
          title={`${FORGE_LABELS.guide} Status`}
          total={total}
          rows={[
            { label: FORGE_LABELS.guide, count: identitySignals.champion.ibm_champion },
            { label: `Former ${FORGE_LABELS.guide}`, count: identitySignals.champion.former_champion },
            { label: `${FORGE_LABELS.guide} Nominee`, count: identitySignals.champion.champion_nominee },
            { label: "Interested", count: identitySignals.champion.interested },
            { label: "Not Applicable", count: identitySignals.champion.not_applicable },
            { label: "No Response", count: identitySignals.champion.no_response },
          ]}
        />
        <Card
          title="Attendance Memory"
          total={total}
          rows={[
            { label: "Enabled", count: identitySignals.memory.enabled },
            { label: "Disabled", count: identitySignals.memory.disabled },
            { label: "No Response", count: identitySignals.memory.noResponse },
          ]}
        />
      </div>
    </div>
  );
}
