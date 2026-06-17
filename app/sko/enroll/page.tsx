"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import { saveSkoIntentProfile } from "@/lib/skoAuth";
import {
  listGeos,
  listMarkets,
  listSellerPersonas,
} from "@/services/sko/skoFirestoreService";
import type {
  SkoDomain,
  SkoExperienceLevel,
  SkoGeo,
  SkoGoal,
  SkoJobTitle,
  SkoMarket,
  SkoSellerPersona,
  SkoTechnologyTrack,
} from "@/types/sko";
import {
  SKO_DOMAINS,
  SKO_EXPERIENCE_LEVELS,
  SKO_GOALS,
  SKO_JOB_TITLES,
  SKO_TECHNOLOGY_TRACKS,
} from "@/types/sko";
import SkoAuthPanel from "@/components/sko/SkoAuthPanel";

const MAX_TRACKS = 2;
const MAX_GOALS = 2;

export default function SkoEnrollPage() {
  const { user, profile, profileComplete, loading, refreshProfile } = useSkoAuth();
  const router = useRouter();

  const [personas, setPersonas] = useState<SkoSellerPersona[]>([]);
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [markets, setMarkets] = useState<SkoMarket[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [personaId, setPersonaId] = useState("");
  const [geoId, setGeoId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [jobTitle, setJobTitle] = useState<SkoJobTitle | "">("");
  const [technologyTracks, setTechnologyTracks] = useState<SkoTechnologyTrack[]>([]);
  const [goals, setGoals] = useState<SkoGoal[]>([]);
  const [domain, setDomain] = useState<SkoDomain | "">("");
  const [experienceLevel, setExperienceLevel] = useState<SkoExperienceLevel | "">("");
  const [accessType, setAccessType] = useState<"seller" | "partner">("seller");

  useEffect(() => {
    void (async () => {
      const [p, g, m] = await Promise.all([
        listSellerPersonas(),
        listGeos(),
        listMarkets(),
      ]);
      setPersonas(p);
      setGeos(g);
      setMarkets(m);
      if (g[0]) setGeoId(g[0].id);
      setDataLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading && user && profileComplete) {
      router.replace("/sko/compass");
    }
  }, [user, profileComplete, loading, router]);

  useEffect(() => {
    if (profile) {
      if (profile.personaId) setPersonaId(profile.personaId);
      if (profile.geoId) setGeoId(String(profile.geoId));
      if (profile.marketId) setMarketId(profile.marketId);
      if (profile.jobTitle) setJobTitle(profile.jobTitle as SkoJobTitle);
      if (profile.technologyTracks) setTechnologyTracks(profile.technologyTracks);
      if (profile.goals) setGoals(profile.goals);
      if (profile.domain) setDomain(profile.domain as SkoDomain);
      if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel as SkoExperienceLevel);
      if (profile.accessType === "partner") setAccessType("partner");
    }
  }, [profile]);

  const filteredMarkets = useMemo(() => {
    const geo = geos.find(g => g.id === geoId);
    if (!geo) return [];
    return markets.filter(m => m.geoId === geo.name || m.geoId === geo.id);
  }, [geoId, geos, markets]);

  useEffect(() => {
    if (filteredMarkets.length > 0) {
      setMarketId(filteredMarkets[0].id);
    } else {
      setMarketId("");
    }
  }, [filteredMarkets]);

  function toggleTrack(track: SkoTechnologyTrack) {
    setTechnologyTracks(prev => {
      if (prev.includes(track)) return prev.filter(t => t !== track);
      if (prev.length >= MAX_TRACKS) return prev;
      return [...prev, track];
    });
  }

  function toggleGoal(goal: SkoGoal) {
    setGoals(prev => {
      if (prev.includes(goal)) return prev.filter(g => g !== goal);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, goal];
    });
  }

  async function handleSave() {
    setError("");
    if (!user) return;
    if (!personaId) { setError("Select a selling motion persona."); return; }
    if (!geoId || !marketId) { setError("Select your geo and market."); return; }
    if (technologyTracks.length === 0) { setError("Choose at least one technology track."); return; }
    if (goals.length === 0) { setError("Choose at least one goal."); return; }
    if (!domain) { setError("Select your domain."); return; }
    if (!experienceLevel) { setError("Select your experience level."); return; }

    setSaving(true);
    try {
      const geo = geos.find(g => g.id === geoId);
      await saveSkoIntentProfile(user.uid, {
        firstName: profile?.firstName ?? user.displayName?.split(" ")[0] ?? "",
        lastName: profile?.lastName ?? user.displayName?.split(" ").slice(1).join(" ") ?? "",
        displayName: profile?.displayName ?? user.displayName ?? user.email ?? "",
        email: profile?.email ?? user.email ?? "",
        personaId,
        geoId: geo?.name ?? geoId,
        marketId,
        jobTitle: jobTitle || undefined,
        technologyTracks,
        goals,
        domain,
        experienceLevel,
        accessType,
        partnerFocus: accessType === "partner",
      });
      await refreshProfile();
      router.push("/sko/compass");
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || dataLoading) {
    return <section className="sko-section"><p className="sko-muted">Loading enrollment…</p></section>;
  }

  if (!user) {
    return (
      <section className="sko-section sko-enroll-gate">
        <h1>Build Your SKO Compass</h1>
        <p className="sko-lead">Sign in or create an account to personalize your SKO briefing.</p>
        <SkoAuthPanel onAuthenticated={() => router.refresh()} />
      </section>
    );
  }

  return (
    <section className="sko-section sko-enroll">
      <header className="sko-enroll-header">
        <p className="sko-kicker">Intent enrollment</p>
        <h1>Build Your SKO Compass</h1>
        <p className="sko-lead">
          Tell us what you care about. Compass will shape SKO into a briefing built around your role,
          market, technology focus, and goals.
        </p>
      </header>

      <div className="sko-enroll-section">
        <h2>Access type</h2>
        <div className="sko-chip-row">
          {(["seller", "partner"] as const).map(type => (
            <button
              key={type}
              type="button"
              className={`sko-chip${accessType === type ? " is-selected" : ""}`}
              onClick={() => setAccessType(type)}
            >
              {type === "seller" ? "Seller" : "Partner"}
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h2>Who best describes your selling motion?</h2>
        <div className="sko-persona-grid">
          {personas.map(persona => (
            <button
              key={persona.id}
              type="button"
              className={`sko-persona-card${personaId === persona.id ? " is-selected" : ""}`}
              onClick={() => setPersonaId(persona.id)}
            >
              <h3>{persona.title}</h3>
              <p>{persona.description}</p>
              <ul>
                {persona.exampleRoles.slice(0, 4).map(role => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h2>Geo and market</h2>
        <div className="sko-field-row">
          <label className="sko-field">
            <span>Geo</span>
            <select
              className="sko-select"
              value={geoId}
              onChange={e => setGeoId(e.target.value)}
            >
              {geos.map(geo => (
                <option key={geo.id} value={geo.id}>{geo.name} — {geo.cityLabel}</option>
              ))}
            </select>
          </label>
          <label className="sko-field">
            <span>Market</span>
            <select
              className="sko-select"
              value={marketId}
              onChange={e => setMarketId(e.target.value)}
              disabled={filteredMarkets.length === 0}
            >
              {filteredMarkets.map(market => (
                <option key={market.id} value={market.id}>{market.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="sko-field">
          <span>Job title (optional)</span>
          <select className="sko-select" value={jobTitle} onChange={e => setJobTitle(e.target.value as SkoJobTitle)}>
            <option value="">Select job title…</option>
            {SKO_JOB_TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="sko-enroll-section">
        <h2>Technology tracks <span className="sko-hint">Choose up to {MAX_TRACKS}</span></h2>
        <div className="sko-chip-row">
          {SKO_TECHNOLOGY_TRACKS.map(track => (
            <button
              key={track}
              type="button"
              className={`sko-chip${technologyTracks.includes(track) ? " is-selected" : ""}`}
              onClick={() => toggleTrack(track)}
            >
              {track}
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h2>Goals <span className="sko-hint">Choose up to {MAX_GOALS}</span></h2>
        <div className="sko-chip-row">
          {SKO_GOALS.map(goal => (
            <button
              key={goal}
              type="button"
              className={`sko-chip${goals.includes(goal) ? " is-selected" : ""}`}
              onClick={() => toggleGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h2>Domain</h2>
        <div className="sko-chip-row">
          {SKO_DOMAINS.map(d => (
            <button
              key={d}
              type="button"
              className={`sko-chip${domain === d ? " is-selected" : ""}`}
              onClick={() => setDomain(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="sko-enroll-section">
        <h2>Experience level</h2>
        <div className="sko-chip-row">
          {SKO_EXPERIENCE_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              className={`sko-chip${experienceLevel === level ? " is-selected" : ""}`}
              onClick={() => setExperienceLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="sko-error">{error}</p>}

      <button
        type="button"
        className="sko-btn sko-btn--primary sko-enroll-save"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {saving ? "Saving…" : "Save and open My Compass →"}
      </button>
    </section>
  );
}
