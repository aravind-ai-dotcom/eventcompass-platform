export interface HuddleParticipantProfile {
  firstName: string;
  lastName?: string;
  organization?: string;
  role?: string;
  interests?: string[];
  openTo?: string[];
  sharedTopics?: string[];
}

const PROFILES: Record<string, HuddleParticipantProfile> = {
  Aravind: {
    firstName: "Aravind",
    lastName: "Ragupathi",
    organization: "IBM",
    role: "Product Architect",
    interests: ["Agentic AI", "Event intelligence", "Architecture"],
    openTo: ["In-person conversations", "Product feedback"],
    sharedTopics: ["Agentic AI", "Cloud Architecture"],
  },
  Priya: {
    firstName: "Priya",
    lastName: "Chandrasekaran",
    organization: "IBM",
    role: "Cloud Architect",
    interests: ["Agentic AI", "Hybrid Cloud"],
    openTo: ["Peer conversations", "Architecture reviews"],
    sharedTopics: ["Cloud Architecture", "Agentic AI"],
  },
  Jordan: {
    firstName: "Jordan",
    lastName: "Lee",
    organization: "Red Hat",
    role: "Platform Engineer",
    interests: ["OpenShift", "Kubernetes"],
    openTo: ["Technical deep dives"],
    sharedTopics: ["Platform", "Automation"],
  },
  Alex: {
    firstName: "Alex",
    lastName: "Chen",
    organization: "Acme Corp",
    role: "Developer Advocate",
    interests: ["AI", "Developer tools"],
    openTo: ["Mentoring", "Community"],
    sharedTopics: ["AI", "Community"],
  },
  Maya: {
    firstName: "Maya",
    lastName: "Patel",
    organization: "IBM",
    role: "Data Engineer",
    interests: ["Data governance", "Cloud"],
    openTo: ["Career conversations"],
    sharedTopics: ["Data", "Cloud Migration"],
  },
  Sam: {
    firstName: "Sam",
    lastName: "Rivera",
    organization: "Partner Co.",
    role: "Solutions Consultant",
    interests: ["Migration", "Automation"],
    openTo: ["Partner discussions"],
    sharedTopics: ["Cloud", "Migration"],
  },
  Carlos: {
    firstName: "Carlos",
    lastName: "Diaz",
    organization: "Enterprise Client",
    role: "IT Director",
    interests: ["Leadership", "Strategy"],
    openTo: ["Executive roundtables"],
    sharedTopics: ["Leadership", "Cloud"],
  },
  Sarah: {
    firstName: "Sarah",
    lastName: "Kim",
    organization: "IBM",
    role: "Executive Sponsor",
    interests: ["AI strategy", "Leadership"],
    openTo: ["Executive conversations"],
    sharedTopics: ["Leadership", "AI"],
  },
  Thomas: {
    firstName: "Thomas",
    lastName: "Wright",
    organization: "Global Bank",
    role: "VP Engineering",
    interests: ["Transformation", "Governance"],
    openTo: ["Peer networking"],
    sharedTopics: ["Leadership", "Strategy"],
  },
  Lina: {
    firstName: "Lina",
    lastName: "Nguyen",
    organization: "IBM",
    role: "Product Manager",
    interests: ["AI products", "Community"],
    openTo: ["Product feedback"],
    sharedTopics: ["AI", "Community"],
  },
  Nikhil: {
    firstName: "Nikhil",
    lastName: "Rao",
    organization: "IBM",
    role: "Certification SME",
    interests: ["Qiskit", "Exam prep"],
    openTo: ["Study groups", "Mentoring"],
    sharedTopics: ["Certification", "Developer"],
  },
  Elena: {
    firstName: "Elena",
    lastName: "Voss",
    organization: "Consulting Partner",
    role: "Data Architect",
    interests: ["Governance", "Compliance"],
    openTo: ["Architecture exchange"],
    sharedTopics: ["Data governance", "Compliance"],
  },
  Rob: {
    firstName: "Rob",
    lastName: "Miller",
    organization: "Healthcare Co.",
    role: "Security Lead",
    interests: ["Security", "AI governance"],
    openTo: ["Security discussions"],
    sharedTopics: ["Security", "Data"],
  },
  Kumar: {
    firstName: "Kumar",
    lastName: "Iyer",
    organization: "IBM",
    role: "OpenShift Specialist",
    interests: ["Kubernetes", "Platform"],
    openTo: ["Hands-on labs"],
    sharedTopics: ["OpenShift", "Platform"],
  },
  Ben: {
    firstName: "Ben",
    lastName: "Okafor",
    organization: "FinTech",
    role: "Certification Candidate",
    interests: ["Qiskit", "Developer"],
    openTo: ["Study groups"],
    sharedTopics: ["Certification", "Developer"],
  },
};

export function getHuddleParticipant(firstName: string): HuddleParticipantProfile {
  return PROFILES[firstName] ?? {
    firstName,
    organization: "TechXchange attendee",
    role: "Participant",
    interests: ["Networking"],
    openTo: ["In-person conversations"],
    sharedTopics: ["Community"],
  };
}
