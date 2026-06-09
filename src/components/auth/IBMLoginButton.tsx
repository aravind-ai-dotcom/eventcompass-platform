"use client";
// =============================================================================
// EventCompass — IBM Login Button
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
      const { isNewUser } = await signInWithIBM();
      onSuccess?.(isNewUser);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      const msg  = friendlyAuthError(code);
      onError?.(msg);
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
        border:         "1.5px solid #0F62FE",
        background:     loading ? "#0F62FE22" : "#0F62FE",
        color:          "#FFFFFF",
        fontSize:       "0.95rem",
        fontWeight:     650,
        fontFamily:     "inherit",
        letterSpacing:  "-0.01em",
        cursor:         loading ? "default" : "pointer",
        opacity:        loading ? 0.8 : 1,
        transition:     "background 0.15s, opacity 0.15s",
      }}
      aria-label="Continue with IBMid"
    >
      {/* IBM logo mark — inline SVG, no external dep */}
      {!loading && (
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" fill="transparent"/>
          {/* IBM 8-bar logo simplified */}
          <path d="M4 7h24v2H4zM4 11h24v2H4zM8 15h16v2H8zM8 19h16v2H8zM4 23h24v2H4zM4 27h24v2H4z" fill="#FFFFFF"/>
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
        "Continue with IBMid"
      )}
    </button>
  );
}
