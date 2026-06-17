import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/compass", destination: "/profile", permanent: false },
      { source: "/sko/content", destination: "/content", permanent: false },
      { source: "/sko/login", destination: "/login", permanent: false },
      { source: "/sko/enroll", destination: "/enroll", permanent: false },
      { source: "/sko/compass", destination: "/profile", permanent: false },
      { source: "/sko/pulse", destination: "/pulse", permanent: false },
      { source: "/sko", destination: "/", permanent: false },
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
