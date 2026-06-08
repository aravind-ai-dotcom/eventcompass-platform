// =============================================================================
// EventCompass — Print & Export
// src/components/experience/PrintExport.tsx
//
// Phase 9: Print, PDF, and calendar export actions.
// Print + single/full calendar export are functional.
// PDF generation is a visible button — backend phased in later.
// =============================================================================

"use client";

interface Props {
  participantId?: string;
  hasPinnedSessions?: boolean;
}

export default function PrintExport({ participantId, hasPinnedSessions = false }: Props) {
  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  function handleCalendarExport() {
    if (!participantId) {
      alert("Calendar export requires a participant profile.");
      return;
    }
    // Calls the existing iCal API route
    window.location.href = `/api/download-ical?participantId=${participantId}`;
  }

  function handlePDF() {
    // Placeholder — triggers print dialog as PDF fallback until server-side PDF is built
    if (typeof window !== "undefined") {
      alert("PDF export coming soon. For now, use Print → Save as PDF from your browser.");
      window.print();
    }
  }

  const ACTIONS = [
    {
      id:      "print",
      label:   "Print My Experience",
      sub:     "Print-optimised layout",
      icon:    "⎙",
      onClick: handlePrint,
      active:  true,
    },
    {
      id:      "pdf",
      label:   "Download PDF",
      sub:     "Save your experience plan",
      icon:    "↓",
      onClick: handlePDF,
      active:  true,
    },
    {
      id:      "calendar-full",
      label:   "Export Full Schedule",
      sub:     "All sessions → Calendar",
      icon:    "📅",
      onClick: handleCalendarExport,
      active:  hasPinnedSessions,
    },
    {
      id:      "calendar-single",
      label:   "Export Single Session",
      sub:     "Coming soon",
      icon:    "＋",
      onClick: () => {},
      active:  false,
    },
  ];

  return (
    <div
      style={{
        border:     "1px solid var(--line)",
        background: "var(--panel)",
        padding:    "18px 20px",
      }}
    >
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 680, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>
        Save & export
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={action.active ? action.onClick : undefined}
            title={action.sub}
            style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        "6px",
              height:     "36px",
              padding:    "0 14px",
              border:     "1px solid var(--line)",
              background: "transparent",
              color:      action.active ? "var(--soft)" : "var(--muted)",
              fontSize:   "0.84rem",
              fontFamily: "inherit",
              cursor:     action.active ? "pointer" : "default",
              opacity:    action.active ? 1 : 0.5,
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "0.9rem" }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.76rem", margin: "10px 0 0", lineHeight: 1.4 }}>
        PDF generation and ICS export are in development. Print → Save as PDF works today in all browsers.
      </p>
    </div>
  );
}
