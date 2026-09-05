import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/story", destination: "/#save-the-date", permanent: false },
      { source: "/schedule", destination: "/#program", permanent: false },
      { source: "/venue", destination: "/#venue", permanent: false },
      { source: "/rsvp", destination: "/#rsvp", permanent: false },
      { source: "/registry", destination: "/#gift-guide", permanent: false },
      { source: "/planner", destination: "/admin", permanent: false },
      { source: "/planner/:path*", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
