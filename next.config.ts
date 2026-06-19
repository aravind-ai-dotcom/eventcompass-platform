import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Root legacy SKO aliases → canonical /sko/*
      { source: "/compass", destination: "/sko/compass", permanent: false },
      { source: "/content", destination: "/sko/content", permanent: false },
      { source: "/enroll", destination: "/sko/enroll", permanent: false },
      { source: "/login", destination: "/sko/login", permanent: false },
      { source: "/people", destination: "/sko/people", permanent: false },
      { source: "/profile", destination: "/sko/compass", permanent: false },
      { source: "/pulse", destination: "/sko/pulse", permanent: false },
      { source: "/routes", destination: "/txc", permanent: false },
      // Legacy flat TechXchange routes → /txc/*
      { source: "/experience", destination: "/txc/experience", permanent: false },
      { source: "/explore", destination: "/txc/explore", permanent: false },
      { source: "/sessions", destination: "/txc/sessions", permanent: false },
      { source: "/champions", destination: "/txc/champions", permanent: false },
      { source: "/communities", destination: "/txc/communities", permanent: false },
      { source: "/journey-maps", destination: "/txc/journey-maps", permanent: false },
      { source: "/admin", destination: "/txc/admin", permanent: false },
    ];
  },
};

export default nextConfig;
