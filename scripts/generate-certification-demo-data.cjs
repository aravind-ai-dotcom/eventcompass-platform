/**
 * Generates synthetic certification paths and supporting sessions for Compass demos.
 * Output: demo-data/txc2026/certifications.json, demo-data/txc2026/certification_sessions.json
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(process.cwd(), "demo-data/txc2026");

const CERTIFICATIONS = [
  {
    certification_id: "QISKIT-DEVELOPER-001",
    certification_code: "C1000-QISKIT",
    title: "IBM Certified Developer – Fundamentals of Quantum Computation Using Qiskit",
    description:
      "Validates foundational quantum computing concepts, Qiskit programming patterns, circuit design, and runtime execution for developers building quantum applications.",
    difficulty: "Intermediate",
    track: "App Development",
    products: ["IBM Quantum Platform", "Qiskit", "Qiskit Runtime"],
    topics: ["Quantum", "Qiskit", "Python"],
    recommended_roles: ["Developer", "Research Scientist", "Data Scientist"],
    estimated_hours: 48,
    exam_day: "Wednesday",
    exam_date: "2026-10-28",
    exam_time: "02:00 PM",
    exam_location: "Certification Zone – Room C12",
  },
  {
    certification_id: "AGENTIC-AI-001",
    certification_code: "C1000-AGENTIC",
    title: "IBM Certified Agentic AI Developer",
    description:
      "Demonstrates ability to design, orchestrate, and govern agentic AI workflows using watsonx Orchestrate, assistants, and enterprise automation patterns.",
    difficulty: "Advanced",
    track: "AI",
    products: ["watsonx Orchestrate", "watsonx Assistant", "IBM Cloud"],
    topics: ["Agentic AI", "Assistants", "Workflows", "Automation"],
    recommended_roles: ["Developer", "AI Engineer", "Solution Architect"],
    estimated_hours: 56,
    exam_day: "Wednesday",
    exam_date: "2026-10-28",
    exam_time: "09:00 AM",
    exam_location: "Certification Zone – Room C08",
  },
  {
    certification_id: "WATSONX-ENGINEER-001",
    certification_code: "C1000-WATSONX",
    title: "IBM Certified watsonx AI Engineer",
    description:
      "Covers watsonx.ai model lifecycle, prompt engineering, retrieval-augmented generation, governance controls, and production deployment on IBM Cloud.",
    difficulty: "Advanced",
    track: "AI",
    products: ["watsonx.ai", "watsonx.governance", "IBM Cloud"],
    topics: ["watsonx", "Prompt Engineering", "Models", "AI Governance"],
    recommended_roles: ["AI Engineer", "MLOps Engineer", "Data Scientist"],
    estimated_hours: 60,
    exam_day: "Tuesday",
    exam_date: "2026-10-27",
    exam_time: "04:00 PM",
    exam_location: "Certification Zone – Room C10",
  },
  {
    certification_id: "POWER-ADMIN-001",
    certification_code: "C1000-POWER",
    title: "IBM Certified Power Systems Administrator",
    description:
      "Validates Power10 administration, virtualization with PowerVM, storage management, high availability, and day-two operations for enterprise workloads.",
    difficulty: "Intermediate",
    track: "Power",
    products: ["Power10", "PowerVM", "IBM i", "AIX"],
    topics: ["Power10", "Virtualization", "Operations"],
    recommended_roles: ["Systems Administrator", "Infrastructure Engineer", "Operations Manager"],
    estimated_hours: 52,
    exam_day: "Wednesday",
    exam_date: "2026-10-28",
    exam_time: "11:00 AM",
    exam_location: "Certification Zone – Room C06",
  },
  {
    certification_id: "OPENSHIFT-ARCHITECT-001",
    certification_code: "C1000-ROSA",
    title: "Red Hat OpenShift Architect",
    description:
      "Assesses expertise designing secure, scalable container platforms on OpenShift including networking, GitOps, observability, and hybrid cloud integration.",
    difficulty: "Advanced",
    track: "Cloud",
    products: ["Red Hat OpenShift", "OpenShift Virtualization", "IBM Cloud"],
    topics: ["Containers", "Kubernetes", "OpenShift"],
    recommended_roles: ["Cloud Architect", "Platform Engineer", "DevOps Lead"],
    estimated_hours: 64,
    exam_day: "Tuesday",
    exam_date: "2026-10-27",
    exam_time: "01:00 PM",
    exam_location: "Certification Zone – Room C14",
  },
  {
    certification_id: "DATA-ENGINEER-001",
    certification_code: "C1000-DATAENG",
    title: "IBM Certified Data Engineer – watsonx.data",
    description:
      "Covers data lakehouse architecture, ingestion pipelines, SQL and Spark workloads, data governance, and operational analytics on watsonx.data.",
    difficulty: "Intermediate",
    track: "Data & AI",
    products: ["watsonx.data", "IBM Cloud Pak for Data", "Db2"],
    topics: ["Data Engineering", "Lakehouse", "SQL", "Spark"],
    recommended_roles: ["Data Engineer", "Analytics Engineer", "Database Administrator"],
    estimated_hours: 50,
    exam_day: "Tuesday",
    exam_date: "2026-10-27",
    exam_time: "09:00 AM",
    exam_location: "Certification Zone – Room C04",
  },
  {
    certification_id: "CLOUD-ARCHITECT-001",
    certification_code: "C1000-CLOUD",
    title: "IBM Certified Cloud Architect",
    description:
      "Validates multi-cloud architecture design on IBM Cloud including VPC, security, resiliency, cost optimization, and integration with enterprise identity.",
    difficulty: "Advanced",
    track: "Cloud",
    products: ["IBM Cloud", "IBM Cloud VPC", "IBM Cloud Security"],
    topics: ["Cloud Architecture", "Hybrid Cloud", "Security", "Resiliency"],
    recommended_roles: ["Cloud Architect", "Solution Architect", "Technical Leader"],
    estimated_hours: 58,
    exam_day: "Wednesday",
    exam_date: "2026-10-28",
    exam_time: "04:00 PM",
    exam_location: "Certification Zone – Room C16",
  },
  {
    certification_id: "MAINFRAME-ADMIN-001",
    certification_code: "C1000-ZOS",
    title: "IBM Certified z/OS System Administrator",
    description:
      "Demonstrates z/OS systems programming fundamentals, SMP/E, security with RACF, batch processing, and operational recovery for mission-critical workloads.",
    difficulty: "Advanced",
    track: "Mainframe",
    products: ["z/OS", "IBM Z", "RACF", "CICS"],
    topics: ["z/OS", "Mainframe Operations", "Security", "Batch"],
    recommended_roles: ["Mainframe Administrator", "Systems Programmer", "Operations Analyst"],
    estimated_hours: 72,
    exam_day: "Tuesday",
    exam_date: "2026-10-27",
    exam_time: "11:00 AM",
    exam_location: "Certification Zone – Room C02",
  },
  {
    certification_id: "SECURITY-ANALYST-001",
    certification_code: "C1000-SEC",
    title: "IBM Certified Security Analyst – QRadar SIEM",
    description:
      "Covers threat detection with QRadar, log source management, offense investigation, UBA analytics, and incident response workflows for SOC teams.",
    difficulty: "Intermediate",
    track: "Security",
    products: ["IBM QRadar SIEM", "IBM Security Verify", "IBM Guardium"],
    topics: ["SIEM", "Threat Detection", "Incident Response", "Security Analytics"],
    recommended_roles: ["Security Analyst", "SOC Engineer", "Threat Hunter"],
    estimated_hours: 44,
    exam_day: "Wednesday",
    exam_date: "2026-10-28",
    exam_time: "08:00 AM",
    exam_location: "Certification Zone – Room C18",
  },
  {
    certification_id: "IBM-I-ADMIN-001",
    certification_code: "C1000-IBMI",
    title: "IBM Certified IBM i System Administrator",
    description:
      "Validates IBM i administration including subsystem management, security, backup and recovery, performance tuning, and modernization pathways.",
    difficulty: "Intermediate",
    track: "Power",
    products: ["IBM i", "Power10", "Db2 for i"],
    topics: ["IBM i", "System Administration", "Db2 for i", "Security"],
    recommended_roles: ["IBM i Administrator", "Systems Administrator", "Operations Manager"],
    estimated_hours: 46,
    exam_day: "Tuesday",
    exam_date: "2026-10-27",
    exam_time: "03:00 PM",
    exam_location: "Certification Zone – Room C08",
  },
];

const SESSION_TEMPLATES = {
  breakouts: [
    { suffix: "TB01", title: (t) => `Introduction to ${t}` },
    { suffix: "TB02", title: (t) => `Core Concepts for ${t}` },
    { suffix: "TB03", title: (t) => `Architecture Patterns in ${t}` },
    { suffix: "TB04", title: (t) => `${t} Deep Dive` },
    { suffix: "TB05", title: (t) => `Advanced Techniques in ${t}` },
    { suffix: "TB06", title: (t) => `${t} Application Patterns` },
  ],
  labs: [
    { suffix: "LAB01", title: (t) => `Hands-On ${t} Lab` },
    { suffix: "LAB02", title: (t) => `${t} Developer Workshop` },
  ],
  meetup: { suffix: "MEET01", title: (t) => `${t} Community Meetup` },
  huddle: { suffix: "HUD01", title: (t) => `${t} Certification Study Group` },
  exam: { suffix: "EXAM", title: (t) => `${t} Certification Exam` },
};

const SLOT_GRID = [
  { day: "Tuesday", date: "2026-10-27", start: "10:00 AM", end: "11:00 AM", room: "Breakout Room 201" },
  { day: "Tuesday", date: "2026-10-27", start: "11:15 AM", end: "12:15 PM", room: "Breakout Room 202" },
  { day: "Tuesday", date: "2026-10-27", start: "01:30 PM", end: "02:30 PM", room: "Breakout Room 203" },
  { day: "Tuesday", date: "2026-10-27", start: "02:45 PM", end: "03:45 PM", room: "Breakout Room 204" },
  { day: "Wednesday", date: "2026-10-28", start: "10:00 AM", end: "11:00 AM", room: "Breakout Room 301" },
  { day: "Wednesday", date: "2026-10-28", start: "11:15 AM", end: "12:15 PM", room: "Breakout Room 302" },
  { day: "Tuesday", date: "2026-10-27", start: "03:00 PM", end: "05:00 PM", room: "Hands-On Lab A" },
  { day: "Wednesday", date: "2026-10-28", start: "01:00 PM", end: "03:00 PM", room: "Hands-On Lab B" },
  { day: "Tuesday", date: "2026-10-27", start: "05:30 PM", end: "06:30 PM", room: "Community Hub" },
  { day: "Wednesday", date: "2026-10-28", start: "12:30 PM", end: "01:15 PM", room: "Hilton Lounge, 2nd Floor" },
];

function shortTopic(cert) {
  const map = {
    "QISKIT-DEVELOPER-001": "Qiskit",
    "AGENTIC-AI-001": "Agentic AI",
    "WATSONX-ENGINEER-001": "watsonx AI",
    "POWER-ADMIN-001": "Power Systems",
    "OPENSHIFT-ARCHITECT-001": "OpenShift",
    "DATA-ENGINEER-001": "watsonx.data",
    "CLOUD-ARCHITECT-001": "IBM Cloud",
    "MAINFRAME-ADMIN-001": "z/OS",
    "SECURITY-ANALYST-001": "QRadar SIEM",
    "IBM-I-ADMIN-001": "IBM i",
  };
  return map[cert.certification_id] ?? cert.topics[0];
}

function reasonFor(cert, kind) {
  const short = shortTopic(cert);
  const reasons = {
    breakout: "Supports your certification journey.",
    lab: "Recommended for exam readiness.",
    meetup: "Learn alongside experts and peers.",
    huddle: "Study with peers pursuing similar goals.",
    journey: `Popular among attendees pursuing ${short}.`,
  };
  return reasons[kind];
}

function buildSession(cert, slot, opts) {
  const {
    sessionId,
    title,
    activityType,
    sessionType,
    kind,
    handsOn,
    slotIndex,
  } = opts;

  const short = shortTopic(cert);
  const prefix = cert.certification_id.replace(/-/g, "_");

  return {
    session_id: sessionId,
    title,
    activity_type: activityType,
    session_type: sessionType,
    summary: `${title}. Part of the ${cert.title} certification pathway at TechXchange 2026.`,
    track: cert.track,
    topics: cert.topics,
    certification_id: cert.certification_id,
    recommended_for: cert.recommended_roles,
    difficulty: cert.difficulty,
    day: slot.day,
    start_time: slot.start,
    location: slot.room,
    date: slot.date,
    schedule: {
      day: slot.day,
      date: slot.date,
      start_time: slot.start,
      end_time: slot.end,
      room: slot.room,
    },
    tracks: {
      primary_track: cert.track,
      secondary_tracks: ["Certification"],
      topics: [...cert.topics, "Certification", short],
      products: cert.products,
    },
    audience: {
      roles: cert.recommended_roles,
      industries: ["Technology", "Financial Services", "Healthcare", "Government"],
    },
    recommendation_rules: {
      everyone_encouraged: false,
      executive_relevant: cert.difficulty === "Advanced" && kind === "breakout",
      hands_on: handsOn,
    },
    compass_intelligence: {
      intent_tags: ["earn a certification", "hands-on learning", "exam prep"],
      need_tags: ["certification readiness", "structured learning"],
      matching_keywords: [
        ...cert.topics.map(t => t.toLowerCase()),
        "certification",
        "exam prep",
        cert.certification_code.toLowerCase(),
        short.toLowerCase(),
      ],
    },
    supports_certification: true,
    recommended_reason: reasonFor(cert, kind),
    certification_path: {
      certification_id: cert.certification_id,
      certification_code: cert.certification_code,
      milestone: kind === "journey" ? "Achieve" : kind === "lab" ? "Practice" : kind === "huddle" ? "Connect" : kind === "meetup" ? "Connect" : "Learn",
    },
    visibility: "public",
    capacity: {
      available_slots: kind === "exam" ? 24 : kind === "lab" ? 40 : 120,
      status: kind === "exam" ? "Limited seats" : "Open",
    },
    _slot_index: slotIndex,
  };
}

const CERT_ENRICHMENT = {
  "QISKIT-DEVELOPER-001": {
    certification_level: "Professional",
    guide_url: "https://www.ibm.com/training/certification/C1000-QISKIT",
    certification_url: "https://www.ibm.com/training/certification/C1000-QISKIT",
    skills_measured: ["Quantum circuit design", "Qiskit Runtime execution", "Error mitigation", "Python integration"],
    recommended_background: ["Python programming", "Linear algebra basics", "Introductory quantum concepts"],
    champion_ids: ["CHAMP-QUANTUM-01", "CHAMP-QISKIT-01"],
  },
  "AGENTIC-AI-001": {
    certification_level: "Advanced",
    guide_url: "https://www.ibm.com/training/certification/C1000-AGENTIC",
    certification_url: "https://www.ibm.com/training/certification/C1000-AGENTIC",
    skills_measured: ["Agent orchestration", "Tool use patterns", "Workflow automation", "AI governance controls"],
    recommended_background: ["Enterprise AI experience", "API integration", "Prompt engineering fundamentals"],
    champion_ids: ["CHAMP-AGENTIC-01", "CHAMP-WATSONX-02"],
  },
  "WATSONX-ENGINEER-001": {
    certification_level: "Advanced",
    guide_url: "https://www.ibm.com/training/certification/C1000-WATSONX",
    certification_url: "https://www.ibm.com/training/certification/C1000-WATSONX",
    skills_measured: ["Model tuning", "RAG pipelines", "MLOps on watsonx", "Governance policies"],
    recommended_background: ["ML or data science experience", "Cloud deployment basics", "Python or notebook workflows"],
    champion_ids: ["CHAMP-WATSONX-01", "CHAMP-AI-03"],
  },
  "POWER-ADMIN-001": {
    certification_level: "Professional",
    guide_url: "https://www.ibm.com/training/certification/C1000-POWER",
    certification_url: "https://www.ibm.com/training/certification/C1000-POWER",
    skills_measured: ["PowerVM administration", "Storage configuration", "HA/DR operations", "Security hardening"],
    recommended_background: ["AIX or IBM i operations", "Virtualization concepts", "Enterprise systems administration"],
    champion_ids: ["CHAMP-POWER-01"],
  },
  "OPENSHIFT-ARCHITECT-001": {
    certification_level: "Advanced",
    guide_url: "https://www.ibm.com/training/certification/C1000-ROSA",
    certification_url: "https://www.ibm.com/training/certification/C1000-ROSA",
    skills_measured: ["Cluster architecture", "GitOps pipelines", "Network security", "Hybrid cloud design"],
    recommended_background: ["Kubernetes administration", "Container platforms", "DevOps practices"],
    champion_ids: ["CHAMP-OPENSHIFT-01", "CHAMP-CLOUD-02"],
  },
  "DATA-ENGINEER-001": {
    certification_level: "Professional",
    guide_url: "https://www.ibm.com/training/certification/C1000-DATAENG",
    certification_url: "https://www.ibm.com/training/certification/C1000-DATAENG",
    skills_measured: ["Lakehouse ingestion", "Spark workloads", "Data cataloging", "Pipeline operations"],
    recommended_background: ["SQL proficiency", "Data pipeline experience", "Cloud analytics exposure"],
    champion_ids: ["CHAMP-DATA-01"],
  },
  "CLOUD-ARCHITECT-001": {
    certification_level: "Advanced",
    guide_url: "https://www.ibm.com/training/certification/C1000-CLOUD",
    certification_url: "https://www.ibm.com/training/certification/C1000-CLOUD",
    skills_measured: ["VPC landing zones", "Hybrid connectivity", "Resiliency design", "Identity and compliance"],
    recommended_background: ["Cloud architecture experience", "Enterprise integration", "Security fundamentals"],
    champion_ids: ["CHAMP-CLOUD-01", "CHAMP-CLOUD-03"],
  },
  "MAINFRAME-ADMIN-001": {
    certification_level: "Advanced",
    guide_url: "https://www.ibm.com/training/certification/C1000-ZOS",
    certification_url: "https://www.ibm.com/training/certification/C1000-ZOS",
    skills_measured: ["z/OS operations", "SMP/E management", "RACF security", "Batch and recovery"],
    recommended_background: ["Mainframe operations", "JCL and batch processing", "Systems programming exposure"],
    champion_ids: ["CHAMP-Z-01"],
  },
  "SECURITY-ANALYST-001": {
    certification_level: "Professional",
    guide_url: "https://www.ibm.com/training/certification/C1000-SEC",
    certification_url: "https://www.ibm.com/training/certification/C1000-SEC",
    skills_measured: ["Log source tuning", "Offense investigation", "UBA analytics", "Incident response"],
    recommended_background: ["SOC operations", "Networking fundamentals", "SIEM experience"],
    champion_ids: ["CHAMP-SEC-01"],
  },
  "IBM-I-ADMIN-001": {
    certification_level: "Professional",
    guide_url: "https://www.ibm.com/training/certification/C1000-IBMI",
    certification_url: "https://www.ibm.com/training/certification/C1000-IBMI",
    skills_measured: ["Subsystem management", "IBM i security", "Backup and recovery", "Performance tuning"],
    recommended_background: ["IBM i operations", "Db2 for i basics", "Enterprise administration"],
    champion_ids: ["CHAMP-IBMI-01"],
  },
};

function buildJourneyAnchor(cert, enrichment, related) {
  const code = certSlug(cert.certification_id);
  const sessionId = `CERT-${code}-JOURNEY`;

  const base = {
    session_id: sessionId,
    title: cert.title,
    description: cert.description,
    activity_type: "Certification",
    session_type: "Certification",
    summary: cert.description,
    track: cert.track,
    topics: cert.topics,
    certification_id: cert.certification_id,
    certification_code: cert.certification_code,
    recommended_for: cert.recommended_roles,
    difficulty: cert.difficulty,
    tracks: {
      primary_track: cert.track,
      secondary_tracks: ["Certification"],
      topics: [...cert.topics, "Certification", shortTopic(cert)],
      products: cert.products,
    },
    audience: {
      roles: cert.recommended_roles,
      industries: ["Technology", "Financial Services", "Healthcare", "Government"],
    },
    recommendation_rules: {
      everyone_encouraged: false,
      executive_relevant: false,
      hands_on: false,
    },
    compass_intelligence: {
      intent_tags: ["earn a certification", "hands-on learning", "exam prep"],
      need_tags: ["certification readiness", "structured learning"],
      matching_keywords: [
        ...cert.topics.map(t => t.toLowerCase()),
        "certification",
        "exam prep",
        cert.certification_code.toLowerCase(),
        shortTopic(cert).toLowerCase(),
      ],
    },
    supports_certification: false,
    recommended_reason: reasonFor(cert, "journey"),
    certification_path: {
      certification_id: cert.certification_id,
      certification_code: cert.certification_code,
      milestone: "Achieve",
    },
    visibility: "public",
    capacity: {
      available_slots: 0,
      status: "On demand",
    },
  };

  return {
    ...base,
    certification_url: enrichment.certification_url,
    guide_url: enrichment.guide_url,
    certification_level: enrichment.certification_level,
    skills_measured: enrichment.skills_measured,
    recommended_background: enrichment.recommended_background,
    estimated_preparation_hours: cert.estimated_hours,
    related_session_ids: related.breakouts,
    related_lab_ids: related.labs,
    related_huddle_ids: related.huddles,
    related_community_ids: related.communities,
    related_champion_ids: enrichment.champion_ids,
    learn_more_url: enrichment.certification_url,
  };
}

function addHours(timeStr, hours) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ap = match[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  h += hours;
  const nextAp = h >= 12 ? "PM" : "AM";
  let display = h % 12;
  if (display === 0) display = 12;
  return `${display}:${m} ${nextAp}`;
}

function certSlug(certificationId) {
  const slugs = {
    "QISKIT-DEVELOPER-001": "QISKIT",
    "AGENTIC-AI-001": "AGENTIC",
    "WATSONX-ENGINEER-001": "WATSONX",
    "POWER-ADMIN-001": "POWER",
    "OPENSHIFT-ARCHITECT-001": "OPENSHIFT",
    "DATA-ENGINEER-001": "DATAENG",
    "CLOUD-ARCHITECT-001": "CLOUD",
    "MAINFRAME-ADMIN-001": "MAINFRAME",
    "SECURITY-ANALYST-001": "SECURITY",
    "IBM-I-ADMIN-001": "IBMI",
  };
  return slugs[certificationId] ?? certificationId.split("-")[0];
}

function buildSessionsForCert(cert, certIndex) {
  const enrichment = CERT_ENRICHMENT[cert.certification_id] ?? {
    certification_level: "Professional",
    guide_url: `https://www.ibm.com/training/certification/${cert.certification_code}`,
    certification_url: `https://www.ibm.com/training/certification/${cert.certification_code}`,
    skills_measured: cert.topics.map(t => `${t} fundamentals`),
    recommended_background: ["Relevant industry experience", "Foundational product knowledge"],
    champion_ids: [`CHAMP-${certSlug(cert.certification_id)}-01`],
  };
  const short = shortTopic(cert);
  const code = certSlug(cert.certification_id);
  const sessions = [];
  const breakouts = [];
  const labs = [];
  const communities = [];
  const huddles = [];
  const slotOffset = (certIndex * 2) % 6;

  SESSION_TEMPLATES.breakouts.forEach((tpl, i) => {
    const session = buildSession(cert, SLOT_GRID[(slotOffset + i) % SLOT_GRID.length], {
      sessionId: `CERT-${code}-${tpl.suffix}`,
      title: tpl.title(short),
      activityType: "Technology Breakout",
      sessionType: "Technology Breakout",
      kind: "breakout",
      handsOn: false,
      slotIndex: i,
    });
    sessions.push(session);
    breakouts.push(session.session_id);
  });

  SESSION_TEMPLATES.labs.forEach((tpl, i) => {
    const session = buildSession(cert, SLOT_GRID[6 + i], {
      sessionId: `CERT-${code}-${tpl.suffix}`,
      title: tpl.title(short),
      activityType: "Instructor-Led Lab",
      sessionType: "Instructor-Led Lab",
      kind: "lab",
      handsOn: true,
      slotIndex: 6 + i,
    });
    sessions.push(session);
    labs.push(session.session_id);
  });

  const meetupSession = buildSession(cert, SLOT_GRID[8], {
    sessionId: `CERT-${code}-${SESSION_TEMPLATES.meetup.suffix}`,
    title: SESSION_TEMPLATES.meetup.title(short),
    activityType: "Community Meetup",
    sessionType: "Community Meetup",
    kind: "meetup",
    handsOn: false,
    slotIndex: 8,
  });
  sessions.push(meetupSession);
  communities.push(meetupSession.session_id);

  const huddleSession = buildSession(cert, SLOT_GRID[9], {
    sessionId: `CERT-${code}-${SESSION_TEMPLATES.huddle.suffix}`,
    title: SESSION_TEMPLATES.huddle.title(short),
    activityType: "Huddle",
    sessionType: "Study Group",
    kind: "huddle",
    handsOn: false,
    slotIndex: 9,
  });
  sessions.push(huddleSession);
  huddles.push(huddleSession.session_id);

  const journeySession = buildJourneyAnchor(cert, enrichment, {
    breakouts, labs, huddles, communities,
  });
  sessions.push(journeySession);

  return { sessions, journeySessionId: journeySession.session_id, enrichment, related: { breakouts, labs, huddles, communities } };
}

const CUSTOM_SESSION_TITLES = {
  "QISKIT-DEVELOPER-001": [
    "Introduction to Quantum Computing with Qiskit",
    "Building Quantum Circuits in Python",
    "Understanding Quantum Gates",
    "Qiskit Runtime Deep Dive",
    "Quantum Error Mitigation Techniques",
    "Quantum Application Patterns",
    "Hands-On Quantum Lab",
    "Qiskit Developer Workshop",
    "Quantum Community Meetup",
    "Qiskit Certification Study Group",
    "Qiskit Certification Exam",
  ],
  "AGENTIC-AI-001": [
    "Designing Agentic AI Systems on watsonx",
    "Building Multi-Agent Workflows with watsonx Orchestrate",
    "Tool Use and Function Calling for Enterprise Assistants",
    "Governance and Guardrails for Agentic AI",
    "Observability for Production Agent Deployments",
    "Agentic AI Reference Architectures",
    "Hands-On Agentic AI Lab",
    "Agentic AI Developer Workshop",
    "Agentic AI Community Meetup",
    "Agentic AI Certification Study Group",
    "Agentic AI Certification Exam",
  ],
  "WATSONX-ENGINEER-001": [
    "watsonx.ai Platform Overview for Engineers",
    "Prompt Engineering and Model Tuning Fundamentals",
    "Retrieval-Augmented Generation on watsonx",
    "Model Lifecycle Management and MLOps",
    "AI Governance with watsonx.governance",
    "Production Deployment Patterns for watsonx",
    "Hands-On watsonx AI Lab",
    "watsonx AI Engineer Workshop",
    "watsonx AI Community Meetup",
    "watsonx Certification Study Group",
    "watsonx AI Engineer Certification Exam",
  ],
  "POWER-ADMIN-001": [
    "Power10 Systems Overview for Administrators",
    "PowerVM Virtualization and Resource Management",
    "Storage and I/O Configuration on Power",
    "High Availability and Disaster Recovery on Power",
    "Day-Two Operations and Performance Monitoring",
    "Power Systems Security Hardening",
    "Hands-On Power Systems Lab",
    "Power Administrator Workshop",
    "Power Systems Community Meetup",
    "Power Administrator Certification Study Group",
    "Power Systems Administrator Certification Exam",
  ],
  "OPENSHIFT-ARCHITECT-001": [
    "OpenShift Platform Architecture Fundamentals",
    "Kubernetes Networking and Security on OpenShift",
    "GitOps and CI/CD Pipelines with OpenShift",
    "OpenShift Virtualization and Hybrid Workloads",
    "Observability and Service Mesh Patterns",
    "Multi-Cluster and Hybrid Cloud OpenShift Design",
    "Hands-On OpenShift Architect Lab",
    "OpenShift Architect Workshop",
    "OpenShift Community Meetup",
    "OpenShift Architect Certification Study Group",
    "Red Hat OpenShift Architect Certification Exam",
  ],
  "DATA-ENGINEER-001": [
    "Lakehouse Architecture with watsonx.data",
    "Data Ingestion and Cataloging at Scale",
    "SQL and Spark Workloads on watsonx.data",
    "Data Quality and Lineage for Analytics Pipelines",
    "Operationalizing Data Products in Production",
    "Data Engineering Patterns for AI Workloads",
    "Hands-On watsonx.data Lab",
    "Data Engineer Workshop",
    "Data & AI Community Meetup",
    "Data Engineer Certification Study Group",
    "IBM Certified Data Engineer Certification Exam",
  ],
  "CLOUD-ARCHITECT-001": [
    "IBM Cloud Reference Architectures",
    "Designing Secure VPC Landing Zones",
    "Hybrid Cloud Connectivity and Integration",
    "Resiliency and Disaster Recovery on IBM Cloud",
    "Cost Optimization and FinOps for Cloud Architects",
    "Identity, Access, and Compliance Controls",
    "Hands-On IBM Cloud Architect Lab",
    "Cloud Architect Design Workshop",
    "IBM Cloud Community Meetup",
    "Cloud Architect Certification Study Group",
    "IBM Certified Cloud Architect Exam",
  ],
  "MAINFRAME-ADMIN-001": [
    "z/OS Systems Programming Fundamentals",
    "SMP/E and Software Deployment on z/OS",
    "RACF Security Administration",
    "Batch Processing and JES2 Operations",
    "Operational Recovery and Sysplex Management",
    "Modernizing Mainframe Workloads",
    "Hands-On z/OS Administration Lab",
    "z/OS Administrator Workshop",
    "Mainframe Community Meetup",
    "z/OS Certification Study Group",
    "IBM Certified z/OS Administrator Exam",
  ],
  "SECURITY-ANALYST-001": [
    "QRadar SIEM Architecture and Deployment",
    "Log Source Management and Normalization",
    "Offense Investigation and Triage Workflows",
    "User Behavior Analytics with QRadar",
    "Threat Hunting with QRadar Ariel",
    "Incident Response Integration Patterns",
    "Hands-On QRadar SIEM Lab",
    "Security Analyst Workshop",
    "Cybersecurity Community Meetup",
    "QRadar Certification Study Group",
    "IBM Certified Security Analyst Exam",
  ],
  "IBM-I-ADMIN-001": [
    "IBM i System Administration Essentials",
    "Subsystem and Work Management on IBM i",
    "IBM i Security and Auditing",
    "Backup, Recovery, and High Availability on IBM i",
    "Performance Monitoring and Capacity Planning",
    "Application Modernization on IBM i",
    "Hands-On IBM i Administration Lab",
    "IBM i Administrator Workshop",
    "IBM i Community Meetup",
    "IBM i Certification Study Group",
    "IBM Certified IBM i Administrator Exam",
  ],
};

function main() {
  const certificationRecords = [];
  const allSessions = [];

  CERTIFICATIONS.forEach((cert, index) => {
    const { sessions, journeySessionId, enrichment, related } = buildSessionsForCert(cert, index);
    const customTitles = CUSTOM_SESSION_TITLES[cert.certification_id];
    if (customTitles) {
      sessions.slice(0, 10).forEach((s, i) => {
        if (customTitles[i]) s.title = customTitles[i];
      });
    }
    const journeySession = sessions.find(s => s.session_id === journeySessionId);
    if (journeySession) journeySession.title = cert.title;

    certificationRecords.push({
      certification_id: cert.certification_id,
      certification_code: cert.certification_code,
      title: cert.title,
      description: cert.description,
      difficulty: cert.difficulty,
      track: cert.track,
      topics: cert.topics,
      products: cert.products,
      guide_url: enrichment.guide_url,
      certification_url: enrichment.certification_url,
      certification_level: enrichment.certification_level,
      skills_measured: enrichment.skills_measured,
      recommended_background: enrichment.recommended_background,
      estimated_preparation_hours: cert.estimated_hours,
      session_id: journeySessionId,
      related_session_ids: related.breakouts,
      related_lab_ids: related.labs,
      related_champion_ids: enrichment.champion_ids,
      related_huddle_ids: related.huddles,
      related_community_ids: related.communities,
      pathway_summary: {
        technology_breakouts: 6,
        instructor_led_labs: 2,
        community_meetups: 1,
        study_group_huddles: 1,
        certification_journeys: 1,
      },
    });
    allSessions.push(...sessions.map(({ _slot_index, ...rest }) => rest));
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUT_DIR, "certifications.json"),
    JSON.stringify(
      {
        event_id: "txc2026",
        organization_id: "ibm",
        generated_at: new Date().toISOString(),
        description:
          "Synthetic certification learning journeys for Compass Certification Intelligence demos.",
        certifications: certificationRecords,
      },
      null,
      2,
    ) + "\n",
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "certification_sessions.json"),
    JSON.stringify(
      {
        event_id: "txc2026",
        organization_id: "ibm",
        generated_at: new Date().toISOString(),
        description:
          "Certification journeys and supporting sessions — breakouts, labs, meetups, and study groups.",
        sessions: allSessions,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`Wrote ${certificationRecords.length} certifications and ${allSessions.length} sessions to ${OUT_DIR}`);
}

main();
