"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import SkoChineseBriefingBar from "@/components/sko/SkoChineseBriefingBar";
import SkoPodcastModule from "@/components/sko/SkoPodcastModule";
import SkoProfileErrorPanel from "@/components/sko/SkoProfileErrorPanel";
import SkoProfileDebugPanel from "@/components/sko/SkoProfileDebugPanel";
import { isChineseBriefingEnabled, labelForKey } from "@/lib/skoLocale";
import { getDemoBrief, getDemoPodcasts } from "@/lib/skoDemoContent";
import {
  listContentClips,
  listContentItems,
  listUserBriefs,
  listUserPodcasts,
} from "@/services/sko/skoFirestoreService";
import type { SkoBrief, SkoContentClip, SkoContentItem, SkoPodcast } from "@/types/sko";

export default function SkoCompassView() {
  const {
    user,
    profile,
    profileComplete,
    loading,
    profileError,
    refreshProfile,
  } = useSkoAuth();
  const router = useRouter();
  const [briefs, setBriefs] = useState<SkoBrief[]>([]);
  const [podcasts, setPodcasts] = useState<SkoPodcast[]>([]);
  const [clips, setClips] = useState<SkoContentClip[]>([]);
  const [agenda, setAgenda] = useState<SkoContentItem[]>([]);
  const [contentReady, setContentReady] = useState(false);

  // 1. Not signed in → /login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sko/login");
    }
  }, [loading, user, router]);

  // 2–3. Signed in but no / incomplete profile → /enroll (not an error)
  useEffect(() => {
    if (!loading && user && !profileError && !profileComplete) {
      router.replace("/sko/enroll");
    }
  }, [loading, user, profileComplete, profileError, router]);

  // 4. Load compass content when profile is complete
  useEffect(() => {
    if (!user || !profileComplete || !profile) return;
    setContentReady(false);
    void (async () => {
      try {
        const geo = profile.geoId;
        const [b, p, c, items] = await Promise.all([
          listUserBriefs(user.uid),
          listUserPodcasts(user.uid),
          listContentClips(),
          listContentItems(undefined, geo ? String(geo) : undefined),
        ]);
        setBriefs(b.length ? b : [getDemoBrief(profile.geoId, profile.marketId)]);
        setPodcasts(p.length ? p : getDemoPodcasts(user.uid, profile.geoId, profile.marketId));
        setClips(c.length ? c.slice(0, 6) : []);
        setAgenda(items.slice(0, 5));
      } finally {
        setContentReady(true);
      }
    })();
  }, [user, profile, profileComplete]);

  if (loading) {
    return <section className="sko-section"><p className="sko-muted">Loading My Compass…</p></section>;
  }

  // Real Firestore / network failure only
  if (profileError) {
    return (
      <>
        <SkoProfileDebugPanel />
        <SkoProfileErrorPanel
          message={profileError}
          onRetry={() => void refreshProfile()}
        />
      </>
    );
  }

  if (!user || !profileComplete || !profile) {
    return (
      <section className="sko-section">
        <SkoProfileDebugPanel />
        <p className="sko-muted">Redirecting to SKO enrollment…</p>
        <Link href="/sko/enroll" className="sko-link-btn">Continue to enrollment →</Link>
      </section>
    );
  }

  if (!contentReady) {
    return (
      <section className="sko-section">
        <SkoProfileDebugPanel />
        <p className="sko-muted">Loading your briefing…</p>
      </section>
    );
  }

  const brief = briefs[0];
  const showChinese = isChineseBriefingEnabled(profile.geoId, profile.marketId);

  return (
    <section className="sko-section sko-compass">
      <SkoProfileDebugPanel />
      <header className="sko-compass-header">
        <p className="sko-kicker">My Compass · SKO2H 2026</p>
        <h1>Welcome back, {profile.firstName ?? profile.displayName}</h1>
        <p className="sko-lead">
          {profile.geoId} · {profile.marketId?.replace(/-/g, " ")} · Personalized SKO briefing
        </p>
        <Link href="/sko/enroll" className="sko-link-btn">Refine intent →</Link>
      </header>

      <SkoChineseBriefingBar
        geoId={profile.geoId}
        marketId={profile.marketId}
        onCompassPage
      />

      {brief && (
        <article id="briefing" className="sko-panel sko-brief-card">
          <h2>{showChinese ? labelForKey("Read in Chinese", "zh-CN") : brief.title}</h2>
          <p>{brief.summary}</p>
        </article>
      )}

      {!showChinese && (
        <p className="sko-muted sko-help-note">
          Chinese briefing options appear for APAC, GCG, and HK markets. Refine your intent and choose an APAC market like GCG.
        </p>
      )}

      <SkoPodcastModule
        geoId={String(profile.geoId ?? "Americas")}
        marketId={profile.marketId}
        podcasts={podcasts}
      />

      <div className="sko-compass-grid">
        <article id="moments" className="sko-panel">
          <h2>{showChinese ? labelForKey("Clip Summary", "zh-CN") : "Key moments"}</h2>
          <ul className="sko-moments-list">
            {clips.map(clip => (
              <li key={clip.id}>
                <strong>{clip.title}</strong>
                <p>{clip.whyItMatters}</p>
                <span className="sko-muted">{clip.suggestedAction}</span>
              </li>
            ))}
          </ul>
        </article>

        <article id="summaries" className="sko-panel">
          <h2>{showChinese ? labelForKey("Key Takeaways", "zh-CN") : "Agenda highlights"}</h2>
          <ul className="sko-agenda-preview">
            {agenda.map(item => (
              <li key={item.id}>
                <span className="sko-agenda-order">{item.agendaOrder}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
