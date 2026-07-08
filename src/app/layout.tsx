import type { Metadata } from "next";
import "./globals.css";

// 站点元信息
export const metadata: Metadata = {
  title: "古时月",
  description: "用古人的智慧，照亮当下的生活",
};

/**
 * 根布局
 * 水墨画风格全站基础，宽屏网页布局
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
