"use client";

import { useEffect, useState } from "react";
import { db } from "../src/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [participant, setParticipant] = useState<any>(null);
  const [status, setStatus] = useState("Page loaded. Firebase read has not started yet.");

  useEffect(() => {
    async function loadParticipant() {
      try {
        setStatus("Attempting Firestore read...");

        const participantRef = doc(
          db,
          "organizations",
          "ibm",
          "events",
          "txc2026",
          "participants",
          "ATT-0001"
        );

        const participantSnap = await getDoc(participantRef);

        if (participantSnap.exists()) {
          setParticipant(participantSnap.data());
          setStatus("Firebase connection: active");
        } else {
          setStatus("Participant not found");
        }
      } catch (error: any) {
        console.error("Firebase error:", error);
        setStatus(`Firebase error: ${error.code || ""} ${error.message || error}`);
      }
    }

    loadParticipant();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>EventCompass</h1>
      <p>AI-Powered Event Intelligence Platform</p>

      {participant && (
        <>
          <h2>Welcome, {participant.display_name}</h2>
          <p>{participant.role}</p>
          <p>{participant.company}</p>
        </>
      )}

      <p>{status}</p>
    </main>
  );
}