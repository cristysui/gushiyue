"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import studyLayoutData from "@/data/study-layout.json";
import { useSceneScale } from "./useSceneScale";

// ===== 类型 =====
export type InteractionType = "ancient" | "poetry" | "jieqi" | "calendar" | "flowers" | "shichen" | "garden" | null;

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
  interaction?: InteractionType;
  locked?: boolean;
  ancientLayouts?: Record<string, AncientLayoutOverride>;
}

interface OrientationLayout {
  refW: number;
  refH: number;
  assets: LayoutAsset[];
  hotspots: Hotspot[];
}

interface StudyLayout extends OrientationLayout {
  portrait?: OrientationLayout;
}

interface Hotspot {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

// ===== localStorage 缓存 =====
function getStorageKey(isPortrait: boolean): string {
  return isPortrait ? "gushiyue-study-layout-portrait" : "gushiyue-study-layout";
}

function loadLocalLayout(isPortrait: boolean): LayoutAsset[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(isPortrait));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

function saveLocalLayout(assets: LayoutAsset[], isPortrait: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(isPortrait), JSON.stringify(assets));
}

// ===== 单个可拖拽素材（在固定 1920x1080 坐标系内渲染）=====
function DraggableAsset({
  asset,
  scale,
  refW,
  refH,
  isSelected,
  onSelect,
  onChange,
}: {
  asset: LayoutAsset;
  scale: number;
  refW: number;
  refH: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<LayoutAsset>) => void;
}) {
  const dragState = useRef<{
    mode: "move" | "resize" | "resize-left" | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
  }>({ mode: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "move" | "resize") => {
      if (asset.locked) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect();
      dragState.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origX: asset.x,
        origY: asset.y,
        origW: asset.w,
      };
    },
    [asset.x, asset.y, asset.w, asset.locked, onSelect]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds.mode) return;
      // 鼠标移动距离除以缩放比例 = 画布坐标系的移动距离
      const dx = (e.clientX - ds.startX) / scale;
      const dy = (e.clientY - ds.startY) / scale;
      if (ds.mode === "move") {
        onChange({ x: Math.round(ds.origX + dx), y: Math.round(ds.origY + dy) });
      } else if (ds.mode === "resize") {
        const newW = Math.max(20, Math.round(ds.origW + dx));
        onChange({ w: newW });
      } else if (ds.mode === "resize-left") {
        const newW = Math.max(20, Math.round(ds.origW - dx));
        const newX = Math.round(ds.origX + (ds.origW - newW));
        onChange({ x: newX, w: newW });
      }
    };
    const handleMouseUp = () => {
      dragState.current.mode = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [scale, onChange]);

  const interactionColor =
    asset.interaction === "ancient" ? "#c44536"
    : asset.interaction === "poetry" ? "#b8860b"
    : asset.interaction === "jieqi" ? "#6b8e6b"
    : asset.interaction === "calendar" ? "#8b7355"
    : asset.interaction === "flowers" ? "#d4829b"
    : asset.interaction === "shichen" ? "#5f7a8b"
    : asset.interaction === "garden" ? "#7a8c5a"
    : null;

  // 在固定 1920x1080 坐标系内渲染（不缩放，由外层容器统一缩放）
  // fixed 类素材与 StudyScene 一致：objectFit cover 铺满画布
  const isFixed = asset.category === "fixed";

  return (
    <div
      style={{
        position: "absolute",
        left: isFixed ? 0 : `${asset.x}px`,
        top: isFixed ? 0 : `${asset.y}px`,
        width: isFixed ? `${refW}px` : `${asset.w}px`,
        height: isFixed ? `${refH}px` : undefined,
        zIndex: asset.z,
        cursor: asset.locked ? "default" : "move",
        opacity: asset.opacity ?? 1,
      }}
      onMouseDown={(e) => !asset.locked && handleMouseDown(e, "move")}
    >
      <img
        src={asset.src}
        alt={asset.name}
        draggable={false}
        style={{
          width: "100%",
          height: isFixed ? "100%" : "auto",
          objectFit: isFixed ? "cover" : "contain",
          pointerEvents: "none",
          userSelect: "none",
          display: "block",
        }}
      />

      {/* 事件绑定标记 */}
      {interactionColor && !isSelected && (
        <div
          className="pointer-events-none absolute -right-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
          style={{ background: interactionColor, border: "2px solid white" }}
        >
          {asset.interaction === "ancient" ? "客"
          : asset.interaction === "poetry" ? "诗"
          : asset.interaction === "jieqi" ? "节"
          : asset.interaction === "calendar" ? "历"
          : asset.interaction === "flowers" ? "花"
          : asset.interaction === "shichen" ? "时"
          : "食"}
        </div>
      )}

      {/* 锁定标记 */}
      {asset.locked && !isSelected && (
        <div className="pointer-events-none absolute -left-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-[8px] text-white" style={{ border: "2px solid white" }}>
          🔒
        </div>
      )}

      {/* 选中状态 */}
      {isSelected && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              border: `2px dashed ${interactionColor ?? "#c44536"}`,
              boxShadow: `0 0 0 1px ${interactionColor ?? "rgba(196,69,54,0.2)"}`,
            }}
          />
          {!asset.locked && (
            <>
              {/* 右下角缩放手柄 */}
              <div
                className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-full"
                style={{ background: interactionColor ?? "#c44536", border: "2px solid white" }}
                onMouseDown={(e) => handleMouseDown(e, "resize")}
              />
              {/* 左下角缩放手柄 */}
              <div
                className="absolute -bottom-1.5 -left-1.5 h-4 w-4 cursor-sw-resize rounded-full"
                style={{ background: interactionColor ?? "#c44536", border: "2px solid white" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect();
                  dragState.current = {
                    mode: "resize-left",
                    startX: e.clientX,
                    startY: e.clientY,
                    origX: asset.x,
                    origY: asset.y,
                    origW: asset.w,
                  };
                }}
              />
            </>
          )}
          {/* 信息标签 */}
          <div
            className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: interactionColor ?? "rgba(196,69,54,0.9)", color: "white" }}
          >
            {asset.name} · w:{asset.w} · z:{asset.z}
            {asset.locked && " · 锁定"}
            {asset.interaction && ` · ${asset.interaction}`}
          </div>
        </>
      )}
    </div>
  );
}

// ===== 素材库分类标签 =====
const CATEGORY_LABELS: Record<string, string> = {
  sky: "天空",
  building: "建筑",
  tree: "树木",
  flower: "花卉",
  crop: "农作物",
  ground: "地面",
  scene: "场景",
  char: "角色",
  npc: "NPC",
  "佳肴": "佳肴",
  "季节限定": "季节限定",
  "four-seasons-study-components": "书斋组件",
};

// ===== 古人专属坐像映射（与 StudyScene 保持一致）=====
const ANCIENT_IMAGE_MAP: Record<string, string> = {
  liqingzhao: "/assets/four-seasons-study-components/li_qingzhao_seated.webp",
  baijuyi: "/assets/four-seasons-study-components/bai_juyi_seated.webp",
  taoyuanming: "/assets/four-seasons-study-components/tao_yuanming_seated.webp",
  wangyangming: "/assets/four-seasons-study-components/wang_yangming_seated.webp",
};

const ANCIENT_NAMES: Record<string, string> = {
  liqingzhao: "李清照",
  baijuyi: "白居易",
  taoyuanming: "陶渊明",
  wangyangming: "王阳明",
};

// ===== 主组件 =====
interface DebugOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onExit: () => void;
}

export default function DebugOverlay({ containerRef, onExit }: DebugOverlayProps) {
  const fileLayout = studyLayoutData as StudyLayout;
  const [assets, setAssets] = useState<LayoutAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("building");
  const [searchQuery, setSearchQuery] = useState("");
  const [manifest, setManifest] = useState<Record<string, string[]>>({});
  // Debug 模式下当前编辑的古人 ID（用于切换人物图片预览和编辑 per-ancient 布局）
  const [debugAncientId, setDebugAncientId] = useState<string>("liqingzhao");

  // 等比缩放（与 StudyScene 共用同一个 hook，自动检测横竖屏）
  const { scale, offsetX, offsetY, refW, refH, isPortrait } = useSceneScale(containerRef);

  // 当前方向的文件布局
  const orientationLayout: OrientationLayout = isPortrait && fileLayout.portrait
    ? fileLayout.portrait
    : { refW: fileLayout.refW, refH: fileLayout.refH, assets: fileLayout.assets, hotspots: fileLayout.hotspots };

  // ===== 初始化 / 方向切换时重新加载 =====
  useEffect(() => {
    const local = loadLocalLayout(isPortrait);
    if (local && local.length > 0) {
      setAssets(local);
    } else {
      setAssets(orientationLayout.assets);
    }
    setSelectedId(null);
  }, [isPortrait, orientationLayout.assets]);

  // ===== 切换古人时同步画布上的 ancient-guest 顶层坐标 =====
  useEffect(() => {
    setAssets((prev) => prev.map((a) => {
      if (a.id !== "elem-ancient-guest") return a;
      if (debugAncientId === "default") {
        // 恢复默认图片，不使用 override
        return a;
      }
      const override = a.ancientLayouts?.[debugAncientId];
      if (override) {
        return { ...a, x: override.x, y: override.y, w: override.w };
      }
      return a;
    }));
  }, [debugAncientId]);

  // ===== 加载素材库 manifest =====
  useEffect(() => {
    fetch("/assets/manifest.json")
      .then((res) => res.json())
      .then((data: Record<string, string[]>) => setManifest(data))
      .catch((err) => console.error("加载素材库失败:", err));
  }, []);

  // ===== 自动保存到 localStorage =====
  useEffect(() => {
    if (assets.length === 0) return;
    const timer = setTimeout(() => {
      saveLocalLayout(assets, isPortrait);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 400);
    return () => clearTimeout(timer);
  }, [assets, isPortrait]);

  // ===== 操作函数 =====
  const updateAsset = useCallback((id: string, changes: Partial<LayoutAsset>) => {
    setAssets((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      // 如果是古人访客且有专属图片，x/y/w 变更写入 ancientLayouts
      if (a.id === "elem-ancient-guest" && ANCIENT_IMAGE_MAP[debugAncientId]) {
        const layout = a.ancientLayouts?.[debugAncientId] ?? { x: a.x, y: a.y, w: a.w };
        const updatedLayout = {
          x: changes.x !== undefined ? changes.x : layout.x,
          y: changes.y !== undefined ? changes.y : layout.y,
          w: changes.w !== undefined ? changes.w : layout.w,
        };
        return {
          ...a,
          ancientLayouts: {
            ...a.ancientLayouts,
            [debugAncientId]: updatedLayout,
          },
          // 同步更新顶层 x/y/w 以便画布渲染
          x: updatedLayout.x,
          y: updatedLayout.y,
          w: updatedLayout.w,
        };
      }
      return { ...a, ...changes };
    }));
  }, [debugAncientId]);

  const handleSetInteraction = useCallback((type: InteractionType) => {
    if (!selectedId) return;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === selectedId) {
          return { ...a, interaction: a.interaction === type ? null : type };
        }
        if (a.interaction === type) {
          return { ...a, interaction: null };
        }
        return a;
      })
    );
  }, [selectedId]);

  const handleToggleLock = useCallback(() => {
    if (!selectedId) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === selectedId ? { ...a, locked: !a.locked } : a))
    );
  }, [selectedId]);

  const handleZOrder = useCallback((direction: "front" | "forward" | "backward" | "back") => {
    if (!selectedId) return;
    setAssets((prev) => {
      const sorted = [...prev].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((a) => a.id === selectedId);
      if (idx === -1) return prev;
      const asset = sorted[idx];
      let newZ = asset.z;
      if (direction === "front") newZ = Math.max(...prev.map((a) => a.z)) + 1;
      else if (direction === "back") newZ = Math.min(...prev.map((a) => a.z)) - 1;
      else if (direction === "forward" && idx < sorted.length - 1) newZ = sorted[idx + 1].z + 0.5;
      else if (direction === "backward" && idx > 0) newZ = sorted[idx - 1].z - 0.5;
      return prev.map((a) => (a.id === selectedId ? { ...a, z: Math.round(newZ) } : a));
    });
  }, [selectedId]);

  // ===== 保存到文件（下载 JSON）=====
  const handleSaveToFile = useCallback(() => {
    const output: OrientationLayout = {
      refW: orientationLayout.refW,
      refH: orientationLayout.refH,
      assets: assets.map((a) => ({
        ...a,
        x: Math.round(a.x),
        y: Math.round(a.y),
        w: Math.round(a.w),
        z: Math.round(a.z),
        // 四舍五入 per-ancient 布局
        ancientLayouts: a.ancientLayouts
          ? Object.fromEntries(
              Object.entries(a.ancientLayouts).map(([k, v]) => [
                k,
                { x: Math.round(v.x), y: Math.round(v.y), w: Math.round(v.w) },
              ])
            )
          : undefined,
      })),
      hotspots: orientationLayout.hotspots,
    };
    const json = JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      console.log("布局 JSON 已复制到剪贴板");
    }).catch(() => {});
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isPortrait ? "study-layout-portrait-export.json" : "study-layout-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [assets, orientationLayout, isPortrait]);

  // ===== 重置为文件配置 =====
  const handleReset = useCallback(() => {
    if (!confirm(`确定重置为配置文件中的${isPortrait ? "竖屏" : "横屏"}布局？浏览器中的修改将丢失。`)) return;
    localStorage.removeItem(getStorageKey(isPortrait));
    setAssets(orientationLayout.assets);
    setSelectedId(null);
  }, [isPortrait, orientationLayout.assets]);

  // ===== 素材库：添加素材到场景 =====
  const handleAddAsset = useCallback(
    (category: string, filename: string, x?: number, y?: number) => {
      const newId = `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const maxZ = assets.length > 0 ? Math.max(...assets.map((a) => a.z)) : 0;
      const newAsset: LayoutAsset = {
        id: newId,
        src: `/assets/${category}/${filename}`,
        name: filename.replace(/\.[^.]+$/, ""),
        x: x ?? Math.round(refW / 2 - 100),
        y: y ?? Math.round(refH / 2 - 100),
        w: 200,
        z: maxZ + 1,
        category,
      };
      setAssets((prev) => [...prev, newAsset]);
      setSelectedId(newId);
    },
    [assets, refW, refH]
  );

  // ===== 删除选中素材 =====
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setAssets((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ===== 画布拖放：从素材库拖入 =====
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/json")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      try {
        const { category, filename } = JSON.parse(data);
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        // 屏幕坐标 → 画布坐标（逆缩放 + 逆偏移）
        const canvasX = (e.clientX - rect.left - offsetX) / scale;
        const canvasY = (e.clientY - rect.top - offsetY) / scale;
        handleAddAsset(category, filename, Math.round(canvasX - 100), Math.round(canvasY - 100));
      } catch {
        // ignore
      }
    },
    [containerRef, offsetX, offsetY, scale, handleAddAsset]
  );

  const selectedAsset = assets.find((a) => a.id === selectedId) || null;
  const sortedAssets = [...assets].sort((a, b) => a.z - b.z);

  return (
    <>
      {/* ===== 顶部工具栏 ===== */}
      <div
        className="fixed left-1/2 top-12 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2"
        style={{ background: "rgba(196, 69, 54, 0.9)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
      >
        <span className="text-xs font-bold text-white">DEBUG</span>
        <span className="text-white/40">|</span>
        <span className="text-xs text-white/70">{assets.length} 素材</span>
        <span className="text-white/40">|</span>
        <span className="text-[10px] text-white/50">{Math.round(scale * 100)}%</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">{isPortrait ? "竖屏" : "横屏"}</span>
        <button onClick={() => setShowLayers((v) => !v)} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">图层</button>
        <button onClick={() => setShowLibrary((v) => !v)} className={`rounded-full px-3 py-1 text-xs text-white transition ${showLibrary ? "bg-white/50" : "bg-white/20 hover:bg-white/30"}`}>素材库</button>
        <button onClick={handleSaveToFile} className="rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-white hover:bg-white/50 transition">保存到文件</button>
        <button onClick={handleReset} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">重置</button>
        <span className="text-white/40">|</span>
        <button onClick={onExit} className="rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-white hover:bg-white/50 transition">退出 Debug</button>
        {saved && <span className="text-[10px] text-green-300">✓ 已保存</span>}
      </div>

      {/* ===== 选中素材控制面板 ===== */}
      {selectedAsset && (
        <div
          className="fixed left-1/2 top-28 z-[200] flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl px-3 py-1.5"
          style={{ background: "rgba(28, 25, 23, 0.88)", backdropFilter: "blur(8px)", maxWidth: "90vw" }}
        >
          <span className="max-w-[120px] truncate text-xs text-paper/80">{selectedAsset.name}</span>
          <span className="text-paper/20">|</span>
          {/* 古人图片切换（仅古人访客选中时显示） */}
          {selectedAsset.id === "elem-ancient-guest" && (
            <>
              <span className="text-[10px] text-paper/50">人物:</span>
              <select
                value={debugAncientId}
                onChange={(e) => setDebugAncientId(e.target.value)}
                className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-paper outline-none"
                style={{ border: "1px solid rgba(196,166,122,0.3)" }}
              >
                {Object.entries(ANCIENT_NAMES).map(([id, name]) => (
                  <option key={id} value={id} className="bg-stone-800 text-paper">
                    {name}
                  </option>
                ))}
                <option value="default" className="bg-stone-800 text-paper">
                  默认(通用)
                </option>
              </select>
              <span className="text-paper/20">|</span>
            </>
          )}
          <button onClick={() => handleZOrder("front")} title="置顶" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">⤒</button>
          <button onClick={() => handleZOrder("forward")} title="上移" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">↑</button>
          <button onClick={() => handleZOrder("backward")} title="下移" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">↓</button>
          <button onClick={() => handleZOrder("back")} title="置底" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">⤓</button>
          <span className="text-paper/20">|</span>
          <button
            onClick={handleToggleLock}
            className={`rounded px-2 py-0.5 text-[10px] transition ${selectedAsset.locked ? "bg-yellow-600 text-white" : "text-paper/60 hover:bg-white/10"}`}
          >
            {selectedAsset.locked ? "🔒 锁定" : "解锁"}
          </button>
          <button onClick={handleDelete} title="删除素材" className="rounded px-2 py-0.5 text-[10px] text-red-300 transition hover:bg-red-900/40">🗑</button>
          <span className="text-paper/20">|</span>
          <span className="text-[10px] text-paper/50">事件:</span>
          {(["ancient", "poetry", "jieqi", "calendar", "flowers", "shichen", "garden"] as const).map((t) => {
            const labels: Record<string, string> = {
              ancient: "客", poetry: "诗", jieqi: "节", calendar: "历",
              flowers: "花", shichen: "时", garden: "食",
            };
            const colors: Record<string, string> = {
              ancient: "#c44536", poetry: "#b8860b", jieqi: "#6b8e6b", calendar: "#8b7355",
              flowers: "#d4829b", shichen: "#5f7a8b", garden: "#7a8c5a",
            };
            return (
              <button
                key={t}
                onClick={() => handleSetInteraction(t)}
                className={`rounded px-2 py-0.5 text-[10px] transition ${selectedAsset.interaction === t ? "text-white" : "text-paper/60 hover:bg-white/10"}`}
                style={selectedAsset.interaction === t ? { background: colors[t] } : {}}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== 固定画布（等比缩放 + 居中，与 StudyScene 完全一致）===== */}
      <div
        className="absolute"
        style={{
          width: `${refW}px`,
          height: `${refH}px`,
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          zIndex: 100,
        }}
        onMouseDown={() => setSelectedId(null)}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {sortedAssets.map((asset) => {
          // 古人访客：使用当前选中的古人专属图片和布局
          const renderAsset = asset.id === "elem-ancient-guest" && ANCIENT_IMAGE_MAP[debugAncientId]
            ? {
                ...asset,
                src: ANCIENT_IMAGE_MAP[debugAncientId],
                name: `${ANCIENT_NAMES[debugAncientId]}坐像`,
                ...(asset.ancientLayouts?.[debugAncientId] ?? {}),
              }
            : asset;
          return (
            <DraggableAsset
              key={asset.id}
              asset={renderAsset}
              scale={scale}
              refW={refW}
              refH={refH}
              isSelected={selectedId === asset.id}
              onSelect={() => setSelectedId(asset.id)}
              onChange={(changes) => updateAsset(asset.id, changes)}
            />
          );
        })}
      </div>

      {/* ===== 图层面板 ===== */}
      {showLayers && (
        <div
          className="fixed right-3 top-28 z-[250] w-60 rounded-2xl"
          style={{ background: "rgba(253, 251, 246, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(45,42,38,0.1)" }}
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2">
            <span className="title-serif text-xs font-bold text-ink">图层 ({assets.length})</span>
            <button onClick={() => setShowLayers(false)} className="text-muted hover:text-ink">✕</button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {[...assets].sort((a, b) => b.z - a.z).map((a) => {
              const color =
                a.interaction === "ancient" ? "#c44536"
                : a.interaction === "poetry" ? "#b8860b"
                : a.interaction === "jieqi" ? "#6b8e6b"
                : a.interaction === "calendar" ? "#8b7355"
                : a.interaction === "flowers" ? "#d4829b"
                : a.interaction === "shichen" ? "#5f7a8b"
                : a.interaction === "garden" ? "#7a8c5a"
                : null;
              return (
                <div
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition ${
                    selectedId === a.id ? "bg-[#c44536]/10" : "hover:bg-ink/5"
                  }`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <img src={a.src} alt="" className="h-8 w-8 rounded object-contain" style={{ background: "#f5f1e8" }} />
                  <span className="flex-1 truncate text-ink-light">{a.name}</span>
                  {a.locked && <span className="text-[8px] text-muted">🔒</span>}
                  {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
                  <span className="text-[8px] text-muted/60">z:{a.z}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 素材库面板 ===== */}
      {showLibrary && (
        <div
          className="fixed left-3 top-28 z-[200] flex flex-col rounded-2xl"
          style={{
            width: "280px",
            maxHeight: "70vh",
            background: "rgba(253, 251, 246, 0.96)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(45,42,38,0.1)",
          }}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2">
            <span className="title-serif text-xs font-bold text-ink">素材库</span>
            <button onClick={() => setShowLibrary(false)} className="text-muted hover:text-ink">✕</button>
          </div>

          {/* 搜索框 */}
          <div className="border-b border-ink/5 px-3 py-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索素材..."
              className="w-full rounded-lg bg-ink/5 px-2.5 py-1 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {/* 分类标签 */}
          <div className="flex gap-1 overflow-x-auto border-b border-ink/5 px-2 py-1.5" style={{ scrollbarWidth: "thin" }}>
            {Object.keys(manifest).map((cat) => {
              const label = CATEGORY_LABELS[cat] ?? cat;
              const isActive = activeCategory === cat && !searchQuery;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearchQuery("");
                  }}
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] transition ${
                    isActive
                      ? "bg-[#c44536] text-white"
                      : "bg-ink/5 text-ink-light hover:bg-ink/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* 缩略图网格 */}
          <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
            <div className="grid grid-cols-3 gap-1.5">
              {(searchQuery
                ? Object.entries(manifest).flatMap(([cat, files]) =>
                    files
                      .filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((f) => ({ cat, filename: f }))
                  )
                : (manifest[activeCategory] ?? []).map((f) => ({ cat: activeCategory, filename: f }))
              ).map(({ cat, filename }) => (
                <div
                  key={`${cat}/${filename}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/json", JSON.stringify({ category: cat, filename }));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onDoubleClick={() => handleAddAsset(cat, filename)}
                  className="group cursor-grab rounded-lg border border-ink/5 bg-ink/[0.02] p-1 transition hover:border-[#c44536]/30 hover:bg-[#c44536]/5 active:cursor-grabbing"
                  title={`${filename}\n拖拽到画布或双击添加`}
                >
                  <div className="flex h-12 items-center justify-center overflow-hidden">
                    <img
                      src={`/assets/${cat}/${filename}`}
                      alt={filename}
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-0.5 truncate text-center text-[8px] text-muted">
                    {filename.replace(/\.[^.]+$/, "")}
                  </p>
                </div>
              ))}
            </div>
            {/* 空状态 */}
            {(() => {
              const items = searchQuery
                ? Object.values(manifest).flat().filter((f) => f.includes(searchQuery))
                : manifest[activeCategory] ?? [];
              if (items.length === 0) {
                return <p className="py-8 text-center text-xs text-muted">未找到匹配素材</p>;
              }
              return null;
            })()}
          </div>

          {/* 底部提示 */}
          <div className="border-t border-ink/10 px-3 py-1.5 text-[9px] text-muted">
            拖拽到画布 · 双击添加到中心
          </div>
        </div>
      )}

      {/* ===== 底部提示 ===== */}
      <div className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-full px-4 py-2 text-xs text-white" style={{ background: "rgba(196, 69, 54, 0.85)" }}>
        拖动移动 · 右下角缩放 · 选中后绑定事件 · 缩放比例 {Math.round(scale * 100)}%
      </div>
    </>
  );
}
