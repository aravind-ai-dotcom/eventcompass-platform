"use client";
// =============================================================================
// EventCompass — Signup Form
// src/components/auth/SignupForm.tsx
// =============================================================================

import { useState } from "react";
import { signUpWithEmail, friendlyAuthError } from "@/lib/auth";
import { FORGE_LABELS } from "@/config/forgeBrand";

const ROLES = [
  "Client / Customer", "Developer", "Architect", "Data Scientist",
  "Security Professional", "IT Operations", "Business Leader",
  "Student", FORGE_LABELS.guide, FORGE_LABELS.attendees.replace(/s$/, ""), "Partner",
];
const PERSONAS = [
  "Technical Practitioner", "Architect", "Business Decision Maker",
  "IT Leader", "Developer", "Student / Early Career",
];

interface Props {
  onSuccess:       () => void;
  onSwitchToLogin: () => void;
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
      <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>{label} <span style={{ color: "#DC2626" }}>*</span></span>
      <input type={type} value={value} autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          height: "42px", padding: "0 13px",
          border: `1px solid ${error ? "#DC2626" : "var(--line)"}`,
          background: "var(--panel)", color: "var(--text)",
          fontSize: "0.95rem", fontFamily: "inherit",
          outline: "none", width: "100%", boxSizing: "border-box",
        }}
      />
      {error && <span style={{ color: "#DC2626", fontSize: "0.79rem" }}>{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; error?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>{label} <span style={{ color: "#DC2626" }}>*</span></span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          height: "42px", padding: "0 13px",
          border: `1px solid ${error ? "#DC2626" : "var(--line)"}`,
          background: "var(--panel)", color: value ? "var(--text)" : "var(--muted)",
          fontSize: "0.95rem", fontFamily: "inherit",
          outline: "none", width: "100%", boxSizing: "border-box",
        }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span style={{ color: "#DC2626", fontSize: "0.79rem" }}>{error}</span>}
    </label>
  );
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8)              return "At least 8 characters required.";
  if (!/[A-Z]/.test(pw))          return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(pw))          return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(pw))          return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw))   return "Include at least one symbol (e.g. @, !, #).";
  return null;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: Props) {
  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [organization, setOrganization] = useState("");
  const [role,         setRole]         = useState("");
  const [persona,      setPersona]      = useState("");
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [globalError,  setGlobalError]  = useState("");
  const [loading,      setLoading]      = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim())          e.fullName     = "Full name is required.";
    if (!/\S+@\S+\.\S+/.test(email)) e.email      = "Enter a valid email address.";
    const pwErr = validatePassword(password);
    if (pwErr)                     e.password     = pwErr;
    if (password !== confirmPw)    e.confirmPw    = "Passwords do not match.";
    if (!organization.trim())      e.organization = "Organization is required.";
    if (!role)                     e.role         = "Please select your role.";
    if (!persona)                  e.persona      = "Please select a persona.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setGlobalError(""); setLoading(true);
    try {
      await signUpWithEmail({
    displayName: fullName,
    email: email.trim(),
    password,
    organization,
    role,
    persona,
});      onSuccess();
    } catch (err: unknown) {
      setGlobalError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Field label="Full name"     value={fullName}     onChange={setFullName}     error={errors.fullName}     placeholder="Full name"          autoComplete="name" />
      <Field label="Email"         type="email"
             value={email}        onChange={setEmail}          error={errors.email}        placeholder="name@company.com"    autoComplete="email" />
      <Field label="Organization"  value={organization} onChange={setOrganization} error={errors.organization} placeholder="Acme Corporation" />
      <SelectField label="Role"    value={role}         onChange={setRole}    options={ROLES}    error={errors.role} />
      <SelectField label="Persona" value={persona}      onChange={setPersona} options={PERSONAS} error={errors.persona} />
      <Field label="Password"      type="password"
             value={password}     onChange={setPassword}       error={errors.password}     placeholder="Min 8 chars, upper, number, symbol" autoComplete="new-password" />
      <Field label="Confirm password" type="password"
             value={confirmPw}    onChange={setConfirmPw}      error={errors.confirmPw}    placeholder="Repeat password"     autoComplete="new-password" />

      {/* Password strength hint */}
      {password && !errors.password && (
        <p style={{ color: "#15803D", fontSize: "0.78rem", margin: 0 }}>✓ Password looks good</p>
      )}

      {globalError && (
        <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #DC2626" }}>
          <p style={{ color: "#DC2626", fontSize: "0.88rem", margin: 0 }}>{globalError}</p>
        </div>
      )}

      <button type="submit" disabled={loading}
        style={{
          height: "44px", background: loading ? "var(--muted)" : "var(--accent)",
          border: "none", color: "#FFFFFF", fontSize: "0.95rem", fontWeight: 650,
          fontFamily: "inherit", cursor: loading ? "default" : "pointer", marginTop: "4px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
        {loading && <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.8s linear infinite" }} />}
        {loading ? "Creating account…" : "Create Compass account"}
      </button>

      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.86rem", margin: 0 }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}
          style={{ background: "none", border: "none", color: "var(--accent)", fontFamily: "inherit", fontSize: "0.86rem", cursor: "pointer", fontWeight: 650 }}>
          Sign in
        </button>
      </p>
    </form>
  );
}
