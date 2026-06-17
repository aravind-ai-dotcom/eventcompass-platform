import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/compass", destination: "/profile", permanent: false },
      { source: "/sko/content", destination: "/content", permanent: false },
    ];
  },
};

export default nextConfig;
