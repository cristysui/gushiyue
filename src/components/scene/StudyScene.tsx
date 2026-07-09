"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import studyLayoutData from "@/data/study-layout.json";
import { useSceneScale } from "./useSceneScale";

// ===== 类型 =====
type HotspotType = "ancient" | "poetry" | "jieqi" | "calendar" | "flowers" | "shichen" | "garden";

interface AncientLayoutOverride {
  x: number;
  y: number;
  w: number;
}

interface LayoutAsset {
  id: string;
  src: string;
  name: string;
  x: number;
  y: number;
  w: number;
  z: number;
  rotation?: number;
  opacity?: number;
  category?: string;
  interaction?: string;
  locked?: boolean;
  label?: string;
  ancientLayouts?: Record<string, AncientLayoutOverride>;
}

interface OrientationLayout {
  refW: number;
  refH: number;
  assets: LayoutAsset[];
  hotspots?: Hotspot[];
}

interface StudyLayout extends OrientationLayout {
  portrait?: OrientationLayout;
}

interface Hotspot {
  id: string;
  type: HotspotType;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

const fileLayout = studyLayoutData as StudyLayout;

// ===== localStorage 读取（覆盖文件配置）=====
// localStorage 布局版本号：每次更新布局文件后递增，使旧缓存自动失效
const LAYOUT_VERSION = 3;

function loadLocalLayout(isPortrait: boolean): LayoutAsset[] | null {
  if (typeof window === "undefined") return null;
  const key = isPortrait ? "gushiyue-study-layout-portrait" : "gushiyue-study-layout";
  const versionKey = "gushiyue-study-layout-version";
  try {
    // 版本不匹配时清除旧缓存
    const cachedVersion = localStorage.getItem(versionKey);
    if (cachedVersion !== String(LAYOUT_VERSION)) {
      localStorage.removeItem("gushiyue-study-layout");
      localStorage.removeItem("gushiyue-study-layout-portrait");
      localStorage.setItem(versionKey, String(LAYOUT_VERSION));
      return null;
    }
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

// ===== 天气粒子 =====
type WeatherType = "clear" | "rain" | "snow" | "petals";

function getSeasonWeather(): WeatherType {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "petals";
  if (month >= 5 && month <= 7) return "rain";
  if (month >= 8 && month <= 10) return "clear";
  return "snow";
}

function WeatherParticles({ type }: { type: WeatherType }) {
  const [particles] = useState(() =>
    Array.from({ length: type === "clear" ? 8 : 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 2 + Math.random() * 4,
    }))
  );

  if (type === "clear") return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background:
              type === "rain" ? "rgba(100, 130, 150, 0.4)"
              : type === "snow" ? "rgba(255, 255, 255, 0.7)"
              : "rgba(232, 180, 184, 0.6)",
            animation: `${type === "rain" ? "weather-fall-rain" : "weather-fall-gentle"} ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ===== 带淡入动画的场景图片 =====
function SceneImage({ src, alt, eager = false, style }: { src: string; alt: string; eager?: boolean; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 修复：浏览器缓存命中时 onLoad 可能在 React 挂载前已触发
  // 检查 img.complete && naturalWidth > 0 兜底
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      className={`scene-img ${loaded ? "loaded" : ""}`}
      style={style}
    />
  );
}

// ===== 古人 ID → 专属坐像图片映射 =====
const ANCIENT_IMAGE_MAP: Record<string, string> = {
  liqingzhao: "/assets/four-seasons-study-components/li_qingzhao_seated.webp",
  baijuyi: "/assets/four-seasons-study-components/bai_juyi_seated.webp",
  taoyuanming: "/assets/four-seasons-study-components/tao_yuanming_seated.webp",
  wangyangming: "/assets/four-seasons-study-components/wang_yangming_seated.webp",
};

// ===== 交互标记颜色映射 =====
const INTERACTION_COLORS: Record<string, string> = {
  ancient: "#c44536",
  poetry: "#b8860b",
  jieqi: "#6b8e6b",
  calendar: "#8b7355",
  flowers: "#d4829b",
  shichen: "#5f7a8b",
  garden: "#7a8c5a",
};

const INTERACTION_LABELS: Record<string, string> = {
  ancient: "与客交谈",
  poetry: "每日一诗",
  jieqi: "节气",
  calendar: "万年历",
  flowers: "花信",
  shichen: "时辰",
  garden: "时令",
};

const INTERACTION_ICONS: Record<string, string> = {
  ancient: "客",
  poetry: "诗",
  jieqi: "节",
  calendar: "历",
  flowers: "花",
  shichen: "时",
  garden: "食",
};

// ===== 主组件 =====
interface StudySceneProps {
  ancient: { id: string; name: string; dynasty: string; title: string; bio: string } | null;
  onInteract: (type: HotspotType) => void;
  /** 传入容器 ref 以计算等比缩放 */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Debug 模式下隐藏素材（由 DebugOverlay 独占渲染），退出时重新加载 */
  debugMode?: boolean;
  /** 今日数据，用于万年历牌文字 */
  today?: { lunarDate: string; lunarDateShort: string; date: string; weekday: string; jieqi: string; isJieqiDay: boolean; wuxing: string } | null;
}

export default function StudyScene({ ancient, onInteract, containerRef, debugMode = false, today = null }: StudySceneProps) {
  const weather = getSeasonWeather();
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // 等比缩放（自动检测横竖屏）
  const { scale, offsetX, offsetY, refW, refH, isPortrait } = useSceneScale(containerRef);

  // 当前方向的文件布局
  const orientationLayout: OrientationLayout = isPortrait && fileLayout.portrait
    ? fileLayout.portrait
    : { refW: fileLayout.refW, refH: fileLayout.refH, assets: fileLayout.assets, hotspots: fileLayout.hotspots };

  const [assets, setAssets] = useState<LayoutAsset[]>(orientationLayout.assets);

  // 加载布局（优先 localStorage，其次文件配置）—— 方向变化或退出 Debug 时重新加载
  useEffect(() => {
    const local = loadLocalLayout(isPortrait);
    if (local && local.length > 0) {
      setAssets(local);
    } else {
      setAssets(orientationLayout.assets);
    }
  }, [isPortrait, orientationLayout.assets]);

  // 退出 Debug 模式时重新从 localStorage 加载最新布局
  const prevDebugRef = useRef(debugMode);
  useEffect(() => {
    if (prevDebugRef.current && !debugMode) {
      const local = loadLocalLayout(isPortrait);
      if (local && local.length > 0) {
        setAssets(local);
      } else {
        setAssets(orientationLayout.assets);
      }
    }
    prevDebugRef.current = debugMode;
  }, [debugMode, isPortrait, orientationLayout.assets]);

  const handleInteract = useCallback(
    (type: string) => {
      onInteract(type as HotspotType);
    },
    [onInteract]
  );

  // 按素材配置渲染
  const sortedAssets = [...assets].sort((a, b) => a.z - b.z);

  return (
    <div
      ref={sceneRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#f5f0e6", isolation: "isolate" }}
      onMouseMove={(e) => {
        if (!hoveredAsset) {
          setTooltip(null);
          return;
        }
        const rect = sceneRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text: tooltip?.text ?? "" });
        }
      }}
    >
      {/* ===== 固定画布（等比缩放 + 居中）===== */}
      {/* Debug 模式下不渲染素材，由 DebugOverlay 独占画布，避免重复 */}
      <div
        style={{
          position: "absolute",
          width: `${refW}px`,
          height: `${refH}px`,
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {!debugMode && (
        <>
        {/* ===== 渲染所有素材（按 z-index 排序，坐标基于参考分辨率）===== */}
        {sortedAssets.map((asset) => {
          const hasInteraction = asset.interaction && asset.interaction !== "null" && INTERACTION_COLORS[asset.interaction];

          // 背景类素材铺满画布（首屏 eager 加载）
          if (asset.category === "fixed") {
            // 前景书案：铺满画布 + 拦截点击事件，防止后方古人被误触
            if (asset.id === "layer-foreground-desk") {
              return (
                <div
                  key={asset.id}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${refW}px`,
                    height: `${refH}px`,
                    zIndex: asset.z,
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SceneImage
                    src={asset.src}
                    alt={asset.name}
                    eager
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: asset.opacity ?? 1,
                      pointerEvents: "none",
                    }}
                  />
                </div>
              );
            }
            // 窗外山水画背景：上移30%
            if (asset.id === "layer-window-bg") {
              return (
                <SceneImage
                  key={asset.id}
                  src={asset.src}
                  alt={asset.name}
                  eager
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${refW}px`,
                    height: `${refH}px`,
                    objectFit: "cover",
                    objectPosition: "center 30%",
                    zIndex: asset.z,
                    opacity: asset.opacity ?? 1,
                    pointerEvents: "none",
                  }}
                />
              );
            }
            return (
              <SceneImage
                key={asset.id}
                src={asset.src}
                alt={asset.name}
                eager
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${refW}px`,
                  height: `${refH}px`,
                  objectFit: "cover",
                  zIndex: asset.z,
                  opacity: asset.opacity ?? 1,
                  pointerEvents: "none",
                }}
              />
            );
          }

          // 古人访客特殊处理（叠加名牌 + 交互标记）
          if (asset.id === "elem-ancient-guest") {
            // 专属坐像：使用 per-ancient 布局配置，无配置则回退到默认 asset 坐标
            const hasCustomImg = ancient && ANCIENT_IMAGE_MAP[ancient.id];
            const ancientOverride = ancient && asset.ancientLayouts?.[ancient.id];
            const imgW = ancientOverride?.w ?? asset.w;
            const imgX = ancientOverride?.x ?? asset.x;
            const imgY = ancientOverride?.y ?? asset.y;
            return (
              <div
                key={asset.id}
                style={{
                  position: "absolute",
                  left: `${imgX}px`,
                  top: `${imgY}px`,
                  width: `${imgW}px`,
                  zIndex: asset.z,
                  pointerEvents: hasInteraction ? "auto" : "none",
                  cursor: hasInteraction ? "pointer" : "default",
                }}
                onMouseEnter={hasInteraction ? () => {
                  setHoveredAsset(asset.id);
                  setTooltip({ x: 0, y: 0, text: INTERACTION_LABELS[asset.interaction!] });
                } : undefined}
                onMouseLeave={hasInteraction ? () => {
                  setHoveredAsset(null);
                  setTooltip(null);
                } : undefined}
                onClick={hasInteraction ? () => handleInteract(asset.interaction!) : undefined}
              >
                <SceneImage
                  src={ancient && ANCIENT_IMAGE_MAP[ancient.id] ? ANCIENT_IMAGE_MAP[ancient.id] : asset.src}
                  alt={ancient?.name ?? "古人"}
                  style={{ width: "100%", height: "auto", objectFit: "contain", pointerEvents: "none" }}
                />
                {/* 交互标记：纯视觉指示，点击由容器处理 */}
                {hasInteraction && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
                    style={{ animation: "float-gentle 2s ease-in-out infinite" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        width: "22px",
                        height: "22px",
                        background: INTERACTION_COLORS[asset.interaction!],
                        border: "2px solid rgba(253, 251, 246, 0.8)",
                        boxShadow: `0 0 10px ${INTERACTION_COLORS[asset.interaction!]}66`,
                        opacity: hoveredAsset === asset.id ? 1 : 0.7,
                      }}
                    >
                      {INTERACTION_ICONS[asset.interaction!]}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 访客名牌：作为独立素材渲染，叠加古人名字
          if (asset.id === "elem-visitor-plaque") {
            return (
              <div
                key={asset.id}
                style={{
                  position: "absolute",
                  left: `${asset.x}px`,
                  top: `${asset.y}px`,
                  width: `${asset.w}px`,
                  zIndex: asset.z,
                  opacity: asset.opacity ?? 1,
                  pointerEvents: hasInteraction ? "auto" : "none",
                  cursor: hasInteraction ? "pointer" : "default",
                }}
                onMouseEnter={hasInteraction ? () => {
                  setHoveredAsset(asset.id);
                  setTooltip({ x: 0, y: 0, text: INTERACTION_LABELS[asset.interaction!] });
                } : undefined}
                onMouseLeave={hasInteraction ? () => {
                  setHoveredAsset(null);
                  setTooltip(null);
                } : undefined}
                onClick={hasInteraction ? () => handleInteract(asset.interaction!) : undefined}
              >
                <SceneImage
                  src={asset.src}
                  alt={asset.name}
                  style={{ width: "100%", height: "auto", objectFit: "contain", pointerEvents: "none" }}
                />
                {ancient && (
                  <span
                    className="title-serif absolute inset-0 flex items-center justify-center text-ink"
                    style={{ fontSize: `${asset.w * 0.12}px`, letterSpacing: "0.1em", paddingBottom: "6%" }}
                  >
                    {ancient.name}
                  </span>
                )}
                {/* 交互标记：纯视觉指示 */}
                {hasInteraction && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
                    style={{ animation: "float-gentle 2s ease-in-out infinite" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        width: "22px",
                        height: "22px",
                        background: INTERACTION_COLORS[asset.interaction!],
                        border: "2px solid rgba(253, 251, 246, 0.8)",
                        boxShadow: `0 0 10px ${INTERACTION_COLORS[asset.interaction!]}66`,
                        opacity: hoveredAsset === asset.id ? 1 : 0.7,
                      }}
                    >
                      {INTERACTION_ICONS[asset.interaction!]}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 模块竖牌：渲染空白牌 + 叠加竖排文字
          if (asset.category === "label" && asset.label) {
            return (
              <div
                key={asset.id}
                style={{
                  position: "absolute",
                  left: `${asset.x}px`,
                  top: `${asset.y}px`,
                  width: `${asset.w}px`,
                  zIndex: asset.z,
                  pointerEvents: "none",
                }}
              >
                <SceneImage
                  src={asset.src}
                  alt={asset.name}
                  style={{ width: "100%", height: "auto", objectFit: "contain" }}
                />
                <div
                  className="text-module-label absolute inset-0 flex items-center justify-center"
                  style={{ fontSize: `${asset.w * 0.28}px`, lineHeight: 1.3 }}
                >
                  {asset.label}
                </div>
              </div>
            );
          }

          // 万年历牌：渲染空白牌 + 叠加日期文字
          if (asset.id === "elem-almanac-plaque" && today) {
            return (
              <div
                key={asset.id}
                style={{
                  position: "absolute",
                  left: `${asset.x}px`,
                  top: `${asset.y}px`,
                  width: `${asset.w}px`,
                  zIndex: asset.z,
                  pointerEvents: hasInteraction ? "auto" : "none",
                  cursor: hasInteraction ? "pointer" : "default",
                }}
                onMouseEnter={hasInteraction ? () => {
                  setHoveredAsset(asset.id);
                  setTooltip({ x: 0, y: 0, text: INTERACTION_LABELS[asset.interaction!] });
                } : undefined}
                onMouseLeave={hasInteraction ? () => {
                  setHoveredAsset(null);
                  setTooltip(null);
                } : undefined}
                onClick={hasInteraction ? () => handleInteract(asset.interaction!) : undefined}
              >
                <SceneImage
                  src={asset.src}
                  alt={asset.name}
                  style={{ width: "100%", height: "auto", objectFit: "contain", pointerEvents: "none" }}
                />
                {/* 日期文字叠加：从上到下 1.今日日期 2.星期几 3.农历 4.五行日 */}
                <div
                  className="text-almanac absolute flex flex-col items-center justify-center text-center"
                  style={{
                    top: "calc(10% + 18px)",
                    left: "14%",
                    right: "14%",
                    bottom: "35%",
                    overflow: "hidden",
                  }}
                >
                  <p style={{ fontSize: `${asset.w * 0.07}px`, fontWeight: 700, lineHeight: 1.1 }}>{today.date}</p>
                  <p style={{ fontSize: `${asset.w * 0.07}px`, opacity: 0.85, marginTop: "8px" }}>{today.lunarDateShort}</p>
                  <p style={{ fontSize: `${asset.w * 0.065}px`, opacity: 0.8, marginTop: "6px" }}>{today.weekday}</p>
                  {today.wuxing && (
                    <p style={{ fontSize: `${asset.w * 0.06}px`, opacity: 0.7, marginTop: "8px" }}>{today.wuxing}日</p>
                  )}
                </div>
                {/* 交互标记 */}
                {hasInteraction && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
                    style={{ animation: "float-gentle 2s ease-in-out infinite" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        width: "22px",
                        height: "22px",
                        background: INTERACTION_COLORS[asset.interaction!],
                        border: "2px solid rgba(253, 251, 246, 0.8)",
                        boxShadow: `0 0 10px ${INTERACTION_COLORS[asset.interaction!]}66`,
                        opacity: hoveredAsset === asset.id ? 1 : 0.7,
                      }}
                    >
                      {INTERACTION_ICONS[asset.interaction!]}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 普通素材 + 交互标记（如有 interaction 则整个素材区域可点击）
          return (
            <div
              key={asset.id}
              style={{
                position: "absolute",
                left: `${asset.x}px`,
                top: `${asset.y}px`,
                width: `${asset.w}px`,
                zIndex: asset.z,
                opacity: asset.opacity ?? 1,
                pointerEvents: hasInteraction ? "auto" : "none",
                cursor: hasInteraction ? "pointer" : "default",
              }}
              onMouseEnter={hasInteraction ? () => {
                setHoveredAsset(asset.id);
                setTooltip({ x: 0, y: 0, text: INTERACTION_LABELS[asset.interaction!] });
              } : undefined}
              onMouseLeave={hasInteraction ? () => {
                setHoveredAsset(null);
                setTooltip(null);
              } : undefined}
              onClick={hasInteraction ? () => handleInteract(asset.interaction!) : undefined}
            >
              <SceneImage
                src={asset.src}
                alt={asset.name}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
              {/* 交互标记：纯视觉指示，点击由容器处理 */}
              {hasInteraction && (
                <div
                  className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
                  style={{ animation: "float-gentle 2s ease-in-out infinite" }}
                >
                  <div
                    className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{
                      width: "22px",
                      height: "22px",
                      background: INTERACTION_COLORS[asset.interaction!],
                      border: "2px solid rgba(253, 251, 246, 0.8)",
                      boxShadow: `0 0 10px ${INTERACTION_COLORS[asset.interaction!]}66`,
                      opacity: hoveredAsset === asset.id ? 1 : 0.7,
                    }}
                  >
                    {INTERACTION_ICONS[asset.interaction!]}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ===== 天气粒子（在 z=2 层）===== */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          <WeatherParticles type={weather} />
        </div>

        {/* ===== 底部渐变遮罩 ===== */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: "8%",
            background: "linear-gradient(to top, rgba(28, 25, 23, 0.06), transparent)",
            zIndex: 7,
          }}
        />
        </>
        )}
      </div>

      {/* ===== 悬浮提示文字（不缩放，跟随鼠标）===== */}
      {tooltip && hoveredAsset && (
        <div
          className="pointer-events-none fixed z-[60] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-paper"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 30,
            background: "rgba(28, 25, 23, 0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
