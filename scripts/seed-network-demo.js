require("dotenv").config({ path: ".env.local" });

const { initializeApp, getApps, getApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require("firebase/firestore");

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

const participants = [
  {
    id: "ATT-1001",
    first_name: "Maya",
    last_name: "Patel",
    display_name: "Maya Patel",
    company: "Example Bank",
    organization: "Example Bank",
    job_title: "Principal Cloud Architect",
    country: "United States",
    city: "New York",
    linkedin_url: "https://www.linkedin.com/in/maya-patel-demo",
    education: [{ institution: "North Carolina State University" }],
    past_employers: [{ company: "Cisco" }, { company: "IBM" }],
    career_interests: ["AI architecture", "Mentoring"],
    consent: { allow_intro_requests: true, show_public_profile: true },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: true,
    },
  },
  {
    id: "ATT-1002",
    first_name: "Raj",
    last_name: "Singh",
    display_name: "Raj Singh",
    company: "Red Hat",
    organization: "Red Hat",
    job_title: "Automation Specialist",
    country: "India",
    city: "Bengaluru",
    linkedin_url: "https://www.linkedin.com/in/raj-singh-demo",
    education: [{ institution: "Duke University" }],
    past_employers: [{ company: "IBM" }, { company: "Accenture" }],
    career_interests: ["Automation", "Career growth"],
    consent: { allow_intro_requests: true, show_public_profile: true },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: false,
    },
  },
  {
    id: "ATT-1003",
    first_name: "Elena",
    last_name: "Garcia",
    display_name: "Elena Garcia",
    company: "Global Retail Group",
    organization: "Global Retail Group",
    job_title: "Data Platform Leader",
    country: "Spain",
    city: "Madrid",
    linkedin_url: "",
    education: [{ institution: "Georgia Tech" }],
    past_employers: [{ company: "Cisco" }],
    career_interests: ["Data strategy", "Leadership"],
    consent: { allow_intro_requests: true, show_public_profile: true },
    networking_identity: {
      open_to_alumni_connections: false,
      open_to_past_colleague_connections: true,
      open_to_university_connections: false,
      open_to_career_conversations: true,
    },
  },
  {
    id: "ATT-1004",
    first_name: "Thomas",
    last_name: "Miller",
    display_name: "Thomas Miller",
    company: "UPS",
    organization: "UPS",
    job_title: "AI Program Director",
    country: "United States",
    city: "Atlanta",
    linkedin_url: "https://www.linkedin.com/in/thomas-miller-demo",
    education: [{ institution: "North Carolina State University" }],
    past_employers: [{ company: "Cisco" }, { company: "UPS" }],
    career_interests: ["Agentic AI", "Executive strategy"],
    consent: { allow_intro_requests: true, show_public_profile: true },
    networking_identity: {
      open_to_alumni_connections: true,
      open_to_past_colleague_connections: true,
      open_to_university_connections: true,
      open_to_career_conversations: true,
    },
  },
  {
    id: "ATT-1005",
    first_name: "Priya",
    last_name: "Narayanan",
    display_name: "Priya Narayanan",
    company: "Example Insurance",
    organization: "Example Insurance",
    job_title: "Security Architect",
    country: "United Kingdom",
    city: "London",
    linkedin_url: "",
    education: [{ institution: "University of Texas at Austin" }],
    past_employers: [{ company: "IBM" }],
    career_interests: ["Security", "Mentoring"],
    consent: { allow_intro_requests: false, show_public_profile: false },
    networking_identity: {
      open_to_alumni_connections: false,
      open_to_past_colleague_connections: false,
      open_to_university_connections: false,
      open_to_career_conversations: false,
    },
  },
];

function keywords(p) {
  return [
    p.company,
    p.organization,
    p.job_title,
    p.country,
    p.city,
    ...(p.education || []).map((e) => e.institution),
    ...(p.past_employers || []).map((e) => e.company),
    ...(p.career_interests || []),
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
}

async function run() {
  for (const p of participants) {
    await setDoc(
      doc(db, `${BASE}/participants/${p.id}`),
      {
        ...p,
        participant_id: p.id,
        email: `${p.first_name.toLowerCase()}.${p.last_name.toLowerCase()}@demo.eventcompass.local`,
        event_signal_profile: {
          goals: ["Network with peers", "Explore AI"],
          tech_tracks: ["AI", "Automation"],
          open_to: ["Meet IBM Champions", "Connect with Alumni"],
          roles_at_txc: [p.job_title],
          intent: {
            needs: ["Networking", "Strategic insights"],
            aspiration: "Find relevant people and leave with stronger connections.",
          },
        },
        compass_intelligence: {
          matching_keywords: keywords(p),
        },
        registration: {
          attending: true,
          registered: true,
          industry: "",
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Seeded ${p.id}: ${p.display_name}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});