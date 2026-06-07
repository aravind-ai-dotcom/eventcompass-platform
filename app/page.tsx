"use client";

import { useEffect, useState } from "react";
import { db } from "../src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [counts, setCounts] = useState({
    participants: 0,
    sessions: 0,
    champions: 0,
  });

  const [status, setStatus] = useState("Loading EventCompass data...");

  useEffect(() => {
    async function loadCounts() {
      try {
        const basePath = "organizations/ibm/events/txc2026";

        const participantsSnap = await getDocs(
          collection(db, `${basePath}/participants`)
        );

        const sessionsSnap = await getDocs(
          collection(db, `${basePath}/sessions`)
        );

        const championsSnap = await getDocs(
          collection(db, `${basePath}/champions`)
        );

        setCounts({
          participants: participantsSnap.size,
          sessions: sessionsSnap.size,
          champions: championsSnap.size,
        });

        setStatus("Firestore connection: active");
      } catch (error: any) {
        console.error("Firebase error:", error);
        setStatus(`Firebase error: ${error.code || ""} ${error.message || error}`);
      }
    }

    loadCounts();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>EventCompass</h1>
      <p>AI-Powered Event Intelligence Platform</p>

      <h2>IBM TechXchange 2026</h2>

      <ul>
        <li>Participants: {counts.participants}</li>
        <li>Sessions: {counts.sessions}</li>
        <li>Champions: {counts.champions}</li>
      </ul>

      <p>{status}</p>
    </main>
  );
}