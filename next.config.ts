import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations for t3.medium
  compress: true,
  poweredByHeader: false,
  
  // Enable optimizations for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
