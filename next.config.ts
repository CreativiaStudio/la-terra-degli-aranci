import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.132', 'localhost', 'localhost:3000', '192.168.0.132:3000'],
};

export default nextConfig;
