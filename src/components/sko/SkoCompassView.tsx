"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import SkoChineseBriefingBar from "@/components/sko/SkoChineseBriefingBar";
import SkoPodcastModule from "@/components/sko/SkoPodcastModule";
import { isChineseBriefingEnabled, labelForKey } from "@/lib/skoLocale";
import { getDemoBrief, getDemoPodcasts } from "@/lib/skoDemoContent";
import {
  listContentClips,
  listContentItems,
  listUserBriefs,
  listUserPodcasts,
} from "@/services/sko/skoFirestoreService";
import type { SkoBrief, SkoContentClip, SkoContentItem, SkoPodcast } from "@/types/sko";

interface Props {
  loginPath?: string;
  enrollPath?: string;
}

export default function SkoCompassView({
  loginPath = "/sko/login",
  enrollPath = "/sko/enroll",
}: Props) {
  const { user, profile, profileComplete, loading } = useSkoAuth();
  const router = useRouter();
  const [briefs, setBriefs] = useState<SkoBrief[]>([]);
  const [podcasts, setPodcasts] = useState<SkoPodcast[]>([]);
  const [clips, setClips] = useState<SkoContentClip[]>([]);
  const [agenda, setAgenda] = useState<SkoContentItem[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace(loginPath);
    else if (!loading && user && !profileComplete) router.replace(enrollPath);
  }, [user, profileComplete, loading, router, loginPath, enrollPath]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const geo = profile?.geoId;
      const [b, p, c, items] = await Promise.all([
        listUserBriefs(user.uid),
        listUserPodcasts(user.uid),
        listContentClips(),
        listContentItems(undefined, geo ? String(geo) : undefined),
      ]);
      setBriefs(b.length ? b : [getDemoBrief(profile?.geoId, profile?.marketId)]);
      setPodcasts(p.length ? p : getDemoPodcasts(user.uid, profile?.geoId, profile?.marketId));
      setClips(c.length ? c.slice(0, 6) : []);
      setAgenda(items.slice(0, 5));
    })();
  }, [user, profile?.geoId, profile?.marketId]);

  if (loading || !user || !profileComplete) {
    return <section className="sko-section"><p className="sko-muted">Loading My Compass…</p></section>;
  }

  const brief = briefs[0];
  const showChinese = isChineseBriefingEnabled(profile?.geoId, profile?.marketId);

  return (
    <section className="sko-section sko-compass">
      <header className="sko-compass-header">
        <p className="sko-kicker">My Compass</p>
        <h1>Welcome back, {profile?.firstName ?? profile?.displayName}</h1>
        <p className="sko-lead">
          {profile?.geoId} · {profile?.marketId?.replace(/-/g, " ")} · Personalized SKO briefing
        </p>
        <Link href={enrollPath} className="sko-link-btn">Refine intent →</Link>
      </header>

      <SkoChineseBriefingBar
        geoId={profile?.geoId}
        marketId={profile?.marketId}
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
        userId={user.uid}
        geoId={String(profile?.geoId ?? "Americas")}
        marketId={profile?.marketId}
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
