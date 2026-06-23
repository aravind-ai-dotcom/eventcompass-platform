"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { TXC_EVENT_ID } from "@/lib/compassEventPaths";
import {
  loadRecommendationBalanceConfig,
  saveRecommendationBalanceConfig,
} from "@/services/recommendationBalanceConfig";
import {
  DEFAULT_PILLAR_WEIGHTS,
  type PillarWeights,
} from "@/types/recommendationBalance";

const S = {
  bg: "#161616",
  panel: "#1f1f1f",
  text: "#f4f4f4",
  muted: "#a8a8a8",
  line: "#393939",
  accent: "#78a9ff",
};

const IBM = { blue: "#0f62fe" };

const fieldLabel: CSSProperties = {
  color: S.muted,
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "5px",
};

const field: CSSProperties = {
  width: "100%",
  maxWidth: "120px",
  height: "36px",
  padding: "0 12px",
  background: "transparent",
  border: `1px solid ${S.line}`,
  color: S.text,
  fontSize: "0.88rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const PILLAR_ROWS: Array<{ key: keyof PillarWeights; label: string; hint: string }> = [
  { key: "learning", label: "Learning weight", hint: "Sessions, labs, breakouts, learning paths" },
  { key: "people", label: "People weight", hint: "Guides, experts, networking matches" },
  { key: "community", label: "Community weight", hint: "Meetups, huddles, roundtables" },
  { key: "fun", label: "Fun weight", hint: "Social moments, keynotes, celebrations" },
];

export function RecommendationBalanceAdminView() {
  const [weights, setWeights] = useState<PillarWeights>(DEFAULT_PILLAR_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const w = await loadRecommendationBalanceConfig(TXC_EVENT_ID);
    setWeights(w);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveRecommendationBalanceConfig(TXC_EVENT_ID, weights, "admin");
      setMessage("Saved recommendation balance weights.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setWeights(DEFAULT_PILLAR_WEIGHTS);
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: S.accent, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 6px" }}>
          Experience
        </p>
        <h2 style={{ color: S.text, fontSize: "1.65rem", fontWeight: 520, letterSpacing: "-0.035em", margin: "0 0 6px" }}>
          Recommendation balance
        </h2>
        <p style={{ color: S.muted, fontSize: "0.88rem", margin: 0, lineHeight: 1.5, maxWidth: "56ch" }}>
          Tune how strongly Compass surfaces each pillar when scores are similar. Defaults (1.0 each) produce an even mix across learning, people, community, and fun.
        </p>
      </div>

      <div style={{ background: S.panel, border: `1px solid ${S.line}`, padding: "20px", maxWidth: "520px" }}>
        {loading ? (
          <p style={{ color: S.muted, margin: 0 }}>Loading…</p>
        ) : (
          <>
            {PILLAR_ROWS.map(row => (
              <label key={row.key} style={{ display: "block", marginBottom: "18px" }}>
                <span style={fieldLabel}>{row.label}</span>
                <input
                  type="number"
                  min={0.1}
                  max={3}
                  step={0.1}
                  style={field}
                  value={weights[row.key]}
                  onChange={e =>
                    setWeights(prev => ({
                      ...prev,
                      [row.key]: Number(e.target.value) || 1,
                    }))
                  }
                />
                <span style={{ display: "block", marginTop: "4px", color: S.muted, fontSize: "0.78rem" }}>
                  {row.hint}
                </span>
              </label>
            ))}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  background: IBM.blue,
                  border: "none",
                  color: "#fff",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  cursor: saving ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                {saving ? "Saving…" : "Save weights"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: `1px solid ${S.line}`,
                  color: S.muted,
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Reset to defaults
              </button>
            </div>
          </>
        )}
      </div>

      {message && (
        <p style={{ color: S.muted, fontSize: "0.84rem", marginTop: "14px" }}>{message}</p>
      )}
    </div>
  );
}
