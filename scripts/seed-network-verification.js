require("dotenv").config({ path: ".env.local" });

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE = "organizations/ibm/events/txc2026";

const people = [
  {
    id: "ATT-LINKEDIN-YES",
    display_name: "Maya Patel",
    first_name: "Maya",
    last_name: "Patel",
    job_title: "Principal AI Architect",
    company: "Horizon Bank Group",
    country: "United States",
    city: "Raleigh",
    linkedin_url: "https://www.linkedin.com/in/maya-patel-demo",
    education: [{ institution: "North Carolina State University" }],
    past_employers: [{ company: "IBM" }, { company: "Cisco" }],
    career_interests: ["AI architecture", "Mentoring"],
    consent: {
      public_profile: true,
      show_public_profile: true,
      show_linkedin: true,
      allow_intro_requests: true,
    },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: true,
    },
  },
  {
    id: "ATT-LINKEDIN-HIDDEN",
    display_name: "Hidden LinkedIn Test",
    first_name: "Hidden",
    last_name: "Test",
    job_title: "Cloud Strategy Leader",
    company: "Example Bank",
    country: "United States",
    city: "Atlanta",
    linkedin_url: "https://www.linkedin.com/in/hidden-test-demo",
    education: [{ institution: "North Carolina State University" }],
    past_employers: [{ company: "Cisco" }],
    career_interests: ["Cloud strategy"],
    consent: {
      public_profile: true,
      show_public_profile: true,
      show_linkedin: false,
      allow_intro_requests: true,
    },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: true,
    },
  },
  {
    id: "ATT-PRIVATE-PROFILE",
    display_name: "Private Profile Test",
    first_name: "Private",
    last_name: "Test",
    job_title: "Security Architect",
    company: "Global Insurance",
    country: "Canada",
    city: "Toronto",
    linkedin_url: "https://www.linkedin.com/in/private-test-demo",
    education: [{ institution: "Duke University" }],
    past_employers: [{ company: "IBM" }],
    career_interests: ["Security", "Leadership"],
    consent: {
      public_profile: false,
      show_public_profile: false,
      show_linkedin: true,
      allow_intro_requests: false,
    },
    networking_identity: {
      open_to_alumni_connections: false,
      open_to_past_colleague_connections: false,
      open_to_university_connections: false,
      open_to_career_conversations: false,
    },
  },
  {
    id: "ATT-DUKE-IBM",
    display_name: "Raj Singh",
    first_name: "Raj",
    last_name: "Singh",
    job_title: "Automation Executive",
    company: "Regional Bank",
    country: "India",
    city: "Bengaluru",
    linkedin_url: "https://www.linkedin.com/in/raj-singh-demo",
    education: [{ institution: "Duke University" }],
    past_employers: [{ company: "IBM" }],
    career_interests: ["Automation", "Career growth"],
    consent: {
      public_profile: true,
      show_public_profile: true,
      show_linkedin: true,
      allow_intro_requests: true,
    },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: true,
    },
  },
];

async function run() {
  for (const p of people) {
    await setDoc(
      doc(db, `${BASE}/participants/${p.id}`),
      {
        ...p,
        participant_id: p.id,
        id: p.id,
        email: `${p.id.toLowerCase()}@demo.eventcompass.local`,
        organization: p.company,
        event_signal_profile: {
          goals: ["Network with peers", "Meet IBM experts"],
          tech_tracks: ["AI", "Cloud", "Automation"],
          open_to: ["Connect with Alumni", "Meet IBM Champions"],
          roles_at_txc: [p.job_title],
          intent: {
            needs: ["Networking", "Architecture guidance"],
            aspiration: "Find relevant people and build meaningful connections.",
          },
        },
        compass_intelligence: {
          matching_keywords: [
            p.company,
            p.job_title,
            p.country,
            p.city,
            ...p.education.map((e) => e.institution),
            ...p.past_employers.map((e) => e.company),
            ...p.career_interests,
          ].map((v) => String(v).toLowerCase()),
        },
        registration: {
          attending: true,
          registered: true,
          industry: "Banking",
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Seeded ${p.id}: ${p.display_name}`);
  }

  console.log("Verification network seed complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});