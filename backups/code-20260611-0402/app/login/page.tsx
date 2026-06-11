"use client";
// =============================================================================
// EventCompass — Login Page  /login
//
// Standalone page for direct navigation to sign in / create account.
// Redirects to /experience after auth if user came from there,
// otherwise to /enroll to complete their Compass build.
// =============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPanel    from "@/components/auth/AuthPanel";
import { useAuth }  from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already signed in, send to experience
  useEffect(() => {
    if (!loading && user) {
      router.replace("/experience");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <section className="section no-top-border">
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </section>
    );
  }

  if (user) return null; // redirect in progress

  return (
    <>
      <section className="compact-hero">
        <div className="section-kicker">Compass</div>
        <h1>Start with your Compass account.</h1>
        <p>Sign in to access your personalized TechXchange experience.</p>
      </section>
      <section className="section no-top-border">
        <AuthPanel onAuthenticated={() => router.push("/enroll")} />
      </section>
      <div style={{ height: "64px" }} />
    </>
  );
}
