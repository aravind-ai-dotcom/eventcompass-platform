"use client";
// =============================================================================
// EventCompass — Auth Panel
// src/components/auth/AuthPanel.tsx
//
// Orchestrates: IBMLoginButton → LoginForm → SignupForm → ForgotPasswordForm
// Placed ABOVE the personal experience builder on /enroll.
// User cannot proceed until authenticated.
//
// Layout:
//   ┌─────────────────────────────────────┐
//   │  Start with your Compass account    │
//   │  Subtitle                           │
//   │                                     │
//   │  [  Continue with IBMid  ]          │
//   │  ─────────── or ───────────         │
//   │  Login / Signup / Forgot forms      │
//   └─────────────────────────────────────┘
// =============================================================================

import { useState } from "react";
import IBMLoginButton      from "@/components/auth/IBMLoginButton";
import LoginForm           from "@/components/auth/LoginForm";
import SignupForm          from "@/components/auth/SignupForm";
import ForgotPasswordForm  from "@/components/auth/ForgotPasswordForm";

type AuthView = "login" | "signup" | "forgot";

interface Props {
  onAuthenticated: () => void;  // called when user is signed in / signed up
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
      {/* Spinner keyframe — shared with all child forms */}
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
          <SignupForm
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
