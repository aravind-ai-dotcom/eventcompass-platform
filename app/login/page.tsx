"use client";
// =============================================================================
// EventCompass — Login Page  /login
//
// New-user-first onboarding: prominent "Build My Compass" path above sign-in.
// Redirects to /experience if already authenticated.
// =============================================================================

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPanel    from "@/components/auth/AuthPanel";
import { useAuth }  from "@/context/AuthContext";

const ONBOARDING_STEPS = [
  "Tell Compass what matters to you.",
  "Discover sessions, people, and certifications.",
  "Build your personalized TechXchange experience.",
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  if (user) return null;

  return (
    <>
      <section className="login-onboard" aria-labelledby="login-onboard-heading">
        <div className="section-kicker">Get started</div>
        <h1 id="login-onboard-heading">New to Compass?</h1>
        <p className="login-onboard-lead">
          Build your attendee profile, discover sessions, find experts, and create
          your personalized TechXchange experience.
        </p>

        <ol className="login-steps" aria-label="How to get started">
          {ONBOARDING_STEPS.map((step, i) => (
            <li key={step}>
              <span className="login-step-num" aria-hidden="true">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <Link href="/enroll" className="btn-primary login-onboard-cta">
          Build My Compass →
        </Link>
      </section>

      <section className="login-signin" aria-labelledby="login-signin-heading">
        <div className="login-signin-head">
          <h2 id="login-signin-heading">Already enrolled?</h2>
          <p>Sign in to open your personalized TechXchange experience.</p>
        </div>
        <AuthPanel onAuthenticated={() => router.push("/enroll")} />
      </section>

      <div style={{ height: "64px" }} />
    </>
  );
}
