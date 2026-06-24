"use client";
// =============================================================================
// EventCompass — Login Page  /login
// New-user-first: Build My Compass is the primary path.
// =============================================================================

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPanel from "@/components/auth/AuthPanel";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/txc/experience");
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
      <section className="login-onboard login-onboard-primary" aria-labelledby="login-onboard-heading">
        <div className="section-kicker">Get started</div>
        <h1 id="login-onboard-heading">New to Compass?</h1>
        <p className="login-onboard-lead">
          Build your personalized TechXchange experience.
        </p>
        <Link href="/txc/enroll" className="btn-primary login-onboard-cta">
          Build My Compass →
        </Link>
      </section>

      <section className="login-signin" aria-labelledby="login-signin-heading" id="sign-in">
        <div className="login-signin-head">
          <h2 id="login-signin-heading">Already have an account?</h2>
          <p>Sign in to open your personalized TechXchange experience.</p>
        </div>
        <AuthPanel onAuthenticated={() => router.push("/txc/experience")} />
      </section>

      <div style={{ height: "64px" }} />
    </>
  );
}
