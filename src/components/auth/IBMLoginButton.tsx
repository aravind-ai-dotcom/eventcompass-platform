"use client";
// =============================================================================
// EventCompass — Enterprise SSO login button
// src/components/auth/IBMLoginButton.tsx
//
// Calls signInWithIBM() from src/lib/auth.ts.
// Requires Firebase Console to be configured with oidc.ibm provider.
// See TODO comments in src/lib/auth.ts for setup instructions.
// =============================================================================

import { useState } from "react";
import { signInWithIBM, friendlyAuthError } from "@/lib/auth";

interface Props {
  onSuccess?: (isNewUser: boolean) => void;
  onError?:   (msg: string) => void;
}

export default function IBMLoginButton({ onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithIBM();
      onSuccess?.(false);
    } catch (err: unknown) {
      onError?.(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            "10px",
        width:          "100%",
        height:         "48px",
        padding:        "0 20px",
        border:         "1.5px solid var(--accent)",
        background:     loading ? "rgb(var(--accent-rgb) / 0.12)" : "var(--accent)",
        color:          "#FFFFFF",
        fontSize:       "0.95rem",
        fontWeight:     650,
        fontFamily:     "inherit",
        letterSpacing:  "-0.01em",
        cursor:         loading ? "default" : "pointer",
        opacity:        loading ? 0.8 : 1,
        transition:     "background 0.15s, opacity 0.15s",
      }}
      aria-label="Continue with enterprise SSO"
    >
      {!loading && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 2a7 7 0 110 14 7 7 0 010-14zm-1 3h2v5h-2V8zm0 6h2v2h-2v-2z" fill="#FFFFFF"/>
        </svg>
      )}
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#FFFFFF",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }} />
          Connecting…
        </span>
      ) : (
        "Continue with SSO"
      )}
    </button>
  );
}
