"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import SkoAuthPanel from "@/components/sko/SkoAuthPanel";
import SkoProfileErrorPanel from "@/components/sko/SkoProfileErrorPanel";

export default function SkoLoginPage() {
  const { user, profileComplete, loading, profileError, refreshProfile } = useSkoAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !profileError) {
      router.replace(profileComplete ? "/sko/compass" : "/sko/enroll");
    }
  }, [user, profileComplete, loading, profileError, router]);

  if (loading) {
    return <section className="sko-section"><p className="sko-muted">Loading sign in…</p></section>;
  }

  if (profileError) {
    return (
      <SkoProfileErrorPanel
        message={profileError}
        onRetry={() => void refreshProfile()}
      />
    );
  }

  if (user) return null;

  return (
    <section className="sko-login-page">
      <div className="sko-login-card">
        <p className="sko-kicker">IBM Sales Enablement</p>
        <h1>Sign in to SKO Compass</h1>
        <p className="sko-lead">
          Access your SKO2H 2026 briefing, podcasts, and seller momentum tools.
        </p>
        <SkoAuthPanel
          onAuthenticated={(complete) => router.push(complete ? "/sko/compass" : "/sko/enroll")}
        />
        <Link href="/sko/content" className="sko-link-back">← Explore SKO</Link>
      </div>
    </section>
  );
}
