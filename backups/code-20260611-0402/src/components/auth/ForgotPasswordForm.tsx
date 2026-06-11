"use client";
// =============================================================================
// EventCompass — Forgot Password Form
// src/components/auth/ForgotPasswordForm.tsx
// =============================================================================

import { useState } from "react";
import { sendPasswordReset } from "@/lib/auth";

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(""); setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch {
      // Always show the same message — don't reveal whether email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ padding: "20px", background: "#DCFCE7", border: "1px solid #15803D", textAlign: "center" }}>
          <p style={{ color: "#15803D", fontWeight: 650, fontSize: "0.95rem", margin: "0 0 6px" }}>Check your inbox</p>
          <p style={{ color: "#166534", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
            If this email is registered, you'll receive a reset link shortly.
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary"
          style={{ fontSize: "0.88rem" }}>
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0, lineHeight: 1.55 }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>Email address</span>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="name@company.com" autoComplete="email"
          style={{
            height: "42px", padding: "0 13px",
            border: "1px solid var(--line)", background: "var(--panel)",
            color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
            outline: "none", width: "100%", boxSizing: "border-box",
          }}
        />
      </label>

      {error && <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading || !email.trim()}
        style={{
          height: "44px", background: loading ? "var(--muted)" : "var(--accent)",
          border: "none", color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 650,
          fontFamily: "inherit", cursor: loading ? "default" : "pointer",
          opacity: !email.trim() ? 0.55 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
        {loading && <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.8s linear infinite" }} />}
        {loading ? "Sending…" : "Reset my password"}
      </button>

      <button type="button" onClick={onBack}
        style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit" }}>
        ← Back to sign in
      </button>
    </form>
  );
}
