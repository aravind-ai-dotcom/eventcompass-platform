"use client";

import { useEffect, useState } from "react";
import { db } from "../src/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function Home() {
  const [participant, setParticipant] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [champions, setChampions] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    participants: 0,
    sessions: 0,
    champions: 0,
  });
  const [status, setStatus] = useState("Loading Compass experience...");

  useEffect(() => {
    async function loadExperience() {
      try {
        const basePath = "organizations/ibm/events/txc2026";

        const participantSnap = await getDoc(
          doc(db, `${basePath}/participants/ATT-0001`)
        );

        const participantData = participantSnap.exists()
          ? participantSnap.data()
          : null;

        const sessionsSnap = await getDocs(
          collection(db, `${basePath}/sessions`)
        );

        const participantsSnap = await getDocs(
          collection(db, `${basePath}/participants`)
        );

        const championsSnap = await getDocs(
          collection(db, `${basePath}/champions`)
        );

        const allSessions = sessionsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const allChampions = championsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const participantTracks =
          participantData?.event_signal_profile?.tech_tracks || [];

        const participantGoals =
          participantData?.event_signal_profile?.goals || [];

        const participantNeeds =
          participantData?.event_signal_profile?.intent?.needs || [];

        const participantKeywords =
          participantData?.compass_intelligence?.matching_keywords || [];

        const participantRoles =
          participantData?.event_signal_profile?.roles_at_txc || [];

        const participantIndustry =
          participantData?.registration?.industry || "";

        const lower = (items: any[]) =>
          items.filter(Boolean).map((item) => String(item).toLowerCase());

        const scoredSessions = allSessions
          .map((session) => {
            let score = 0;
            const reasons: string[] = [];

            const sessionTrack = session.tracks?.primary_track || "";
            const sessionSecondaryTracks =
              session.tracks?.secondary_tracks || [];
            const sessionIntentTags =
              session.compass_intelligence?.intent_tags || [];
            const sessionNeedTags =
              session.compass_intelligence?.need_tags || [];
            const sessionKeywords =
              session.compass_intelligence?.matching_keywords || [];
            const sessionRoles = session.audience?.roles || [];
            const sessionIndustries = session.audience?.industries || [];

            const pTracks = lower(participantTracks);
            const pGoals = lower(participantGoals);
            const pNeeds = lower(participantNeeds);
            const pKeywords = lower(participantKeywords);
            const pRoles = lower(participantRoles);

            const sTracks = lower([sessionTrack, ...sessionSecondaryTracks]);
            const sIntents = lower(sessionIntentTags);
            const sNeeds = lower(sessionNeedTags);
            const sKeywords = lower(sessionKeywords);
            const sRoles = lower(sessionRoles);
            const sIndustries = lower(sessionIndustries);

            pTracks.forEach((track) => {
              if (sTracks.includes(track)) {
                score += 25;
                reasons.push(`Track match: ${track}`);
              }
            });

            pGoals.forEach((goal) => {
              if (sIntents.includes(String(goal).toLowerCase())) {
                score += 20;
                reasons.push(`Goal match: ${goal}`);
              }
            });

            pNeeds.forEach((need) => {
              if (sNeeds.includes(need)) {
                score += 15;
                reasons.push(`Need match: ${need}`);
              }
            });

            pRoles.forEach((role) => {
              if (sRoles.includes(role)) {
                score += 10;
                reasons.push(`Role match: ${role}`);
              }
            });

            if (
              participantIndustry &&
              sIndustries.includes(String(participantIndustry).toLowerCase())
            ) {
              score += 10;
              reasons.push(`Industry match: ${participantIndustry}`);
            }

            pKeywords.forEach((keyword) => {
              if (sKeywords.includes(keyword)) {
                score += 5;
                reasons.push(`Keyword match: ${keyword}`);
              }
            });

            if (session.recommendation_rules?.executive_relevant) {
              score += 5;
              reasons.push("Executive relevant");
            }

            if (session.recommendation_rules?.everyone_encouraged) {
              score += 5;
              reasons.push("Broad event relevance");
            }

            if (session.recommendation_rules?.hands_on) {
              score += 5;
              reasons.push("Hands-on learning");
            }

            return {
              ...session,
              compass_score: score,
              compass_reasons: reasons,
            };
          })
          .sort((a, b) => b.compass_score - a.compass_score)
          .slice(0, 5);

        const scoredChampions = allChampions
          .map((champion) => {
            const championKeywords = [
              ...(champion.profile?.domains || []),
              ...(champion.profile?.products || []),
              ...(champion.compass_intelligence?.matching_keywords || []),
            ]
              .filter(Boolean)
              .map((item) => String(item).toLowerCase());

            const score = participantKeywords.reduce((total: number, keyword: string) => {
              return championKeywords.includes(String(keyword).toLowerCase())
                ? total + 10
                : total;
            }, 0);

            return {
              ...champion,
              compass_score: score,
            };
          })
          .sort((a, b) => b.compass_score - a.compass_score)
          .slice(0, 5);

        setParticipant(participantData);
        setSessions(scoredSessions);
        setChampions(scoredChampions);

        setCounts({
          participants: participantsSnap.size,
          sessions: sessionsSnap.size,
          champions: championsSnap.size,
        });

        setStatus("Compass experience loaded from Firestore");
      } catch (error: any) {
        console.error(error);
        setStatus(
          `Firebase error: ${error.code || ""} ${error.message || error}`
        );
      }
    }

    loadExperience();
  }, []);

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "900px",
      }}
    >
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

          <h3>Top Compass Matches</h3>
          <ol>
            {sessions.map((session) => (
              <li key={session.id}>
                <strong>{session.title}</strong>
                <br />
                Compass Score: {session.compass_score}
                <br />
                {session.session_type} · {session.schedule?.day} ·{" "}
                {session.schedule?.start_time}

                <p>
                  <strong>Why Compass picked this:</strong>
                </p>
                <ul>
                  {session.compass_reasons
                    ?.slice(0, 4)
                    .map((reason: string) => (
                      <li key={reason}>{reason}</li>
                    ))}
                </ul>
              </li>
            ))}
          </ol>

          <h3>People You Should Meet</h3>
          <ol>
            {champions.map((champion) => (
              <li key={champion.id}>
                <strong>{champion.display_name}</strong>
                <br />
                {champion.title}
                <br />
                {champion.organization}
                <br />
                Compass Score: {champion.compass_score}
              </li>
            ))}
          </ol>
        </>
      )}

      <p>{status}</p>
    </main>
  );
}