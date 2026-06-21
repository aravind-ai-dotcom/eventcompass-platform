// IBM Community destinations — official ecosystem (community.ibm.com)

export type IbmCommunityType = "Topic Group" | "User Group" | "Program";

export interface IbmCommunity {
  community_id: string;
  name: string;
  type: IbmCommunityType;
  description: string;
  url: string;
  topics: string[];
  products: string[];
  tracks: string[];
  member_count?: number;
  thread_count?: number;
  library_count?: number;
}

export const IBM_COMMUNITY_METRICS = {
  members: "500k+",
  topicGroups: "200+",
  userGroups: "250+",
} as const;

export const IBM_COMMUNITIES: IbmCommunity[] = [
  {
    community_id: "global-ai-data-science",
    name: "Global AI & Data Science",
    type: "Topic Group",
    description:
      "Practitioners building with watsonx, AI governance, data science, and enterprise AI — labs, best practices, and peer Q&A.",
    url: "https://community.ibm.com/community/user/ai",
    topics: ["AI", "Data Science", "Machine Learning", "watsonx", "Generative AI", "LLM", "Analytics"],
    products: ["watsonx", "IBM Cloud Pak for Data", "SPSS"],
    tracks: ["AI", "Data & Analytics", "Automation"],
    member_count: 42000,
    thread_count: 12800,
    library_count: 890,
  },
  {
    community_id: "ibm-community-hub",
    name: "IBM Community Hub",
    type: "Program",
    description:
      "The home for IBM Community — discover topic groups, user groups, Champions, and programs that continue beyond TechXchange.",
    url: "https://community.ibm.com",
    topics: ["IBM Community", "Networking", "Events", "Champions"],
    products: [],
    tracks: [],
    member_count: 500000,
  },
  {
    community_id: "global-business-analytics",
    name: "Global Business Analytics",
    type: "Topic Group",
    description:
      "Business analytics, planning, and intelligence — Cognos, Planning Analytics, and data-driven decision making.",
    url: "https://community.ibm.com/community/user/businessanalytics",
    topics: ["Analytics", "Business Intelligence", "Planning", "Cognos", "Data Governance"],
    products: ["Cognos Analytics", "Planning Analytics"],
    tracks: ["Data & Analytics", "Business Automation"],
    member_count: 18500,
    thread_count: 5400,
    library_count: 420,
  },
  {
    community_id: "ibm-champions",
    name: "IBM Champions",
    type: "Program",
    description:
      "Connect with IBM Champions — advocates, mentors, and community leaders across IBM technologies and user groups.",
    url: "https://community.ibm.com/community/user/champions",
    topics: ["Champions", "Advocacy", "Mentoring", "Leadership"],
    products: [],
    tracks: ["Community", "Leadership"],
    member_count: 1200,
    thread_count: 2100,
  },
  {
    community_id: "user-groups",
    name: "User Groups",
    type: "User Group",
    description:
      "Local and virtual IBM user groups worldwide — meet peers, share implementations, and continue learning after the event.",
    url: "https://community.ibm.com/community/user/groups",
    topics: ["User Groups", "Local Events", "Peer Learning", "Networking"],
    products: [],
    tracks: ["Infrastructure", "Cloud", "Security", "Automation"],
    member_count: 250000,
    thread_count: 8900,
  },
  {
    community_id: "automation-community",
    name: "Automation Community",
    type: "Topic Group",
    description:
      "Business automation, integration, and workflow — App Connect, API Connect, and event-driven architecture.",
    url: "https://community.ibm.com/community/user/automation",
    topics: ["Automation", "Integration", "API", "Workflow", "Event Streams"],
    products: ["App Connect", "API Connect", "IBM MQ"],
    tracks: ["Automation", "Integration"],
    member_count: 22000,
    thread_count: 6700,
    library_count: 310,
  },
  {
    community_id: "cloud-hybrid-platform",
    name: "Cloud & Hybrid Platform",
    type: "Topic Group",
    description:
      "Hybrid cloud, OpenShift, and platform engineering — modernization patterns and cloud-native operations.",
    url: "https://community.ibm.com/community/user/cloud",
    topics: ["Cloud", "Hybrid Cloud", "OpenShift", "Kubernetes", "Modernization"],
    products: ["Red Hat OpenShift", "IBM Cloud"],
    tracks: ["Cloud", "Infrastructure"],
    member_count: 35000,
    thread_count: 9100,
    library_count: 520,
  },
  {
    community_id: "security-community",
    name: "Security Community",
    type: "Topic Group",
    description:
      "Zero trust, identity, and threat management — QRadar, Guardium, and security operations best practices.",
    url: "https://community.ibm.com/community/user/security",
    topics: ["Security", "Zero Trust", "Identity", "SIEM", "Compliance"],
    products: ["QRadar", "Guardium", "Verify"],
    tracks: ["Security"],
    member_count: 16000,
    thread_count: 4800,
    library_count: 280,
  },
];
