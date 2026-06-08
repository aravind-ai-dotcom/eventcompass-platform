// =============================================================================
// EventCompass — Champion Seed Script
// scripts/seed-champions.js
//
// Appends the three founding featured champions to Firestore.
// Firestore path: organizations/ibm/events/txc2026/champions/{id}
//
// Usage:
//   node scripts/seed-champions.js
//
// Prerequisites:
//   npm install firebase   (or use existing node_modules)
//   NEXT_PUBLIC_FIREBASE_* env vars must be set in .env.local
//
// This script uses setDoc with merge:true — safe to run multiple times.
// It will NOT overwrite fields not listed here.
// =============================================================================

require("dotenv").config({ path: ".env.local" });

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, doc, setDoc }       = require("firebase/firestore");

// ── Firebase init ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

const BASE = "organizations/ibm/events/txc2026";

// ── Champion records ──────────────────────────────────────────────────────────

const CHAMPIONS = [
  {
    id:               "madeline-sanchez",
    display_name:     "Madeline Sanchez",
    first_name:       "Madeline",
    last_name:        "Sanchez",
    title:            "Information Security Engineer II",
    organization:     "Jack Henry & Associates",
    photo_url:        "/champions/madeline-sanchez.png",
    quote:            "So many people (IBM Champions and beyond) have encouraged me to keep pushing, learning, and growing. I am VERY excited to be able to pay it forward.",
    topics:           ["Security", "Mentoring", "Community"],
    linkedin_url:     "https://community.ibm.com/community/user/champions/expert/maddysanchez",
    featured:         true,
    homepage_priority: 30,
    profile: {
      domains:  ["Security", "Mentoring", "Community"],
      products: [],
    },
    attendance: {
      attending:              true,
      available_for_1x1:      true,
      available_for_group_meetups: true,
    },
    consent: {
      featured_champion:    true,
      show_photo:           true,
      allow_intro_requests: true,
      public_profile:       true,
    },
    compass_intelligence: {
      matching_keywords: ["security", "mentoring", "community", "ibm champion", "information security"],
    },
  },
  {
    id:               "roy-boxwell",
    display_name:     "Roy Boxwell",
    first_name:       "Roy",
    last_name:        "Boxwell",
    title:            "Senior Software Architect",
    organization:     "Software Engineering GmbH",
    photo_url:        "/champions/roy-boxwell.png",
    quote:            "I just love helping others and sharing knowledge. Hidden knowledge helps nobody!",
    topics:           ["IBM Z", "Architecture", "Knowledge Sharing"],
    linkedin_url:     "https://community.ibm.com/community/user/champions/expert/royboxwell",
    featured:         true,
    homepage_priority: 20,
    profile: {
      domains:  ["IBM Z", "Architecture", "Software Engineering"],
      products: ["IBM Z", "LinuxONE"],
    },
    attendance: {
      attending:              true,
      available_for_1x1:      true,
      available_for_group_meetups: true,
    },
    consent: {
      featured_champion:    true,
      show_photo:           true,
      allow_intro_requests: true,
      public_profile:       true,
    },
    compass_intelligence: {
      matching_keywords: ["ibm z", "architecture", "software architect", "knowledge sharing", "ibm champion"],
    },
  },
  {
    id:               "atanu-roy",
    display_name:     "Atanu Roy",
    first_name:       "Atanu",
    last_name:        "Roy",
    title:            "Lead Engineer",
    organization:     "London Stock Exchange Group",
    photo_url:        "/champions/atanu-roy.png",
    quote:            "I actively engage in technical discussions, aiming to empower the business automation community with innovative insights that drive transformation.",
    topics:           ["Automation", "Business Transformation", "Innovation"],
    linkedin_url:     "https://community.ibm.com/community/user/champions/expert/atanuroy",
    featured:         true,
    homepage_priority: 10,
    profile: {
      domains:  ["Automation", "Business Transformation", "Platform Engineering"],
      products: ["IBM Business Automation", "IBM Cloud Pak for Business Automation"],
    },
    attendance: {
      attending:              true,
      available_for_1x1:      true,
      available_for_group_meetups: true,
    },
    consent: {
      featured_champion:    true,
      show_photo:           true,
      allow_intro_requests: true,
      public_profile:       true,
    },
    compass_intelligence: {
      matching_keywords: ["automation", "business automation", "transformation", "innovation", "ibm champion"],
    },
  },
];

// ── Write to Firestore ────────────────────────────────────────────────────────

async function seed() {
  console.log(`\nSeeding ${CHAMPIONS.length} champion records to Firestore…`);
  console.log(`Path: ${BASE}/champions/{id}\n`);

  let success = 0;

  for (const champion of CHAMPIONS) {
    const { id, ...data } = champion;
    const ref = doc(db, `${BASE}/champions/${id}`);

    try {
      await setDoc(ref, data, { merge: true });
      console.log(`  ✓  ${champion.display_name}  →  champions/${id}`);
      success++;
    } catch (err) {
      console.error(`  ✗  ${champion.display_name}:`, err.message);
    }
  }

  console.log(`\n${success} / ${CHAMPIONS.length} records written.\n`);

  if (success < CHAMPIONS.length) {
    console.log("Some writes failed. Check:");
    console.log("  - .env.local has all NEXT_PUBLIC_FIREBASE_* vars");
    console.log("  - Firestore security rules allow writes");
    console.log("  - Firebase project ID matches your project\n");
    process.exit(1);
  }

  console.log("Done. Champions are now in Firestore.\n");
  console.log("Next: open your app — HomeCommunityVoices will load them automatically.");
  console.log("      getFeaturedChampions() filters featured=true + consent flags.\n");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
