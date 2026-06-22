/** Aggregated audience trends for unsigned / permission-fallback pulse views. */

export interface PulseAudienceData {
  audienceTotal: number;
  trendingTopics: Record<string, number>;
  topCountries: Record<string, number>;
  topUniversities: Record<string, number>;
  topPastEmployers: Record<string, number>;
  communities: Record<string, number>;
  openToAlumni: number;
  openToColleague: number;
  openToCareer: number;
  openToMentoring: number;
}

export const PULSE_AUDIENCE_SEED: PulseAudienceData = {
  audienceTotal: 1284,
  trendingTopics: {
    "Agentic AI": 412,
    "Data & watsonx": 368,
    Automation: 294,
    "Hybrid cloud": 241,
    Security: 198,
    Certification: 176,
  },
  topCountries: {
    "United States": 518,
    India: 214,
    Brazil: 96,
    Canada: 88,
    "United Kingdom": 74,
    Germany: 62,
  },
  topUniversities: {
    "NC State University": 84,
    "Georgia Tech": 72,
    "University of Texas at Austin": 61,
    "MIT": 48,
    "University of Michigan": 44,
    "Carnegie Mellon": 39,
  },
  topPastEmployers: {
    IBM: 312,
    Microsoft: 118,
    Deloitte: 86,
    Accenture: 74,
    "Red Hat": 58,
    Amazon: 52,
  },
  communities: {
    "watsonx Community": 286,
    "IBM Champions": 214,
    "Data & AI Guild": 178,
    "Automation Guild": 142,
    "Cloud Native": 118,
    "Certification Study Groups": 96,
  },
  openToAlumni: 412,
  openToColleague: 368,
  openToCareer: 294,
  openToMentoring: 241,
};
