"use client";
// =============================================================================
// EventCompass — Auth Panel
// src/components/auth/AuthPanel.tsx
//
// Orchestrates: IBMLoginButton → LoginForm → MinimalSignupForm → ForgotPasswordForm
// Placed ABOVE the personal experience builder on /enroll.
// User cannot proceed until authenticated.
//
// MinimalSignupForm collects ONLY: firstName, lastName, email, password, org (optional)
// All full Compass intake (goals, tracks, background, consent) happens on /enroll.
// =============================================================================

import { useState }               from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp }                  from "firebase/firestore";
import { auth, db }               from "@/lib/firebase";
import IBMLoginButton             from "@/components/auth/IBMLoginButton";
import LoginForm                  from "@/components/auth/LoginForm";
import ForgotPasswordForm         from "@/components/auth/ForgotPasswordForm";

type AuthView = "login" | "signup" | "forgot";

interface Props {
  onAuthenticated: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

const iS: React.CSSProperties = {
  height: "42px", padding: "0 13px",
  border: "1px solid var(--line)", background: "var(--bg)",
  color: "var(--text)", fontSize: "0.95rem", fontFamily: "inherit",
  outline: "none", width: "100%", boxSizing: "border-box",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--soft)", fontSize: "0.84rem", fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
      <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        or continue with email
      </span>
      <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MinimalSignupForm — only collects identity, not Compass intake
// ─────────────────────────────────────────────────────────────────────────────

function MinimalSignupForm({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}) {
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [org,        setOrg]        = useState("");
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    setError("");
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim())  { setError("Last name is required.");  return; }
    if (!email.trim())     { setError("Email is required.");      return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setSubmitting(true);
    try {
      const cred        = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid         = cred.user.uid;
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

      await updateProfile(cred.user, { displayName });

      await setDoc(
        doc(db, `users/${uid}`),
        {
          uid,
          displayName,
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
          email:        email.trim(),
          organization: org.trim(),
          company:      org.trim(),
          createdAt:    serverTimestamp(),
          updatedAt:    serverTimestamp(),
        },
        { merge: true }
      );

      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Sign-up failed. Please try again.";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists. Try signing in.");
      } else if (msg.includes("invalid-email")) {
        setError("That email address doesn't look right.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <FieldLabel>First name</FieldLabel>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
            placeholder="Maya" style={iS} autoComplete="given-name" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <FieldLabel>Last name</FieldLabel>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
            placeholder="Patel" style={iS} autoComplete="family-name" />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <FieldLabel>Email</FieldLabel>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" style={iS} autoComplete="email" />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <FieldLabel>Password</FieldLabel>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Minimum 6 characters" style={iS} autoComplete="new-password" />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <FieldLabel>
          Organization{" "}
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
        </FieldLabel>
        <input type="text" value={org} onChange={e => setOrg(e.target.value)}
          placeholder="Acme Corp" style={iS} autoComplete="organization" />
      </label>

      {error && (
        <p style={{ color: "#DC2626", fontSize: "0.84rem", margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSignup}
        disabled={submitting}
        style={{
          height: "44px", background: "var(--accent)", color: "var(--accent-text)",
          border: "none", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 600,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting ? 0.6 : 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
      >
        {submitting && (
          <span style={{
            width: 14, height: 14, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
            display: "inline-block", animation: "spin 0.8s linear infinite",
          }} />
        )}
        {submitting ? "Creating account…" : "Create account →"}
      </button>

      <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: 0, textAlign: "center" }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} style={{
          color: "var(--accent)", background: "none", border: "none",
          cursor: "pointer", padding: 0, fontSize: "inherit", fontFamily: "inherit",
        }}>
          Sign in
        </button>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Panel
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthPanel({ onAuthenticated }: Props) {
  const [view,     setView]     = useState<AuthView>("login");
  const [ibmError, setIbmError] = useState("");

  const TITLES: Record<AuthView, string> = {
    login:  "Sign in",
    signup: "Create account",
    forgot: "Reset your password",
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          background: "var(--panel)",
          border:     "1px solid var(--line)",
          padding:    "36px 32px 32px",
          maxWidth:   "480px",
          width:      "100%",
          margin:     "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div className="section-kicker">Compass account</div>
          <h2 style={{
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 520,
            letterSpacing: "-0.035em", margin: "6px 0 8px", color: "var(--text)",
          }}>
            Start with your Compass account
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0, lineHeight: 1.55 }}>
            Save your intent, agenda, recommendations, and connections across the event.
          </p>
        </div>

        {/* IBM SSO — always visible on login/signup views */}
        {view !== "forgot" && (
          <>
            <IBMLoginButton
              onSuccess={() => onAuthenticated()}
              onError={setIbmError}
            />
            {ibmError && (
              <p style={{ color: "#DC2626", fontSize: "0.84rem", margin: "8px 0 0" }}>
                {ibmError}
              </p>
            )}
            <Divider />
          </>
        )}

        {/* View title */}
        <p style={{
          color: "var(--accent)", fontSize: "0.72rem", fontWeight: 680,
          textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px",
        }}>
          {TITLES[view]}
        </p>

        {/* Form switcher */}
        {view === "login" && (
          <LoginForm
            onSuccess={onAuthenticated}
            onForgotPassword={() => setView("forgot")}
            onSwitchToSignup={() => setView("signup")}
          />
        )}
        {view === "signup" && (
          <MinimalSignupForm
            onSuccess={onAuthenticated}
            onSwitchToLogin={() => setView("login")}
          />
        )}
        {view === "forgot" && (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}
      </div>
    </>
  );
}
