import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 部署需要静态图片优化关闭
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
