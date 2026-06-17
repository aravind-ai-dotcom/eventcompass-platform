"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSkoAuth } from "@/context/SkoAuthContext";
import {
  getActiveEdition,
  getUserSeatReservation,
  listContentItems,
  listGeos,
} from "@/services/sko/skoFirestoreService";
import type { SkoContentItem, SkoEdition, SkoGeo } from "@/types/sko";

export default function SkoHomePage() {
  const { user, profileComplete } = useSkoAuth();
  const [edition, setEdition] = useState<SkoEdition | null>(null);
  const [geos, setGeos] = useState<SkoGeo[]>([]);
  const [agenda, setAgenda] = useState<SkoContentItem[]>([]);
  const [reserved, setReserved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [ed, g, items] = await Promise.all([
        getActiveEdition(),
        listGeos(),
        listContentItems(),
      ]);
      setEdition(ed);
      setGeos(g);
      setAgenda(items.slice(0, 6));
    })();
  }, []);

  useEffect(() => {
    if (user) {
      void getUserSeatReservation(user.uid).then(r => setReserved(Boolean(r && r.status === "reserved")));
    }
  }, [user]);

  return (
    <section className="sko-section sko-home">
      <header className="sko-hero">
        <p className="sko-kicker">{edition?.label ?? "SKO2H 2026"}</p>
        <h1>{edition?.theme ?? "AI Creates Advantage"}</h1>
        <p className="sko-lead">{edition?.headline ?? "Turning organizational strategy into seller action."}</p>
        {!user && (
          <Link href="/sko/login" className="sko-btn sko-btn--primary">Sign in to SKO Compass</Link>
        )}
        {user && !profileComplete && (
          <Link href="/sko/enroll" className="sko-btn sko-btn--primary">Build Your SKO Compass</Link>
        )}
        {user && profileComplete && (
          <Link href="/sko/compass" className="sko-btn sko-btn--primary">Open My Compass</Link>
        )}
      </header>

      <div className="sko-home-grid">
        <article className="sko-panel">
          <h2>Geo momentum</h2>
          <div className="sko-geo-cards">
            {geos.map(geo => (
              <div key={geo.id} className="sko-geo-card">
                <span className="sko-geo-name">{geo.name}</span>
                <span className="sko-geo-city">{geo.cityLabel}</span>
                <span className="sko-geo-meta">{geo.deliveryType} · {geo.date}</span>
                <span className={`sko-status sko-status--${geo.status}`}>{geo.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="sko-panel">
          <h2>Agenda readiness</h2>
          <ol className="sko-agenda-preview">
            {agenda.map(item => (
              <li key={item.id}>
                <span className="sko-agenda-order">{item.agendaOrder}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="sko-panel">
          <h2>Seat reservation</h2>
          <p className="sko-muted">
            {reserved
              ? "Your SKO seat is reserved. Compass will personalize your briefing after the show."
              : "Reserve your SKO seat from My Compass after enrollment."}
          </p>
        </article>

        <article className="sko-panel">
          <h2>Trending themes</h2>
          <div className="sko-chip-row">
            {["Hybrid Cloud", "AI", "watsonx", "IBM Bob", "RevTech", "Partner Ecosystem"].map(t => (
              <span key={t} className="sko-chip sko-chip--static">{t}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
