import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ESLint 빌드 시 오류 발생해도 배포 진행
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
