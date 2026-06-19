"use client";
// =============================================================================
// EventCompass — Login Form
// src/components/auth/LoginForm.tsx
// =============================================================================

import { useState } from "react";
import { signInWithEmail, friendlyAuthError } from "@/lib/auth";

interface Props {
  onSuccess:      () => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

function Field({
  label, type = "text", value, onChange, error, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string;
  placeholder?: string; autoComplete?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>{label}</span>
      <input
        type={type} value={value} autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          height: "42px", padding: "0 13px",
          border: `1px solid ${error ? "#DC2626" : "var(--line)"}`,
          background: "var(--panel)", color: "var(--text)",
          fontSize: "0.95rem", fontFamily: "inherit",
          outline: "none", boxSizing: "border-box", width: "100%",
        }}
      />
      {error && <span style={{ color: "#DC2626", fontSize: "0.8rem" }}>{error}</span>}
    </label>
  );
}

export default function LoginForm({ onSuccess, onForgotPassword, onSwitchToSignup }: Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(""); setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label="Email" type="email" value={email} onChange={setEmail}
        placeholder="name@company.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword}
        placeholder="Your password" autoComplete="current-password" />

      {error && (
        <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #DC2626" }}>
          <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onForgotPassword}
          style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: "0.84rem", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={loading || !email || !password}
        style={{
          height: "44px", background: loading ? "var(--muted)" : "var(--accent)",
          border: "none", color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 650,
          fontFamily: "inherit", cursor: loading ? "default" : "pointer",
          opacity: (!email || !password) ? 0.55 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
        {loading && <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.8s linear infinite" }} />}
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.86rem", margin: 0 }}>
        No account?{" "}
        <button type="button" onClick={onSwitchToSignup}
          style={{ background: "none", border: "none", color: "var(--accent)", fontFamily: "inherit", fontSize: "0.86rem", cursor: "pointer", fontWeight: 650 }}>
          Create one
        </button>
      </p>
    </form>
  );
}
