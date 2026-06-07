"use client";

import { useEffect, useState } from "react";
import { db } from "../src/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function Home() {
  const [participant, setParticipant] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [counts, setCounts] = useState({ participants: 0, sessions: 0, champions: 0 });
  const [status, setStatus] = useState("Loading Compass experience...");

  useEffect(() => {
    async function loadExperience() {
      try {
        const basePath = "organizations/ibm/events/txc2026";

        const participantSnap = await getDoc(
          doc(db, `${basePath}/participants/ATT-0001`)
        );

        const sessionsSnap = await getDocs(collection(db, `${basePath}/sessions`));
        const participantsSnap = await getDocs(collection(db, `${basePath}/participants`));
        const championsSnap = await getDocs(collection(db, `${basePath}/champions`));

        const allSessions = sessionsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setParticipant(participantSnap.exists() ? participantSnap.data() : null);
        setSessions(allSessions.slice(0, 5));
        setCounts({
          participants: participantsSnap.size,
          sessions: sessionsSnap.size,
          champions: championsSnap.size,
        });

        setStatus("Compass experience loaded from Firestore");
      } catch (error: any) {
        console.error(error);
        setStatus(`Firebase error: ${error.code || ""} ${error.message || error}`);
      }
    }

    loadExperience();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif", maxWidth: "900px" }}>
      <h1>EventCompass</h1>
      <p>AI-Powered Event Intelligence Platform</p>

      {participant && (
        <>
          <h2>Welcome, {participant.display_name}</h2>
          <p>{participant.job_title || participant.role}</p>
          <p>{participant.company}</p>

          <h3>Your Event Universe</h3>
          <ul>
            <li>Participants: {counts.participants}</li>
            <li>Sessions: {counts.sessions}</li>
            <li>Champions: {counts.champions}</li>
          </ul>

          <h3>First Compass Session Suggestions</h3>
          <ol>
            {sessions.map((session) => (
              <li key={session.id}>
                <strong>{session.title}</strong>
                <br />
                {session.session_type} · {session.schedule?.day} · {session.schedule?.start_time}
              </li>
            ))}
          </ol>
        </>
      )}

      <p>{status}</p>
    </main>
  );
}