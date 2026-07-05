import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯静态导出，部署到 Cloudflare Pages
  output: "export",
  images: {
    unoptimized: true,
  },
  // 确保构建时读取环境变量（不打缓存）
  generateBuildId: () => Date.now().toString(),
};

export default nextConfig;
