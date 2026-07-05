import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态导出，部署到 Cloudflare Pages
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
