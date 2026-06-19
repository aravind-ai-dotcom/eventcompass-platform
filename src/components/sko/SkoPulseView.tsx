"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import {
  listGeos,
  listPulseMetrics,
  listPulseQuotes,
} from "@/services/sko/skoFirestoreService";
import type { SkoGeo, SkoPulseMetrics, SkoPulseQuote } from "@/types/sko";

function formatMetric(value: number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) return "—";
  return `${value}${suffix}`;
}

interface Props {
  loginPath?: string;
}

export default function SkoPulseView({ loginPath = "/sko/login" }: Props) {
  const { user, profile, loading } = useSkoAuth();
  const router = useRouter();
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [metrics, setMetrics] = useState<SkoPulseMetrics[]>([]);
  const [quotes, setQuotes] = useState<SkoPulseQuote[]>([]);

  const geoId = profile?.geoId ? String(profile.geoId) : "Americas";

  useEffect(() => {
    if (!loading && !user) router.replace(loginPath);
  }, [user, loading, router, loginPath]);

  useEffect(() => {
    void (async () => {
      const [g, m, q] = await Promise.all([
        listGeos(),
        listPulseMetrics(),
        listPulseQuotes(),
      ]);
      setGeos(g);
      setMetrics(m);
      setQuotes(q);
    })();
  }, []);

  const geoMetrics = useMemo(
    () => metrics.find(m => m.geoId === geoId) ?? metrics[0],
    [metrics, geoId],
  );

  const geo = geos.find(g => g.name === geoId || g.id === geoId);
  const geoQuotes = quotes.filter(q => q.geoId === geoId).slice(0, 4);
  const showMetrics = geo?.status === "completed";

  if (loading) {
    return <section className="sko-section"><p className="sko-muted">Loading Pulse…</p></section>;
  }

  return (
    <section className="sko-section sko-pulse">
      <header>
        <p className="sko-kicker">Pulse</p>
        <h1>SKO momentum — {geoId}</h1>
        <p className="sko-lead">
          Post-show reporting and seller sentiment for your geo.
        </p>
      </header>

      <div className="sko-pulse-metrics">
        {[
          { label: "NPS", value: showMetrics ? formatMetric(geoMetrics?.nps) : "—" },
          { label: "Watched live %", value: showMetrics ? formatMetric(geoMetrics?.watchedLiveRate, "%") : "—" },
          { label: "Participation %", value: showMetrics ? formatMetric(geoMetrics?.participationRate, "%") : "—" },
          { label: "Narratives generated", value: showMetrics ? formatMetric(geoMetrics?.narrativesGenerated) : "—" },
          { label: "Minutes delivered", value: showMetrics ? formatMetric(geoMetrics?.minutesDelivered) : "—" },
          { label: "Top market", value: showMetrics ? (geoMetrics?.topMarket ?? "—") : "—" },
        ].map(item => (
          <div key={item.label} className="sko-metric-card">
            <span className="sko-metric-label">{item.label}</span>
            <span className="sko-metric-value">{item.value}</span>
          </div>
        ))}
      </div>

      {showMetrics && geoMetrics?.sourceLabel && (
        <p className="sko-source-cite">
          Pulled from SKO post-show reporting, {geoId}, {geo?.date ?? geoMetrics.updatedAt}.
        </p>
      )}

      {!showMetrics && (
        <p className="sko-muted">Metrics will appear after {geoId} SKO completes.</p>
      )}

      <div className="sko-quotes-grid">
        {geoQuotes.map(q => (
          <blockquote key={q.id} className="sko-quote-card">
            <p>&ldquo;{q.quote}&rdquo;</p>
            <footer>{q.attributionLabel}{q.roleLabel ? ` · ${q.roleLabel}` : ""}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
