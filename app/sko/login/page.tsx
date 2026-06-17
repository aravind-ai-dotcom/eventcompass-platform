"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import SkoAuthPanel from "@/components/sko/SkoAuthPanel";

export default function SkoLoginPage() {
  const { user, profileComplete, loading } = useSkoAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(profileComplete ? "/sko/compass" : "/sko/enroll");
    }
  }, [user, profileComplete, loading, router]);

  if (loading || user) {
    return <section className="sko-section"><p className="sko-muted">Loading…</p></section>;
  }

  return (
    <section className="sko-login-page">
      <div className="sko-login-card">
        <p className="sko-kicker">IBM Sales Enablement</p>
        <h1>Sign in to continue</h1>
        <p className="sko-lead">Access your SKO Compass briefing, podcasts, and seller momentum tools.</p>
        <SkoAuthPanel
          onAuthenticated={(complete) => router.push(complete ? "/sko/compass" : "/sko/enroll")}
        />
        <Link href="/sko" className="sko-link-back">← Back to SKO home</Link>
      </div>
    </section>
  );
}
