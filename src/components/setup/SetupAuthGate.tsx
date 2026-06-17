"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  checkSetupCredentials,
  hasSetupSession,
  persistSetupSession,
  clearSetupSession,
} from "@/lib/setupAuth";

export default function SetupAuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthed(hasSetupSession());
  }, []);

  if (authed) {
    return (
      <>
        <div className="setup-auth-bar">
          <span>Compass Setup Admin</span>
          <button type="button" className="setup-btn setup-btn--ghost" onClick={() => { clearSetupSession(); setAuthed(false); }}>
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="setup-login">
      <form
        className="setup-login-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (checkSetupCredentials(user, pass)) {
            persistSetupSession();
            setAuthed(true);
            setError("");
          } else {
            setError("Invalid credentials.");
          }
        }}
      >
        <h1>Compass Setup</h1>
        <p>Sign in to manage knowledge, voice, and STT governance.</p>
        <label>
          Username
          <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="setup-error">{error}</p>}
        <button type="submit" className="setup-btn setup-btn--primary">Sign in</button>
      </form>
    </div>
  );
}
