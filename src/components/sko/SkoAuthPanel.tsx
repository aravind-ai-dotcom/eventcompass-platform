"use client";

import { useState } from "react";
import {
  friendlyAuthError,
  sendSkoPasswordReset,
  signInSkoUser,
  signUpSkoUser,
} from "@/lib/skoAuth";

type View = "login" | "signup" | "forgot";

interface Props {
  onAuthenticated: (profileComplete: boolean) => void;
}

const fieldStyle: React.CSSProperties = {
  height: "42px",
  padding: "0 13px",
  border: "1px solid var(--line)",
  background: "var(--panel)",
  color: "var(--text)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function SkoAuthPanel({ onAuthenticated }: Props) {
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [slackHandle, setSlackHandle] = useState("");

  async function handleLogin() {
    setError("");
    setSubmitting(true);
    try {
      const cred = await signInSkoUser(email, password);
      const { getSkoUserProfile } = await import("@/lib/skoAuth");
      const profile = await getSkoUserProfile(cred.user.uid);
      onAuthenticated(Boolean(profile?.profileComplete));
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignup() {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signUpSkoUser({ firstName, lastName, email, slackHandle, password });
      onAuthenticated(false);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter your IBM email first.");
      return;
    }
    setSubmitting(true);
    try {
      await sendSkoPasswordReset(email);
      setMessage("Password reset email sent.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "forgot") {
    return (
      <div className="sko-auth-panel">
        <h2>Forgot password</h2>
        <label className="sko-field">
          <span>IBM email</span>
          <input style={fieldStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        {error && <p className="sko-error">{error}</p>}
        {message && <p className="sko-message">{message}</p>}
        <button type="button" className="sko-btn sko-btn--primary sko-btn--block" disabled={submitting} onClick={() => void handleForgot()}>
          Send reset link
        </button>
        <button type="button" className="sko-link-btn" onClick={() => setView("login")}>Back to sign in</button>
      </div>
    );
  }

  if (view === "signup") {
    return (
      <div className="sko-auth-panel">
        <h2>Create account</h2>
        <div className="sko-field-row">
          <label className="sko-field">
            <span>First name</span>
            <input style={fieldStyle} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </label>
          <label className="sko-field">
            <span>Last name</span>
            <input style={fieldStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
          </label>
        </div>
        <label className="sko-field">
          <span>IBM email</span>
          <input style={fieldStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="sko-field">
          <span>Slack handle</span>
          <input style={fieldStyle} value={slackHandle} onChange={e => setSlackHandle(e.target.value)} placeholder="@you" />
        </label>
        <label className="sko-field">
          <span>Password</span>
          <input style={fieldStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <label className="sko-field">
          <span>Confirm password</span>
          <input style={fieldStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </label>
        {error && <p className="sko-error">{error}</p>}
        <button type="button" className="sko-btn sko-btn--primary sko-btn--block" disabled={submitting} onClick={() => void handleSignup()}>
          Create account
        </button>
        <p className="sko-auth-switch">
          Already have an account?{" "}
          <button type="button" className="sko-link-btn" onClick={() => setView("login")}>Sign in</button>
        </p>
      </div>
    );
  }

  return (
    <div className="sko-auth-panel">
      <label className="sko-field">
        <span>IBM email</span>
        <input style={fieldStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="sko-field">
        <span>Password</span>
        <input style={fieldStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
      </label>
      {error && <p className="sko-error">{error}</p>}
      <button type="button" className="sko-btn sko-btn--primary sko-btn--block" disabled={submitting} onClick={() => void handleLogin()}>
        Sign in
      </button>
      <div className="sko-auth-links">
        <button type="button" className="sko-link-btn" onClick={() => setView("signup")}>Create account</button>
        <button type="button" className="sko-link-btn" onClick={() => setView("forgot")}>Forgot password</button>
      </div>
    </div>
  );
}
