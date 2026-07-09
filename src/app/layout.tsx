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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 预加载首屏关键图片（背景层） */}
        <link rel="preload" as="image" href="/assets/four-seasons-study-components/window-landscape-background.webp" />
        <link rel="preload" as="image" href="/assets/four-seasons-study-components/landscape-fixed-background-room.webp" />
        <link rel="preload" as="image" href="/assets/four-seasons-study-components/landscape-fixed-foreground-desk.webp" />
        {/* 异步加载字体：先用 print 媒体查询避免阻塞渲染，加载完成后切换为 all */}
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600;700&display=swap"
          rel="stylesheet"
          media="print"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var link = document.querySelector('link[media="print"]');
            if (link) {
              link.addEventListener('load', function() { link.media = 'all'; });
              // 3秒后强制加载，防止字体加载失败阻塞
              setTimeout(function() { link.media = 'all'; }, 3000);
            }
            // 注册 Service Worker（生产环境）
            if ('serviceWorker' in navigator && location.protocol === 'https:') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(){});
              });
            }
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
