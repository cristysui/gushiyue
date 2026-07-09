// 古时月 Service Worker - 离线缓存策略
const CACHE_VERSION = "v3";
const STATIC_CACHE = `gushiyue-static-${CACHE_VERSION}`;
const IMG_CACHE = `gushiyue-img-${CACHE_VERSION}`;

// 首屏关键资源（安装时预缓存）
const PRECACHE_URLS = [
  "/",
  "/assets/four-seasons-study-components/window-landscape-background.webp",
  "/assets/four-seasons-study-components/landscape-fixed-background-room.webp",
  "/assets/four-seasons-study-components/landscape-fixed-foreground-desk.webp",
  "/assets/four-seasons-study-components/portrait-fixed-background-room.webp",
  "/assets/four-seasons-study-components/portrait-fixed-foreground-desk.webp",
  "/assets/four-seasons-study-components/ancient-guest-scholar-full-body.webp",
];

// 安装：预缓存首屏关键资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求拦截策略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理 GET 请求
  if (request.method !== "GET") return;

  // 跳过 Supabase API 和 Google Fonts
  if (url.hostname.includes("supabase") || url.hostname.includes("googleapis") || url.hostname.includes("gstatic")) {
    return;
  }

  // 图片资源：缓存优先 + 后台更新（stale-while-revalidate）
  if (url.pathname.includes("/assets/") || url.pathname.endsWith(".webp") || url.pathname.endsWith(".png") || url.pathname.endsWith(".jpg")) {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE));
    return;
  }

  // JS/CSS/JSON 等静态资源：缓存优先
  if (url.pathname.includes("/_next/static/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // HTML 页面：网络优先，失败回退缓存（保证更新及时）
  if (request.mode === "navigate" || url.pathname === "/") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }
});

// Stale-While-Revalidate 策略：先返回缓存，后台更新
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      // 只缓存成功的响应
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // 网络失败返回缓存

  // 有缓存先返回缓存，否则等网络
  return cached || fetchPromise;
}
