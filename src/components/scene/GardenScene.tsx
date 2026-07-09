"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  getPlatforms,
  getConnections,
  findPath,
  getPathWaypoints2D,
  getCurrentSeason,
  SEASON_ASSETS,
  NPC_IMAGES,
  type PlatformId,
  type PlatformNode,
} from "./NavigationGraph";
import WeatherLayer2D from "./WeatherLayer2D";
import {
  getEffectiveLayout,
  hasLocalOverride,
  type LayoutAsset,
} from "@/lib/scene-layout";

// ===== 外部 Props =====
interface GardenSceneProps {
  ancient: { id: string; name: string; dynasty: string; title: string; bio: string } | null;
  onReachAncient: () => void;
  onReachPoetry: () => void;
  onReachJieqi: () => void;
  debugMode?: boolean;
}

// ===== 单个场景元素（平台模式）=====
function SceneElementView({
  src,
  dx,
  dy,
  w,
  z = 1,
}: {
  src: string;
  dx: number;
  dy: number;
  w: number;
  z?: number;
  platformCenterY: number;
}) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        left: `${dx}px`,
        top: `${dy}px`,
        width: `${w}px`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: z,
        objectFit: "contain",
      }}
    />
  );
}

// ===== 平台渲染（平台模式）=====
function PlatformView({
  platform,
  isCurrent,
  isHovered,
  onClick,
}: {
  platform: PlatformNode;
  isCurrent: boolean;
  isHovered: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${platform.pos.x}%`,
        top: `${platform.pos.y}%`,
        transform: `translate(-50%, -50%) scale(${isHovered ? 1.04 : 1})`,
        transition: "transform 0.3s ease",
        zIndex: isCurrent ? 20 : 15,
      }}
      onClick={onClick}
    >
      <div className="relative" style={{ width: `${platform.width}px` }}>
        <img
          src={platform.ground}
          alt={platform.name}
          draggable={false}
          style={{
            width: `${platform.width}px`,
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
            display: "block",
          }}
        />

        {platform.elements.map((el, i) => (
          <SceneElementView
            key={i}
            src={el.src}
            dx={el.dx}
            dy={el.dy}
            w={el.w}
            z={el.z}
            platformCenterY={0}
          />
        ))}

        {isCurrent && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: "translate(-50%, -50%)",
              width: `${platform.width * 0.6}px`,
              height: `${platform.width * 0.4}px`,
              borderRadius: "50%",
              border: "2px solid rgba(184, 134, 11, 0.35)",
              boxShadow: "0 0 16px rgba(184, 134, 11, 0.12)",
              animation: "pulse-ring 2s ease-out infinite",
              zIndex: 0,
            }}
          />
        )}

        {platform.interaction && !isCurrent && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: "50%",
              top: "-30px",
              transform: "translateX(-50%)",
              animation: "float-gentle 2s ease-in-out infinite",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#c44536",
                boxShadow: "0 0 8px rgba(196, 69, 54, 0.5)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 主组件 =====
export default function GardenScene({
  ancient,
  onReachAncient,
  onReachPoetry,
  onReachJieqi,
  debugMode = false,
}: GardenSceneProps) {
  const season = getCurrentSeason();
  const seasonAssets = SEASON_ASSETS[season];
  const platforms = useMemo(() => getPlatforms(season), [season]);
  const connections = useMemo(() => getConnections(), []);

  // Debug 布局状态（来自文件配置或 localStorage 覆盖）
  const [debugLayout, setDebugLayout] = useState<LayoutAsset[]>([]);
  const [layoutSource, setLayoutSource] = useState<"local" | "file" | "none">("none");
  const useDebugLayout = debugLayout.length > 0 && !debugMode;

  // 角色状态
  const [currentPlatform, setCurrentPlatform] = useState<PlatformId>("courtyard");
  const [hoveredPlatform, setHoveredPlatform] = useState<PlatformId | null>(null);
  const [charPos, setCharPos] = useState<{ x: number; y: number }>(platforms.courtyard.pos);
  const [isWalking, setIsWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [transitionMs, setTransitionMs] = useState(0);

  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const charPosRef = useRef(charPos);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    charPosRef.current = charPos;
  }, [charPos]);

  useEffect(() => {
    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    };
  }, []);

  // ===== 加载场景布局（非 Debug 模式时）=====
  // 优先级: localStorage 覆盖 > 文件配置 > 平台默认模式
  useEffect(() => {
    if (debugMode) return;
    const container = sceneRef.current ?? document.querySelector("[data-scene-container]");
    const w = container?.clientWidth ?? window.innerWidth;
    const h = container?.clientHeight ?? window.innerHeight;
    const { assets, source } = getEffectiveLayout(w, h);
    if (assets.length > 0) {
      setDebugLayout(assets);
      setLayoutSource(source);
      // 从布局中读取角色初始位置
      const charAsset = assets.find((a) => a.category === "char");
      const pos = charAsset
        ? { x: charAsset.x + charAsset.w / 2, y: charAsset.y + charAsset.w / 2 }
        : { x: w / 2, y: h * 0.75 };
      setCharPos(pos);
      charPosRef.current = pos;
    } else {
      // 无布局配置，回退到平台模式
      setDebugLayout([]);
      setLayoutSource("none");
      setCharPos(platforms.courtyard.pos);
      charPosRef.current = platforms.courtyard.pos;
    }
  }, [debugMode, platforms.courtyard.pos]);

  // ===== 平台模式：交互检查 =====
  const checkInteraction = useCallback(
    (platformId: PlatformId) => {
      const platform = platforms[platformId];
      if (!platform.interaction) return;
      const key = platformId;
      if (triggeredRef.current.has(key)) return;
      triggeredRef.current.add(key);
      setTimeout(() => triggeredRef.current.delete(key), 5000);
      if (platform.interaction === "ancient") onReachAncient();
      else if (platform.interaction === "poetry") onReachPoetry();
      else if (platform.interaction === "jieqi") onReachJieqi();
    },
    [platforms, onReachAncient, onReachPoetry, onReachJieqi]
  );

  // ===== 平台模式：多段路径行走 =====
  const walkPath = useCallback(
    (waypoints: { x: number; y: number }[], index: number, finalTarget: PlatformId) => {
      if (index >= waypoints.length) {
        setIsWalking(false);
        setCurrentPlatform(finalTarget);
        setTransitionMs(0);
        checkInteraction(finalTarget);
        return;
      }
      const target = waypoints[index];
      const prevPos = index === 0 ? charPosRef.current : waypoints[index - 1];
      const dist = Math.hypot(target.x - prevPos.x, target.y - prevPos.y);
      const duration = Math.max(800, dist * 35);
      setFacingLeft(target.x < prevPos.x);
      setTransitionMs(duration);
      setCharPos(target);
      walkTimerRef.current = setTimeout(() => {
        walkPath(waypoints, index + 1, finalTarget);
      }, duration + 50);
    },
    [checkInteraction]
  );

  const handlePlatformClick = useCallback(
    (targetId: PlatformId) => {
      if (isWalking || targetId === currentPlatform) return;
      const platformPath = findPath(currentPlatform, targetId);
      const waypoints = getPathWaypoints2D(platformPath, platforms);
      if (waypoints.length <= 1) return;
      setIsWalking(true);
      walkPath(waypoints, 0, targetId);
    },
    [isWalking, currentPlatform, walkPath, platforms]
  );

  // ===== Debug 布局模式：自由行走（像素坐标）=====
  const walkToPixel = useCallback(
    (targetX: number, targetY: number, onArrive?: () => void) => {
      const prev = charPosRef.current;
      const dist = Math.hypot(targetX - prev.x, targetY - prev.y);
      if (dist < 5) {
        onArrive?.();
        return;
      }
      const duration = Math.max(600, Math.min(4000, dist * 2));
      setFacingLeft(targetX < prev.x);
      setTransitionMs(duration);
      setIsWalking(true);
      setCharPos({ x: targetX, y: targetY });
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      walkTimerRef.current = setTimeout(() => {
        setIsWalking(false);
        setTransitionMs(0);
        onArrive?.();
      }, duration + 50);
    },
    []
  );

  // ===== Debug 布局模式：点击交互素材 =====
  const handleDebugInteraction = useCallback(
    (asset: LayoutAsset) => {
      if (isWalking) return;
      // 走到素材正下方（站在素材前面）
      const targetX = asset.x + asset.w / 2;
      const targetY = asset.y + asset.w * 0.5;
      walkToPixel(targetX, targetY, () => {
        if (asset.interaction === "ancient") onReachAncient();
        else if (asset.interaction === "poetry") onReachPoetry();
        else if (asset.interaction === "jieqi") onReachJieqi();
      });
    },
    [isWalking, walkToPixel, onReachAncient, onReachPoetry, onReachJieqi]
  );

  // ===== Debug 布局模式：点击空白区域自由行走 =====
  const handleFreeWalk = useCallback(
    (e: React.MouseEvent) => {
      if (isWalking) return;
      // 只响应直接点击容器的事件（不是冒泡上来的）
      if (e.target !== e.currentTarget) return;
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      walkToPixel(x, y);
    },
    [isWalking, walkToPixel]
  );

  // NPC 图片（平台模式用）
  const npcImage = ancient ? NPC_IMAGES[ancient.id] ?? "/assets/npc/npc-libai.png" : null;
  const pavilionPos = platforms.pavilion.pos;

  // ===== Debug 模式：空背景（DebugLayer 接管）=====
  if (debugMode) {
    return (
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ background: "var(--color-paper)" }}
      />
    );
  }

  // ===== Debug 布局模式：渲染保存的布局 + 自由行走 + 事件触发 =====
  if (useDebugLayout) {
    const sortedAssets = [...debugLayout].sort((a, b) => a.z - b.z);
    // 过滤掉 char 类别（用动画角色代替）
    const renderAssets = sortedAssets.filter((a) => a.category !== "char");
    const interactionAssets = debugLayout.filter((a) => a.interaction);

    return (
      <div
        ref={sceneRef}
        className="relative h-full w-full overflow-hidden"
        style={{ background: "var(--color-paper)", isolation: "isolate" }}
        onClick={handleFreeWalk}
      >
        {/* ===== 渲染保存的素材 ===== */}
        {renderAssets.map((asset) => (
          <img
            key={asset.id}
            src={asset.src}
            alt={asset.name}
            draggable={false}
            style={{
              position: "absolute",
              left: `${asset.x}px`,
              top: `${asset.y}px`,
              width: `${asset.w}px`,
              zIndex: asset.z,
              transform: `rotate(${asset.rotation || 0}deg)`,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}

        {/* ===== 交互点标记 ===== */}
        {interactionAssets.map((asset) => {
          const color =
            asset.interaction === "ancient" ? "#c44536"
            : asset.interaction === "poetry" ? "#b8860b"
            : "#6b8e6b";
          const label =
            asset.interaction === "ancient" ? "古"
            : asset.interaction === "poetry" ? "诗" : "节";
          return (
            <div
              key={`interaction-${asset.id}`}
              className="absolute cursor-pointer"
              style={{
                left: `${asset.x + asset.w / 2}px`,
                top: `${asset.y - 15}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 100,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleDebugInteraction(asset);
              }}
            >
              <div
                className="flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{
                  width: "24px",
                  height: "24px",
                  background: color,
                  border: "2px solid white",
                  boxShadow: `0 0 10px ${color}80`,
                  animation: "float-gentle 2s ease-in-out infinite",
                }}
              >
                {label}
              </div>
            </div>
          );
        })}

        {/* ===== 角色 ===== */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${charPos.x}px`,
            top: `${charPos.y}px`,
            transform: `translate(-50%, -55%) scaleX(${facingLeft ? -1 : 1})`,
            transition: `left ${transitionMs}ms ease-in-out, top ${transitionMs}ms ease-in-out`,
            zIndex: 90,
          }}
        >
          <div
            style={{
              animation: isWalking
                ? "char-bob 0.4s ease-in-out infinite"
                : "char-idle 2s ease-in-out infinite",
            }}
          >
            <img
              src={isWalking ? "/assets/char/char-walk-v2.png" : "/assets/char/char-stand-v2.png"}
              alt="角色"
              draggable={false}
              style={{
                width: "38px",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "-3px",
                transform: "translateX(-50%)",
                width: "26px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.1)",
                filter: "blur(3px)",
              }}
            />
          </div>
        </div>

        {/* ===== 天气粒子 ===== */}
        <WeatherLayer2D type={seasonAssets.weather} intensity={0.35} />

        {/* ===== 底部渐变 ===== */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: "12%",
            background: "linear-gradient(to top, rgba(28, 25, 23, 0.08), transparent)",
            zIndex: 95,
          }}
        />

        {/* ===== 布局来源指示器 ===== */}
        <div
          className="pointer-events-none fixed bottom-2 left-1/2 z-[96] -translate-x-1/2 rounded-full px-3 py-1 text-[10px]"
          style={{
            background: layoutSource === "local" ? "rgba(196, 69, 54, 0.7)" : "rgba(107, 142, 107, 0.6)",
            color: "white",
            backdropFilter: "blur(4px)",
          }}
        >
          {layoutSource === "local" ? "布局来源: 浏览器临时覆盖" : "布局来源: 配置文件 scene-layout.json"}
        </div>
      </div>
    );
  }

  // ===== 默认模式：平台系统 =====
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--color-paper)", isolation: "isolate" }}
    >
      {/* ===== Layer 1: 天空 ===== */}
      <div
        className="absolute left-0 right-0 top-0 overflow-hidden"
        style={{ height: "38%", zIndex: 0 }}
      >
        <img
          src={seasonAssets.sky}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* ===== Layer 2: 远山 ===== */}
      <img
        src={seasonAssets.mountain}
        alt=""
        className="absolute left-0 right-0 w-full object-cover"
        style={{
          top: "8%",
          height: "32%",
          zIndex: 1,
          opacity: 0.75,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
        draggable={false}
      />

      {/* ===== Layer 3: 天地交界渐变 ===== */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: "30%",
          height: "15%",
          background: "linear-gradient(to bottom, var(--color-sky) 0%, transparent 100%)",
          opacity: 0.3,
          zIndex: 2,
        }}
      />

      {/* ===== Layer 4: 连接（楼梯/桥）===== */}
      {connections.map((conn, i) => (
        <div
          key={`conn-${i}`}
          className="absolute"
          style={{
            left: `${conn.pos.x}%`,
            top: `${conn.pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${conn.rotation ?? 0}deg)`,
            zIndex: 8,
          }}
        >
          <img
            src={conn.image}
            alt=""
            draggable={false}
            style={{
              width: `${conn.width}px`,
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        </div>
      ))}

      {/* ===== Layer 5: 平台 + 元素 ===== */}
      {(Object.keys(platforms) as PlatformId[]).map((id) => (
        <div
          key={id}
          onMouseEnter={() => setHoveredPlatform(id)}
          onMouseLeave={() => setHoveredPlatform(null)}
        >
          <PlatformView
            platform={platforms[id]}
            isCurrent={currentPlatform === id && !isWalking}
            isHovered={hoveredPlatform === id}
            onClick={() => handlePlatformClick(id)}
          />
        </div>
      ))}

      {/* ===== Layer 6: NPC ===== */}
      {ancient && npcImage && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${pavilionPos.x + 3}%`,
            top: `${pavilionPos.y - 6}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 25,
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src={npcImage}
              alt=""
              draggable={false}
              style={{
                width: "48px",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* ===== Layer 7: 角色 ===== */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${charPos.x}%`,
          top: `${charPos.y}%`,
          transform: `translate(-50%, -55%) scaleX(${facingLeft ? -1 : 1})`,
          transition: `left ${transitionMs}ms ease-in-out, top ${transitionMs}ms ease-in-out`,
          zIndex: 30,
        }}
      >
        <div
          style={{
            animation: isWalking
              ? "char-bob 0.4s ease-in-out infinite"
              : "char-idle 2s ease-in-out infinite",
          }}
        >
          <img
            src={isWalking ? "/assets/char/char-walk-v2.png" : "/assets/char/char-stand-v2.png"}
            alt="角色"
            draggable={false}
            style={{
              width: "38px",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-3px",
              transform: "translateX(-50%)",
              width: "26px",
              height: "5px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.1)",
              filter: "blur(3px)",
            }}
          />
        </div>
      </div>

      {/* ===== Layer 8: 天气粒子 ===== */}
      <WeatherLayer2D type={seasonAssets.weather} intensity={0.35} />

      {/* ===== 底部渐变 ===== */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: "12%",
          background: "linear-gradient(to top, rgba(28, 25, 23, 0.08), transparent)",
          zIndex: 35,
        }}
      />
    </div>
  );
}
