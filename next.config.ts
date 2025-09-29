// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      // Agar posters kisi aur CDN se aate hain to yahan add karo:
      // { protocol: "https", hostname: "cdn.example.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
