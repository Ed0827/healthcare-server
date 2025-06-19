import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal config for t2.micro
  compress: true,
  poweredByHeader: false,
  
  // Disable heavy features
  experimental: {
    // Remove all experimental features
  },
  
  // Reduce bundle size
  swcMinify: false,
  
  // Disable image optimization to save memory
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
