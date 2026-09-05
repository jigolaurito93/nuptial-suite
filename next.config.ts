import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/story", destination: "/#story", permanent: false },
      { source: "/schedule", destination: "/#schedule", permanent: false },
      { source: "/venue", destination: "/#venue", permanent: false },
      { source: "/rsvp", destination: "/#rsvp", permanent: false },
      { source: "/registry", destination: "/#registry", permanent: false },
      { source: "/planner", destination: "/admin", permanent: false },
      { source: "/planner/:path*", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
