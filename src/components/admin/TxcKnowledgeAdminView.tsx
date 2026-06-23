"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { txcKnowledgeCategories } from "@/data/seeds/txcKnowledgeSeed";
import {
  checkTxcAdminCredentials,
  clearTxcAdminSession,
  hasTxcAdminSession,
  persistTxcAdminSession,
} from "@/lib/txcAdminSession";
import {
  categoryLabelForRecord,
  downloadVoiceKnowledgeWorkbook,
  sortVoiceKnowledgeRecords,
  summarizeVoiceKnowledge,
} from "@/lib/txcKnowledgeExport";
import { voiceKnowledgeNeedsReview } from "@/lib/voiceKnowledgeResponse";
import { loadUnifiedVoiceKnowledge } from "@/services/knowledge/txcFaqKnowledgeService";
import type { VoiceKnowledgeCategoryMeta, VoiceKnowledgeRecord } from "@/types/voiceKnowledge";
import { CHART_COLORS } from "@/config/chartColors";

const S = {
  bg: "#161616",
  panel: "#1f1f1f",
  text: "#f4f4f4",
  soft: "#e0e0e0",
  muted: "#a8a8a8",
  dim: "#6f6f6f",
  line: "#393939",
};

const fieldStyle: CSSProperties = {
  height: "36px",
  padding: "0 12px",
  background: "transparent",
  border: `1px solid ${S.line}`,
  color: S.text,
  fontSize: "0.86rem",
  fontFamily: "inherit",
  minWidth: 0,
};

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: S.panel, border: `1px solid ${S.line}`, padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, tone = CHART_COLORS.primaryLight }: { label: string; value: number; tone?: string }) {
  return (
    <Panel style={{ padding: "16px 18px" }}>
      <p style={{ margin: "0 0 8px", color: S.muted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: tone, fontSize: "1.45rem", fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value.toLocaleString()}
      </p>
    </Panel>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (checkTxcAdminCredentials(username, password)) {
      persistTxcAdminSession();
      onSuccess();
      return;
    }
    setError("Invalid credentials.");
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "grid", placeItems: "center", padding: "24px" }}>
      <Panel style={{ width: "100%", maxWidth: "420px" }}>
        <p style={{ margin: "0 0 6px", color: CHART_COLORS.primaryLight, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          TXC Admin
        </p>
        <h1 style={{ margin: "0 0 16px", color: S.text, fontSize: "1.35rem", fontWeight: 600 }}>TXC Knowledge Admin</h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", color: S.muted, fontSize: "0.78rem" }}>
            Username
            <input value={username} onChange={e => setUsername(e.target.value)} style={fieldStyle} autoComplete="username" />
          </label>
          <label style={{ display: "grid", gap: "6px", color: S.muted, fontSize: "0.78rem" }}>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={fieldStyle} autoComplete="current-password" />
          </label>
          {error && <p style={{ margin: 0, color: "#ff8389", fontSize: "0.82rem" }}>{error}</p>}
          <button type="submit" style={{ height: "40px", border: `1px solid ${CHART_COLORS.primary}`, background: "rgb(var(--accent-rgb) / 0.12)", color: CHART_COLORS.primaryLight, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Sign in
          </button>
        </form>
      </Panel>
    </div>
  );
}

export default function TxcKnowledgeAdminView() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [records, setRecords] = useState<VoiceKnowledgeRecord[]>([]);
  const [categories, setCategories] = useState<VoiceKnowledgeCategoryMeta[]>(txcKnowledgeCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [redirectFilter, setRedirectFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    setMounted(true);
    setLoggedIn(hasTxcAdminSession());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadUnifiedVoiceKnowledge();
      setRecords(data.records);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn && mounted) void refresh();
  }, [loggedIn, mounted, refresh]);

  const summary = useMemo(() => summarizeVoiceKnowledge(records, categories), [records, categories]);

  const redirectTypes = useMemo(
    () => [...new Set(records.map(r => r.redirect_type ?? "answer"))].sort(),
    [records],
  );
  const sources = useMemo(
    () => [...new Set(records.map(r => r.source ?? "compass_seed"))].sort(),
    [records],
  );
  const intentCategories = useMemo(
    () => [...new Set(records.map(r => r.intent_category ?? r.faq_category_id ?? r.category))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortVoiceKnowledgeRecords(records, categories).filter(record => {
      const cat = record.intent_category ?? record.faq_category_id ?? record.category;
      if (categoryFilter !== "all" && cat !== categoryFilter) return false;
      if (redirectFilter !== "all" && (record.redirect_type ?? "answer") !== redirectFilter) return false;
      if (sourceFilter !== "all" && (record.source ?? "compass_seed") !== sourceFilter) return false;
      if (activeFilter === "active" && !record.enabled) return false;
      if (activeFilter === "inactive" && record.enabled) return false;
      if (!q) return true;
      return (
        record.title.toLowerCase().includes(q) ||
        record.response.toLowerCase().includes(q) ||
        (record.display_response ?? "").toLowerCase().includes(q) ||
        record.trigger_phrases.some(p => p.toLowerCase().includes(q)) ||
        (record.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    });
  }, [records, categories, search, categoryFilter, redirectFilter, sourceFilter, activeFilter]);

  function handleExport() {
    downloadVoiceKnowledgeWorkbook(records, categories, "txc-knowledge.xlsx");
  }

  if (!mounted) return <div style={{ minHeight: "100vh", background: S.bg }} />;
  if (!loggedIn) return <AdminLogin onSuccess={() => setLoggedIn(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, padding: "24px 28px 40px" }}>
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
        <div>
          <p style={{ margin: "0 0 6px", color: CHART_COLORS.primaryLight, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            TXC Admin · Voice Compass
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: "1.6rem", fontWeight: 600 }}>TXC Knowledge Admin</h1>
          <p style={{ margin: 0, color: S.muted, maxWidth: "52rem", lineHeight: 1.55, fontSize: "0.92rem" }}>
            Unified Voice Compass knowledge — compact voice answers, official FAQ redirects, and Guest Services routing.
            Firestore: <code style={{ color: S.soft }}>organizations/ibm/events/txc2026/voice_knowledge</code>
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-start" }}>
          <Link href="/txc/admin" style={{ display: "inline-flex", alignItems: "center", height: "36px", padding: "0 14px", border: `1px solid ${S.line}`, color: S.soft, textDecoration: "none", fontSize: "0.82rem" }}>
            ← Admin Console
          </Link>
          <button type="button" onClick={() => void refresh()} style={{ height: "36px", padding: "0 14px", border: `1px solid ${S.line}`, background: "transparent", color: S.soft, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
            Refresh
          </button>
          <button type="button" onClick={handleExport} disabled={records.length === 0} style={{ height: "36px", padding: "0 14px", border: `1px solid ${CHART_COLORS.primary}`, background: "rgb(var(--accent-rgb) / 0.12)", color: CHART_COLORS.primaryLight, cursor: records.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600, opacity: records.length === 0 ? 0.5 : 1 }}>
            Export Knowledge XLSX
          </button>
          <button type="button" onClick={() => { clearTxcAdminSession(); setLoggedIn(false); }} style={{ height: "36px", padding: "0 14px", border: `1px solid ${S.line}`, background: "transparent", color: S.muted, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <Panel style={{ marginBottom: "18px", borderColor: "rgba(218,30,40,0.35)", background: "rgba(218,30,40,0.08)" }}>
          <p style={{ margin: 0, color: "#ff8389", fontSize: "0.86rem" }}>{error}</p>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Total voice knowledge" value={summary.total} />
        <StatCard label="Active records" value={summary.active} tone={CHART_COLORS.green} />
        <StatCard label="Categories" value={summary.categories} tone={CHART_COLORS.cyan} />
        <StatCard label="Direct answers" value={summary.directAnswer} />
        <StatCard label="Official FAQ redirects" value={summary.officialFaq} tone={CHART_COLORS.purple} />
        <StatCard label="Guest Services redirects" value={summary.guestServices} tone={CHART_COLORS.orange} />
        <StatCard label="External site redirects" value={summary.externalSite} />
        <StatCard label="Missing utterances" value={summary.missingUtterances} tone={CHART_COLORS.orange} />
        <StatCard label="Low priority" value={summary.lowPriority} />
        <StatCard label="Inactive" value={summary.inactive} />
      </div>

      <Panel style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search question, response, utterances…" style={{ ...fieldStyle, flex: "1 1 240px" }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...fieldStyle, minWidth: "180px" }}>
            <option value="all">All categories</option>
            {intentCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={redirectFilter} onChange={e => setRedirectFilter(e.target.value)} style={{ ...fieldStyle, minWidth: "160px" }}>
            <option value="all">All redirect types</option>
            {redirectTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ ...fieldStyle, minWidth: "160px" }}>
            <option value="all">All sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as "all" | "active" | "inactive")} style={{ ...fieldStyle, minWidth: "130px" }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span style={{ color: S.dim, fontSize: "0.82rem" }}>Showing {filtered.length} of {records.length}</span>
        </div>
      </Panel>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ margin: 0, padding: "24px", color: S.dim, fontSize: "0.86rem" }}>Loading voice knowledge from Firestore…</p>
        ) : filtered.length === 0 ? (
          <p style={{ margin: 0, padding: "24px", color: S.dim, fontSize: "0.86rem" }}>No records match the current filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#262626", borderBottom: `1px solid ${S.line}` }}>
                  {["Category", "Intent", "Question", "Voice Response", "Redirect", "Utterances", "Tags", "Priority", "Source", "Active"].map(header => (
                    <th key={header} style={{ textAlign: "left", padding: "12px 14px", color: S.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const issues = voiceKnowledgeNeedsReview(record);
                  return (
                    <tr key={record.id} style={{ borderBottom: `1px solid ${S.line}`, background: issues.length > 0 ? "rgba(255,131,43,0.04)" : undefined }}>
                      <td style={{ padding: "12px 14px", color: S.soft, verticalAlign: "top", whiteSpace: "nowrap" }}>
                        {categoryLabelForRecord(record, categories)}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.muted, verticalAlign: "top", fontSize: "0.76rem" }}>
                        {record.intent ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.text, verticalAlign: "top", minWidth: "200px" }}>
                        {record.title}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.soft, verticalAlign: "top", minWidth: "260px", lineHeight: 1.45 }}>
                        {record.response}
                      </td>
                      <td style={{ padding: "12px 14px", color: CHART_COLORS.primaryLight, verticalAlign: "top", whiteSpace: "nowrap" }}>
                        {record.redirect_type ?? "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.muted, verticalAlign: "top", minWidth: "180px", fontSize: "0.76rem" }}>
                        {record.trigger_phrases.slice(0, 3).join(" · ")}
                        {record.trigger_phrases.length > 3 && ` (+${record.trigger_phrases.length - 3})`}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.muted, verticalAlign: "top", fontSize: "0.76rem" }}>
                        {(record.tags ?? []).join(", ")}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.text, verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {record.priority ?? 50}
                      </td>
                      <td style={{ padding: "12px 14px", color: S.muted, verticalAlign: "top", fontSize: "0.76rem" }}>
                        {record.source ?? "compass_seed"}
                      </td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <span style={{ display: "inline-flex", padding: "2px 8px", border: `1px solid ${record.enabled ? CHART_COLORS.green : S.line}`, color: record.enabled ? "#42be65" : S.dim, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {record.enabled ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
