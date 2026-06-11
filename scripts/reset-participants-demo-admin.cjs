// =============================================================================
// EventCompass — Participant Demo Reset (Admin SDK)
// scripts/reset-participants-demo-admin.js
//
// Step 1: Back up all existing participants to backups/
// Step 2: Delete all documents in participants collection
// Step 3: Seed 15 synthetic participants (DEMO-P-0001 … DEMO-P-0015)
//
// Usage:
//   node scripts/reset-participants-demo-admin.js
//
// Prerequisites:
//   npm install firebase-admin
//   Place serviceAccountKey.json in the project root
//
// Rules:
//   - Uses Firebase Admin SDK — no client SDK, no dotenv, no env vars
//   - Does NOT touch Firebase Auth users
//   - Does NOT touch sessions or champions
//   - Backs up to backups/ before deleting
// =============================================================================

const admin = require("firebase-admin");
const fs    = require("fs");
const path  = require("path");

// ── Firebase Admin init ───────────────────────────────────────────────────────
// Loads serviceAccountKey.json from the project root (same directory you run
// the script from). Generate this file in Firebase Console:
//   Project Settings → Service accounts → Generate new private key

const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db   = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";


// ── Consent preset factories ───────────────────────────────────────────────────

function consentFull() {
  return {
    public_profile: true, show_linkedin: true, allow_intro_requests: true,
    share_with_matched_attendees: true, allow_alumni_matching: true,
    allow_employer_matching: true, allow_university_matching: true,
  };
}
function consentPublicNoLinkedIn() {
  return {
    public_profile: true, show_linkedin: false, allow_intro_requests: true,
    share_with_matched_attendees: true, allow_alumni_matching: true,
    allow_employer_matching: true, allow_university_matching: true,
  };
}
function consentPrivate() {
  return {
    public_profile: false, show_linkedin: false, allow_intro_requests: false,
    share_with_matched_attendees: false, allow_alumni_matching: false,
    allow_employer_matching: false, allow_university_matching: false,
  };
}
function consentAlumniOnly() {
  return {
    public_profile: false, show_linkedin: false, allow_intro_requests: false,
    share_with_matched_attendees: false, allow_alumni_matching: true,
    allow_employer_matching: false, allow_university_matching: true,
  };
}
function consentEmployerOnly() {
  return {
    public_profile: false, show_linkedin: false, allow_intro_requests: false,
    share_with_matched_attendees: false, allow_alumni_matching: false,
    allow_employer_matching: true, allow_university_matching: false,
  };
}
function consentCareerConversations() {
  return {
    public_profile: true, show_linkedin: true, allow_intro_requests: true,
    share_with_matched_attendees: true, allow_alumni_matching: false,
    allow_employer_matching: false, allow_university_matching: false,
  };
}

function niAll() {
  return {
    open_to_alumni_connections: true, open_to_past_colleague_connections: true,
    open_to_university_connections: true, open_to_career_conversations: true,
  };
}
function niAlumniUni() {
  return {
    open_to_alumni_connections: true, open_to_past_colleague_connections: false,
    open_to_university_connections: true, open_to_career_conversations: false,
  };
}
function niEmployer() {
  return {
    open_to_alumni_connections: false, open_to_past_colleague_connections: true,
    open_to_university_connections: false, open_to_career_conversations: false,
  };
}
function niCareer() {
  return {
    open_to_alumni_connections: false, open_to_past_colleague_connections: false,
    open_to_university_connections: false, open_to_career_conversations: true,
  };
}
function niNone() {
  return {
    open_to_alumni_connections: false, open_to_past_colleague_connections: false,
    open_to_university_connections: false, open_to_career_conversations: false,
  };
}

function keywords(...values) {
  return [...new Set(values.flat().filter(Boolean).map(v => String(v).toLowerCase()))];
}

// ── 15 synthetic participants (identical data to client-SDK version) ────────────

const PARTICIPANTS = [
  {
    id: "DEMO-P-0001", participant_id: "DEMO-P-0001",
    participant_type: "attendee",
    first_name: "Aravind", last_name: "Ragupathi",
    display_name: "Aravind Ragupathi",
    email: "aravind.ragupathi@demo.compass",
    organization: "IBM", company: "IBM",
    job_title: "Senior Software Engineer",
    persona: "Technical Practitioner",
    country: "United States", city: "Atlanta",
    industry: "Technology",
    linkedin_url: "https://www.linkedin.com/in/aravindragupathi",
    education: [{ institution: "Georgia Tech", degree: "B.S.", field: "Computer Science", graduation_year: "2016" }],
    past_employers: [{ company: "Cisco", role: "Software Engineer", years: "2016–2020" }],
    career_interests: ["AI / ML", "Platform engineering", "Cloud architecture"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Explore AI", "Network with peers", "Learn new technologies"],
      tech_tracks: ["AI", "Cloud", "App Development"],
      open_to: ["Meet IBM experts", "Meet Industry Peers"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Hands-on learning", "Architecture guidance"], aspiration: "Find practical AI patterns I can bring back to my team." },
    },
    compass_intelligence: { matching_keywords: keywords(["ai","cloud","app development","explore ai","network with peers","hands-on learning","architecture guidance","georgia tech","cisco","platform engineering","software engineer","ibm","atlanta","united states"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Technology" },
  },

  {
    id: "DEMO-P-0002", participant_id: "DEMO-P-0002",
    participant_type: "attendee",
    first_name: "Graeme", last_name: "Noseworthy",
    display_name: "Graeme Noseworthy",
    email: "graeme.noseworthy@demo.compass",
    organization: "Accenture", company: "Accenture",
    job_title: "Cloud Architect",
    persona: "Architect",
    country: "Canada", city: "Toronto",
    industry: "Consulting",
    linkedin_url: "https://www.linkedin.com/in/graemenoseworthy",
    education: [{ institution: "University of Toronto", degree: "M.Eng.", field: "Electrical Engineering", graduation_year: "2012" }],
    past_employers: [{ company: "IBM", role: "Cloud Solutions Architect", years: "2012–2019" }, { company: "Red Hat", role: "Principal Architect", years: "2019–2022" }],
    career_interests: ["Cloud architecture", "DevOps", "Platform engineering"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Understand IBM roadmap", "Network with peers", "Earn a certification"],
      tech_tracks: ["Cloud", "Red Hat", "Automation"],
      open_to: ["Meet Architects", "Connect with Alumni"],
      roles_at_txc: ["Architect"],
      intent: { needs: ["Architecture guidance", "Product roadmap"], aspiration: "Connect with Red Hat architects and understand the hybrid cloud direction." },
    },
    compass_intelligence: { matching_keywords: keywords(["cloud","red hat","automation","understand ibm roadmap","architecture guidance","product roadmap","university of toronto","ibm","red hat","accenture","cloud architect","toronto","canada"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Consulting" },
  },

  {
    id: "DEMO-P-0003", participant_id: "DEMO-P-0003",
    participant_type: "attendee",
    first_name: "Angie", last_name: "Borman",
    display_name: "Angie Borman",
    email: "angie.borman@demo.compass",
    organization: "Duke Health", company: "Duke Health",
    job_title: "Information Security Manager",
    persona: "Technical Practitioner",
    country: "United States", city: "Durham",
    industry: "Healthcare",
    linkedin_url: "https://www.linkedin.com/in/angieborman",
    education: [{ institution: "Duke University", degree: "B.S.", field: "Information Systems", graduation_year: "2010" }],
    past_employers: [{ company: "Deloitte", role: "Security Consultant", years: "2010–2015" }],
    career_interests: ["Security", "Cloud architecture", "Career change"],
    consent: consentPublicNoLinkedIn(),
    networking_identity: niAlumniUni(),
    event_signal_profile: {
      goals: ["Learn new technologies", "Meet IBM experts", "Discover customer stories"],
      tech_tracks: ["Security", "Cloud", "Data"],
      open_to: ["Connect with Alumni", "Meet IBM Champions"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Hands-on learning", "Customer examples"], aspiration: "Understand how healthcare organizations are adopting zero-trust." },
    },
    compass_intelligence: { matching_keywords: keywords(["security","cloud","data","hands-on learning","customer examples","duke university","deloitte","duke health","information security","durham","united states","healthcare"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Healthcare" },
  },

  {
    id: "DEMO-P-0004", participant_id: "DEMO-P-0004",
    participant_type: "attendee",
    first_name: "Kevin", last_name: "Peters",
    display_name: "Kevin Peters",
    email: "kevin.peters@demo.compass",
    organization: "UPS", company: "UPS",
    job_title: "Director of Platform Engineering",
    persona: "IT Leader",
    country: "United States", city: "Atlanta",
    industry: "Logistics",
    linkedin_url: "https://www.linkedin.com/in/kevinpeters",
    education: [{ institution: "NC State University", degree: "B.S.", field: "Computer Engineering", graduation_year: "2004" }],
    past_employers: [{ company: "IBM", role: "Technical Program Manager", years: "2004–2011" }, { company: "AWS", role: "Solutions Architect", years: "2011–2017" }],
    career_interests: ["Platform engineering", "Cloud architecture", "Product leadership"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Understand IBM roadmap", "Grow my career", "Network with peers"],
      tech_tracks: ["Cloud", "IT Optimization", "Automation"],
      open_to: ["Meet Architects", "Meet IBM experts"],
      roles_at_txc: ["IT Leader"],
      intent: { needs: ["Architecture guidance", "Strategic insights"], aspiration: "Evaluate IBM's platform modernization story for our supply chain systems." },
    },
    compass_intelligence: { matching_keywords: keywords(["cloud","it optimization","automation","understand ibm roadmap","architecture guidance","strategic insights","nc state university","ibm","aws","ups","platform engineering","director","atlanta","united states","logistics"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Logistics" },
  },

  {
    id: "DEMO-P-0005", participant_id: "DEMO-P-0005",
    participant_type: "attendee",
    first_name: "Harold", last_name: "Valderas",
    display_name: "Harold Valderas",
    email: "harold.valderas@demo.compass",
    organization: "Santander Bank", company: "Santander Bank",
    job_title: "Data Platform Lead",
    persona: "Technical Practitioner",
    country: "Spain", city: "Madrid",
    industry: "Financial Services",
    linkedin_url: "https://www.linkedin.com/in/haroldvalderas",
    education: [{ institution: "Universidad Politécnica de Madrid", degree: "M.S.", field: "Computer Science", graduation_year: "2011" }],
    past_employers: [{ company: "IBM", role: "Data Engineer", years: "2011–2016" }, { company: "Microsoft", role: "Data Architect", years: "2016–2020" }],
    career_interests: ["Data engineering", "AI / ML", "Cloud architecture"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Explore AI", "Learn new technologies", "Network with peers"],
      tech_tracks: ["Data", "AI", "Cloud"],
      open_to: ["Meet IBM experts", "Meet Architects"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Hands-on learning", "Architecture guidance"], aspiration: "Understand how IBM's data fabric aligns with our lakehouse strategy." },
    },
    compass_intelligence: { matching_keywords: keywords(["data","ai","cloud","explore ai","hands-on learning","architecture guidance","universidad politecnica de madrid","ibm","microsoft","santander","data platform","madrid","spain","financial services"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Financial Services" },
  },

  {
    id: "DEMO-P-0006", participant_id: "DEMO-P-0006",
    participant_type: "attendee",
    first_name: "Adam", last_name: "Dannewitz",
    display_name: "Adam Dannewitz",
    email: "adam.dannewitz@demo.compass",
    organization: "First Citizens Bank", company: "First Citizens Bank",
    job_title: "VP of Engineering",
    persona: "Business Decision Maker",
    country: "United States", city: "Raleigh",
    industry: "Financial Services",
    linkedin_url: "https://www.linkedin.com/in/adamdannewitz",
    education: [{ institution: "NC State University", degree: "B.S.", field: "Business Information Systems", graduation_year: "2007" }],
    past_employers: [{ company: "Cisco", role: "Network Engineer", years: "2007–2012" }, { company: "Accenture", role: "Technology Consultant", years: "2012–2018" }],
    career_interests: ["Product leadership", "Platform engineering", "Security"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Network with peers", "Understand IBM roadmap", "Discover customer stories"],
      tech_tracks: ["Cloud", "Security", "IT Optimization"],
      open_to: ["Meet Architects", "Meet Customers"],
      roles_at_txc: ["Business Decision Maker"],
      intent: { needs: ["Strategic insights", "Customer examples"], aspiration: "Build relationships with peers navigating similar digital transformation challenges." },
    },
    compass_intelligence: { matching_keywords: keywords(["cloud","security","it optimization","network with peers","strategic insights","customer examples","nc state university","cisco","accenture","first citizens bank","vp engineering","raleigh","united states","financial services"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Financial Services" },
  },

  {
    id: "DEMO-P-0007", participant_id: "DEMO-P-0007",
    participant_type: "attendee",
    first_name: "Trent", last_name: "Wogon",
    display_name: "Trent Wogon",
    email: "trent.wogon@demo.compass",
    organization: "Boeing", company: "Boeing",
    job_title: "Enterprise Architect",
    persona: "Architect",
    country: "United States", city: "Seattle",
    industry: "Aerospace",
    linkedin_url: "https://www.linkedin.com/in/trentwogon",
    education: [{ institution: "MIT", degree: "S.B.", field: "Aeronautics and Astronautics", graduation_year: "2009" }],
    past_employers: [{ company: "IBM", role: "Enterprise Architect", years: "2009–2015" }],
    career_interests: ["Cloud architecture", "AI / ML", "DevOps"],
    consent: consentPublicNoLinkedIn(),
    networking_identity: niEmployer(),
    event_signal_profile: {
      goals: ["Explore AI", "Earn a certification", "Learn new technologies"],
      tech_tracks: ["AI", "Cloud", "IBM Z"],
      open_to: ["Meet IBM experts", "Meet Architects"],
      roles_at_txc: ["Architect"],
      intent: { needs: ["Architecture guidance", "Hands-on learning"], aspiration: "Evaluate agentic AI patterns for complex engineering workflows." },
    },
    compass_intelligence: { matching_keywords: keywords(["ai","cloud","ibm z","explore ai","architecture guidance","hands-on learning","mit","ibm","boeing","enterprise architect","seattle","united states","aerospace"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Aerospace" },
  },

  {
    id: "DEMO-P-0008", participant_id: "DEMO-P-0008",
    participant_type: "attendee",
    first_name: "Priya", last_name: "Chandrasekaran",
    display_name: "Priya Chandrasekaran",
    email: "priya.chandrasekaran@demo.compass",
    organization: "Infosys", company: "Infosys",
    job_title: "AI & Automation Practice Lead",
    persona: "Technical Practitioner",
    country: "India", city: "Bengaluru",
    industry: "Technology",
    linkedin_url: "https://www.linkedin.com/in/priyachandrasekaran",
    education: [{ institution: "Indian Institute of Technology Bombay", degree: "B.Tech", field: "Computer Science", graduation_year: "2013" }],
    past_employers: [{ company: "IBM", role: "Watson AI Specialist", years: "2013–2018" }, { company: "AWS", role: "AI/ML Solutions Architect", years: "2018–2022" }],
    career_interests: ["AI / ML", "Platform engineering", "Mentoring others"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Explore AI", "Meet IBM experts", "Network with peers"],
      tech_tracks: ["AI", "Automation", "Cloud"],
      open_to: ["Meet IBM experts", "Meet IBM Champions", "Find a Mentor"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Hands-on learning", "Networking"], aspiration: "Share automation learnings and connect with enterprise AI practitioners globally." },
    },
    compass_intelligence: { matching_keywords: keywords(["ai","automation","cloud","explore ai","hands-on learning","networking","iit bombay","ibm","aws","infosys","ai practice lead","bengaluru","india","technology"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Technology" },
  },

  {
    id: "DEMO-P-0009", participant_id: "DEMO-P-0009",
    participant_type: "attendee",
    first_name: "Marcus", last_name: "Johnson",
    display_name: "Marcus Johnson",
    email: "marcus.johnson@demo.compass",
    organization: "Delta Air Lines", company: "Delta Air Lines",
    job_title: "IT Operations Manager",
    persona: "IT Leader",
    country: "United States", city: "Atlanta",
    industry: "Aviation",
    linkedin_url: "",
    education: [{ institution: "Georgia Tech", degree: "B.S.", field: "Industrial Engineering", graduation_year: "2008" }],
    past_employers: [{ company: "IBM", role: "IT Infrastructure Specialist", years: "2008–2014" }],
    career_interests: ["IT Optimization", "Cloud architecture", "DevOps"],
    consent: consentPrivate(),
    networking_identity: niNone(),
    event_signal_profile: {
      goals: ["Learn new technologies", "Understand IBM roadmap"],
      tech_tracks: ["IT Optimization", "Cloud", "Automation"],
      open_to: [],
      roles_at_txc: ["IT Leader"],
      intent: { needs: ["Product roadmap", "Strategic insights"], aspiration: "Stay current with IBM infrastructure direction without committing to outreach." },
    },
    compass_intelligence: { matching_keywords: keywords(["it optimization","cloud","automation","product roadmap","strategic insights","georgia tech","ibm","delta air lines","it operations","atlanta","united states","aviation"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Aviation" },
  },

  {
    id: "DEMO-P-0010", participant_id: "DEMO-P-0010",
    participant_type: "attendee",
    first_name: "Sophie", last_name: "Müller",
    display_name: "Sophie Müller",
    email: "sophie.muller@demo.compass",
    organization: "Deutsche Bank", company: "Deutsche Bank",
    job_title: "Head of Data Engineering",
    persona: "Technical Practitioner",
    country: "Germany", city: "Frankfurt",
    industry: "Financial Services",
    linkedin_url: "https://www.linkedin.com/in/sophiemuller",
    education: [{ institution: "Technical University of Munich", degree: "M.Sc.", field: "Informatics", graduation_year: "2014" }],
    past_employers: [{ company: "Deloitte", role: "Data Consultant", years: "2014–2018" }, { company: "Microsoft", role: "Data Platform Architect", years: "2018–2021" }],
    career_interests: ["Data engineering", "AI / ML", "Security"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Explore AI", "Learn new technologies", "Network with peers"],
      tech_tracks: ["Data", "AI", "Security"],
      open_to: ["Meet Architects", "Connect with Alumni"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Architecture guidance", "Hands-on learning"], aspiration: "Explore IBM's data governance capabilities for regulated financial environments." },
    },
    compass_intelligence: { matching_keywords: keywords(["data","ai","security","explore ai","architecture guidance","hands-on learning","technical university of munich","deloitte","microsoft","deutsche bank","data engineering","frankfurt","germany","financial services"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Financial Services" },
  },

  {
    id: "DEMO-P-0011", participant_id: "DEMO-P-0011",
    participant_type: "attendee",
    first_name: "James", last_name: "Okafor",
    display_name: "James Okafor",
    email: "james.okafor@demo.compass",
    organization: "Standard Chartered", company: "Standard Chartered",
    job_title: "AI Innovation Lead",
    persona: "Business Decision Maker",
    country: "United Kingdom", city: "London",
    industry: "Financial Services",
    linkedin_url: "https://www.linkedin.com/in/jamesokafor",
    education: [{ institution: "Stanford University", degree: "M.S.", field: "Management Science & Engineering", graduation_year: "2015" }],
    past_employers: [{ company: "Accenture", role: "Strategy Consultant", years: "2015–2020" }],
    career_interests: ["AI / ML", "Product leadership", "Career change"],
    consent: consentCareerConversations(),
    networking_identity: niCareer(),
    event_signal_profile: {
      goals: ["Explore AI", "Grow my career", "Discover customer stories"],
      tech_tracks: ["AI", "Data", "Cloud"],
      open_to: ["Meet IBM experts", "Find a Mentor"],
      roles_at_txc: ["Business Decision Maker"],
      intent: { needs: ["Strategic insights", "Customer examples"], aspiration: "Understand how banks are deploying responsible AI at enterprise scale." },
    },
    compass_intelligence: { matching_keywords: keywords(["ai","data","cloud","explore ai","strategic insights","customer examples","stanford university","accenture","standard chartered","ai innovation","london","united kingdom","financial services"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Financial Services" },
  },

  {
    id: "DEMO-P-0012", participant_id: "DEMO-P-0012",
    participant_type: "attendee",
    first_name: "Mei", last_name: "Zhang",
    display_name: "Mei Zhang",
    email: "mei.zhang@demo.compass",
    organization: "Lenovo", company: "Lenovo",
    job_title: "Platform Engineering Manager",
    persona: "Technical Practitioner",
    country: "United States", city: "Morrisville",
    industry: "Technology",
    linkedin_url: "https://www.linkedin.com/in/meizhang",
    education: [{ institution: "UC Berkeley", degree: "B.S.", field: "Electrical Engineering & Computer Sciences", graduation_year: "2011" }],
    past_employers: [{ company: "IBM", role: "Systems Software Engineer", years: "2011–2016" }, { company: "Red Hat", role: "OpenShift Architect", years: "2016–2021" }],
    career_interests: ["Platform engineering", "DevOps", "Cloud architecture"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Learn new technologies", "Network with peers", "Earn a certification"],
      tech_tracks: ["Red Hat", "Cloud", "Automation"],
      open_to: ["Meet Architects", "Connect with Alumni"],
      roles_at_txc: ["Technical Practitioner"],
      intent: { needs: ["Hands-on learning", "Architecture guidance"], aspiration: "Get OpenShift certified and find peers running hybrid cloud at scale." },
    },
    compass_intelligence: { matching_keywords: keywords(["red hat","cloud","automation","hands-on learning","architecture guidance","earn a certification","uc berkeley","ibm","red hat","lenovo","platform engineering","morrisville","united states","technology"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Technology" },
  },

  {
    id: "DEMO-P-0013", participant_id: "DEMO-P-0013",
    participant_type: "attendee",
    first_name: "David", last_name: "Mensah",
    display_name: "David Mensah",
    email: "david.mensah@demo.compass",
    organization: "Barclays", company: "Barclays",
    job_title: "Security Architect",
    persona: "Architect",
    country: "United Kingdom", city: "London",
    industry: "Financial Services",
    linkedin_url: "",
    education: [{ institution: "Imperial College London", degree: "M.Sc.", field: "Computing", graduation_year: "2010" }],
    past_employers: [{ company: "IBM", role: "Security Consultant", years: "2010–2016" }, { company: "Deloitte", role: "Cyber Risk Advisor", years: "2016–2019" }],
    career_interests: ["Security", "AI / ML", "DevOps"],
    consent: consentAlumniOnly(),
    networking_identity: niAlumniUni(),
    event_signal_profile: {
      goals: ["Learn new technologies", "Meet IBM experts"],
      tech_tracks: ["Security", "AI", "Data"],
      open_to: ["Connect with Alumni", "Meet IBM Champions"],
      roles_at_txc: ["Architect"],
      intent: { needs: ["Hands-on learning", "Customer examples"], aspiration: "Explore zero-trust frameworks and IBM Security QRadar SIEM capabilities." },
    },
    compass_intelligence: { matching_keywords: keywords(["security","ai","data","hands-on learning","customer examples","imperial college london","ibm","deloitte","barclays","security architect","london","united kingdom","financial services"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Financial Services" },
  },

  {
    id: "DEMO-P-0014", participant_id: "DEMO-P-0014",
    participant_type: "attendee",
    first_name: "Nadia", last_name: "Fontaine",
    display_name: "Nadia Fontaine",
    email: "nadia.fontaine@demo.compass",
    organization: "Government of Canada", company: "Government of Canada",
    job_title: "Digital Services Director",
    persona: "IT Leader",
    country: "Canada", city: "Ottawa",
    industry: "Government",
    linkedin_url: "https://www.linkedin.com/in/nadiafontaine",
    education: [{ institution: "McGill University", degree: "M.P.A.", field: "Public Administration", graduation_year: "2012" }],
    past_employers: [{ company: "Accenture", role: "Public Sector Consultant", years: "2012–2017" }],
    career_interests: ["Product leadership", "AI / ML", "Early career"],
    consent: consentEmployerOnly(),
    networking_identity: niEmployer(),
    event_signal_profile: {
      goals: ["Understand IBM roadmap", "Discover customer stories", "Network with peers"],
      tech_tracks: ["AI", "Cloud", "Data"],
      open_to: ["Meet IBM experts", "Meet Customers"],
      roles_at_txc: ["IT Leader"],
      intent: { needs: ["Strategic insights", "Customer examples"], aspiration: "Learn how other governments are adopting responsible AI with privacy controls." },
    },
    compass_intelligence: { matching_keywords: keywords(["ai","cloud","data","strategic insights","customer examples","mcgill university","accenture","government of canada","digital services","ottawa","canada","government"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Government" },
  },

  {
    id: "DEMO-P-0015", participant_id: "DEMO-P-0015",
    participant_type: "attendee",
    first_name: "Lucas", last_name: "Bergström",
    display_name: "Lucas Bergström",
    email: "lucas.bergstrom@demo.compass",
    organization: "Ericsson", company: "Ericsson",
    job_title: "5G Platform Architect",
    persona: "Architect",
    country: "India", city: "Bengaluru",
    industry: "Telecommunications",
    linkedin_url: "https://www.linkedin.com/in/lucasbergstrom",
    education: [{ institution: "Indian Institute of Science", degree: "M.Tech.", field: "Electrical Communication Engineering", graduation_year: "2013" }],
    past_employers: [{ company: "IBM", role: "Network Solutions Engineer", years: "2013–2018" }],
    career_interests: ["Platform engineering", "Cloud architecture", "AI / ML"],
    consent: consentFull(),
    networking_identity: niAll(),
    event_signal_profile: {
      goals: ["Learn new technologies", "Explore AI", "Network with peers"],
      tech_tracks: ["Cloud", "AI", "Automation"],
      open_to: ["Meet Architects", "Meet IBM experts"],
      roles_at_txc: ["Architect"],
      intent: { needs: ["Architecture guidance", "Hands-on learning"], aspiration: "Find IBM partners building network intelligence on hybrid cloud infrastructure." },
    },
    compass_intelligence: { matching_keywords: keywords(["cloud","ai","automation","architecture guidance","hands-on learning","indian institute of science","ibm","ericsson","5g platform architect","bengaluru","india","telecommunications"]) },
    registration: { attending: true, registered: true, attendee_type: "general", industry: "Telecommunications" },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nEventCompass — Participant Demo Reset (Admin SDK)");
  console.log("──────────────────────────────────────────────────");

  // ── Step 1: Backup ─────────────────────────────────────────────────────────
  console.log("\n[1/3] Backing up existing participants…");

  const snap     = await db.collection(`${BASE}/participants`).get();
  const existing = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));

  if (existing.length > 0) {
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = path.join(backupsDir, `participants-backup-${ts}.json`);
    fs.writeFileSync(filename, JSON.stringify(existing, null, 2), "utf8");
    console.log(`  ✓ ${existing.length} participant(s) backed up → ${filename}`);
  } else {
    console.log("  ✓ No existing participants. Skipping backup.");
  }

  // ── Step 2: Delete ─────────────────────────────────────────────────────────
  console.log("\n[2/3] Deleting all participants…");

  let deleted = 0;
  for (const d of snap.docs) {
    await db.doc(`${BASE}/participants/${d.id}`).delete();
    deleted++;
  }
  console.log(`  ✓ ${deleted} participant(s) deleted`);

  // ── Step 3: Seed ───────────────────────────────────────────────────────────
  console.log("\n[3/3] Seeding 15 synthetic participants…");

  let seeded = 0;
  for (const p of PARTICIPANTS) {
    await db.doc(`${BASE}/participants/${p.id}`).set(p);
    console.log(`  ✓  ${p.display_name.padEnd(25)} → participants/${p.id}`);
    seeded++;
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const countries = new Set(PARTICIPANTS.map(p => p.country));
  const unis      = new Set(PARTICIPANTS.flatMap(p => p.education.map(e => e.institution)));
  const employers = new Set(PARTICIPANTS.flatMap(p => p.past_employers.map(e => e.company)));
  const liVisible = PARTICIPANTS.filter(p => p.linkedin_url && p.consent.show_linkedin && p.consent.public_profile).length;
  const privateP  = PARTICIPANTS.filter(p => !p.consent.public_profile).length;

  console.log("\n──────────────────────────────────────────────────");
  console.log("Summary");
  console.log("──────────────────────────────────────────────────");
  console.log(`  Participants deleted:   ${deleted}`);
  console.log(`  Participants seeded:    ${seeded}`);
  console.log(`  Countries:              ${countries.size}  (${[...countries].join(", ")})`);
  console.log(`  Universities:           ${unis.size}  (${[...unis].join(", ")})`);
  console.log(`  Employers represented:  ${employers.size}`);
  console.log(`  LinkedIn visible:       ${liVisible}`);
  console.log(`  Private profiles:       ${privateP}`);
  console.log("\nDone. Compass is ready for demo.\n");

  process.exit(0);
}

run().catch(err => {
  console.error("\nReset failed:", err.message ?? err);
  process.exit(1);
});