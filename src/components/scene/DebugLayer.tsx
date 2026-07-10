"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  getEffectiveLayout,
  getFileLayout,
  getFileRefSize,
  clearLocalLayout,
  saveLocalLayout,
  exportToFileFormat,
  scaleAssets,
  type LayoutAsset,
  type InteractionType,
} from "@/lib/scene-layout";

// ===== Debug 专用素材类型（扩展 LayoutAsset，增加 isBlob 用于拖入的本地文件）=====
interface DebugAsset extends LayoutAsset {
  isBlob?: boolean;
}

// ===== 工具栏 =====
function DebugToolbar({
  assetCount,
  onClear,
  onExport,
  onAddFromLibrary,
  onToggleLayerPanel,
  onExitDebug,
  selectedName,
  selectedInteraction,
  onSetInteraction,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: {
  assetCount: number;
  onClear: () => void;
  onExport: () => void;
  onAddFromLibrary: () => void;
  onToggleLayerPanel: () => void;
  onExitDebug: () => void;
  selectedName: string | null;
  selectedInteraction: InteractionType;
  onSetInteraction: (type: InteractionType) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}) {
  return (
    <>
      {/* 顶部工具栏 */}
      <div
        className="fixed left-1/2 top-12 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2"
        style={{ background: "rgba(196, 69, 54, 0.9)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
      >
        <span className="text-xs font-bold text-white">DEBUG</span>
        <span className="text-white/40">|</span>
        <span className="text-xs text-white/70">{assetCount}</span>
        <button onClick={onAddFromLibrary} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">素材库</button>
        <button onClick={onToggleLayerPanel} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">图层</button>
        <button onClick={onExport} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">导出配置</button>
        <button onClick={onClear} className="rounded-full bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 transition">重置为文件</button>
        <span className="text-white/40">|</span>
        <button onClick={onExitDebug} className="rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-white hover:bg-white/50 transition">退出 Debug</button>
      </div>

      {/* 选中素材的控制面板 */}
      {selectedName && (
        <div
          className="fixed left-1/2 top-28 z-[200] flex -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl px-3 py-1.5"
          style={{ background: "rgba(28, 25, 23, 0.88)", backdropFilter: "blur(8px)", maxWidth: "90vw" }}
        >
          <span className="max-w-[120px] truncate text-xs text-paper/80">{selectedName}</span>
          <span className="text-paper/20">|</span>
          {/* 层级控制 */}
          <button onClick={onBringToFront} title="置顶" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">⤒</button>
          <button onClick={onBringForward} title="上移" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">↑</button>
          <button onClick={onSendBackward} title="下移" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">↓</button>
          <button onClick={onSendToBack} title="置底" className="rounded px-1.5 py-0.5 text-[10px] text-paper/70 hover:bg-white/10">⤓</button>
          <span className="text-paper/20">|</span>
          {/* 事件绑定 */}
          <span className="text-[10px] text-paper/50">事件:</span>
          <button
            onClick={() => onSetInteraction(selectedInteraction === "ancient" ? null : "ancient")}
            className={`rounded px-2 py-0.5 text-[10px] transition ${selectedInteraction === "ancient" ? "bg-[#c44536] text-white" : "text-paper/60 hover:bg-white/10"}`}
          >古人对话</button>
          <button
            onClick={() => onSetInteraction(selectedInteraction === "poetry" ? null : "poetry")}
            className={`rounded px-2 py-0.5 text-[10px] transition ${selectedInteraction === "poetry" ? "bg-[#b8860b] text-white" : "text-paper/60 hover:bg-white/10"}`}
          >诗词</button>
          <button
            onClick={() => onSetInteraction(selectedInteraction === "jieqi" ? null : "jieqi")}
            className={`rounded px-2 py-0.5 text-[10px] transition ${selectedInteraction === "jieqi" ? "bg-[#6b8e6b] text-white" : "text-paper/60 hover:bg-white/10"}`}
          >节气</button>
        </div>
      )}
    </>
  );
}

// ===== 单个可拖拽素材 =====
function DraggableAsset({
  asset,
  isSelected,
  onSelect,
  onChange,
}: {
  asset: DebugAsset;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (changes: Partial<DebugAsset>) => void;
}) {
  const dragState = useRef<{
    mode: "move" | "resize" | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
  }>({ mode: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "move" | "resize") => {
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
    [asset.x, asset.y, asset.w, onSelect]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds.mode) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (ds.mode === "move") {
        onChange({ x: ds.origX + dx, y: ds.origY + dy });
      } else if (ds.mode === "resize") {
        const newW = Math.max(20, ds.origW + dx);
        onChange({ w: newW });
      }
    };
    const handleMouseUp = () => { dragState.current.mode = null; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onChange]);

  // 事件绑定颜色标记
  const interactionColor = asset.interaction === "ancient" ? "#c44536"
    : asset.interaction === "poetry" ? "#b8860b"
    : asset.interaction === "jieqi" ? "#6b8e6b"
    : null;

  return (
    <div
      className="absolute"
      style={{
        left: `${asset.x}px`,
        top: `${asset.y}px`,
        width: `${asset.w}px`,
        zIndex: asset.z,
        transform: `rotate(${asset.rotation || 0}deg)`,
        cursor: "move",
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      <img
        src={asset.src}
        alt={asset.name}
        draggable={false}
        style={{ width: "100%", height: "auto", pointerEvents: "none", userSelect: "none", display: "block" }}
      />

      {/* 事件绑定标记（未选中时显示） */}
      {interactionColor && !isSelected && (
        <div
          className="pointer-events-none absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[8px] text-white"
          style={{ background: interactionColor, border: "2px solid white" }}
        >
          {asset.interaction === "ancient" ? "古" : asset.interaction === "poetry" ? "诗" : "节"}
        </div>
      )}

      {isSelected && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              border: `2px dashed ${interactionColor ?? "#c44536"}`,
              boxShadow: `0 0 0 1px ${interactionColor ?? "rgba(196, 69, 54, 0.2)"}`,
            }}
          />
          {/* 缩放手柄 */}
          <div
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-full"
            style={{ background: interactionColor ?? "#c44536", border: "2px solid white" }}
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
          {/* 信息标签 */}
          <div
            className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: interactionColor ?? "rgba(196, 69, 54, 0.9)", color: "white" }}
          >
            {asset.name} · {Math.round(asset.w)}px · z:{asset.z}
            {asset.interaction && ` · ${asset.interaction}`}
          </div>
        </>
      )}
    </div>
  );
}

// ===== 图层面板 =====
function LayerPanel({
  assets,
  selectedId,
  onSelect,
  onReorder,
  onClose,
}: {
  assets: DebugAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onClose: () => void;
}) {
  const sorted = [...assets].sort((a, b) => b.z - a.z);
  return (
    <div
      className="fixed right-3 top-28 z-[250] w-56 rounded-2xl"
      style={{ background: "rgba(253, 251, 246, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(45,42,38,0.1)" }}
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-3 py-2">
        <span className="title-serif text-xs font-bold text-ink">图层</span>
        <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
      </div>
      <div className="max-h-[50vh] overflow-y-auto py-1">
        {sorted.length === 0 ? (
          <p className="px-3 py-4 text-center text-[10px] text-muted">暂无素材</p>
        ) : (
          sorted.map((a) => {
            const color = a.interaction === "ancient" ? "#c44536"
              : a.interaction === "poetry" ? "#b8860b"
              : a.interaction === "jieqi" ? "#6b8e6b" : null;
            return (
              <div
                key={a.id}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition ${
                  selectedId === a.id ? "bg-[#c44536]/10" : "hover:bg-ink/5"
                }`}
                onClick={() => onSelect(a.id)}
              >
                <img src={a.src} alt="" className="h-8 w-8 rounded object-contain" style={{ background: "#f5f1e8" }} />
                <span className="flex-1 truncate text-ink-light">{a.name}</span>
                {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
                {a.category && <span className="text-[8px] text-muted/60">{a.category}</span>}
                <div className="flex flex-col">
                  <button onClick={(e) => { e.stopPropagation(); onReorder(a.id, "up"); }} className="text-[8px] text-muted hover:text-ink">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); onReorder(a.id, "down"); }} className="text-[8px] text-muted hover:text-ink">▼</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ===== 素材库面板 =====
function AssetLibrary({ onSelect, onClose }: { onSelect: (path: string, name: string) => void; onClose: () => void; }) {
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/assets/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setGroups(data || getKnownAssets()); setLoading(false); })
      .catch(() => { setGroups(getKnownAssets()); setLoading(false); });
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="max-h-[70vh] w-[600px] max-w-[90vw] overflow-y-auto rounded-2xl p-5" style={{ background: "#fdfbf6" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="title-serif text-lg font-bold text-ink">素材库</h3>
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>
        {loading ? (
          <p className="text-center text-sm text-muted">加载中...</p>
        ) : (
          Object.entries(groups).map(([cat, files]) => (
            <div key={cat} className="mb-4">
              <p className="title-serif mb-2 text-xs font-semibold text-muted">{cat}</p>
              <div className="grid grid-cols-6 gap-2">
                {files.map((file) => {
                  const path = `/assets/${cat}/${file}`;
                  return (
                    <div key={file} className="cursor-pointer rounded-lg border-2 border-transparent p-1 hover:border-[#c44536]" onClick={() => onSelect(path, file)}>
                      <img src={path} alt={file} className="h-16 w-full rounded object-contain" style={{ background: "#f5f1e8" }} />
                      <p className="mt-1 truncate text-[9px] text-muted">{file}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getKnownAssets(): Record<string, string[]> {
  // 与 public/assets/manifest.json 保持同步
  // 实际运行时优先从 /assets/manifest.json fetch 加载
  return {
    sky: ["sky-clear.jpg", "sky-sunset.jpg", "sky-rainy.jpg", "sky-snow.jpg", "mountain-spring.jpg", "mountain-summer.jpg", "mountain-autumn.jpg", "mountain-winter.jpg"],
    building: ["building-academy.png", "building-bookshop.png", "building-courtyard-pool.png", "building-feed-trough.png", "building-gate.png", "building-globe.png", "building-gnomon.png", "building-house-1.png", "building-house-2.png", "building-merchant-hall.png", "building-pavilion-orchid.png", "building-pavilion.png", "building-shrine-altar.png", "building-shrine.png", "building-thatched-hut.png", "stone-lantern.png", "stone-tablet-jieqi.png", "stone-tablet-poetry.png", "sundial.png"],
    tree: ["tree-bamboo-1.png", "tree-bamboo-2.png", "tree-bamboo-3.png", "tree-bamboo-4.png", "tree-banyan.png", "tree-bushy.png", "tree-cherry-blossom.png", "tree-dead.png", "tree-money-tree.png", "tree-moon-cassia.png", "tree-orchard.png", "tree-pine-green.png", "tree-plum-blessed-1.png", "tree-plum-blessed-2.png", "tree-plum-blessed-3.png", "tree-ramie-field.png", "tree-round-1.png", "tree-round-2.png", "tree-round-3.png", "tree-willow-1.png", "tree-willow-2.png", "tree-willow-3.png"],
    flower: ["flower-amaranth.png", "flower-amaranth-2.png", "flower-bird-feeder.png", "flower-bronze-deer.png", "flower-butterfly-bush.png", "flower-butterfly-bush-2.png", "flower-chrysanthemum.png", "flower-chrysanthemum-2.png", "flower-chrysanthemum-3.png", "flower-cogon.png", "flower-daylily.png", "flower-daylily-2.png", "flower-dendrobium.png", "flower-dew-terrace.png", "flower-epiphyllum.png", "flower-epiphyllum-bloom.png", "flower-gentian.png", "flower-gentian-2.png", "flower-hibiscus.png", "flower-hollyhock.png", "flower-hollyhock-2.png", "flower-hydrangea.png", "flower-hydrangea-2.png", "flower-kerria.png", "flower-morning-glory.png", "flower-morning-glory-2.png", "flower-narcissus.png", "flower-narcissus-2.png", "flower-osmanthus.png", "flower-peony.png", "flower-peony-2.png", "flower-peony-3.png", "flower-pine-window.png", "flower-rock-garden.png", "flower-schefflera.png", "flower-stone-furnace.png", "flower-stone-lamp.png", "flower-stone-pillar.png", "flower-vine-summer.png"],
    crop: ["crop-autumn-rice.png", "crop-carrot.png", "crop-spring-shoot.png", "crop-summer-melon.jpg", "crop-winter-radish.jpg"],
    ground: ["ground-colorful-tree-1.png", "ground-colorful-tree-2.png", "ground-courtyard.png", "ground-daylily-corner.png", "ground-fish-pond.png", "ground-pavilion.png", "ground-plaza-1.png", "ground-plaza-2.png", "ground-relaxed-bear.png", "ground-rest-table.png", "ground-star-gate.png", "ground-star-wall.png", "ground-stele.png", "ground-toona-tree.png", "ground-vegetable-plot.png", "ground-watergarden.png", "stairs-straight.png"],
    scene: ["scene-background.jpg", "scene-distant-falls.png", "scene-fish-gate.png", "scene-respond-1.png", "scene-respond-2.png", "scene-respond-3.png", "scene-spread-1.png", "scene-spread-2.png", "scene-spread-3.png"],
    char: ["char-stand-v2.png", "char-walk-v2.png", "char-stand.png", "char-walk.png"],
    npc: ["npc-libai.png", "npc-sushi.png", "npc-dufu.png", "npc-wangwei.png", "npc-liqingzhao.png", "npc-luyou.png", "npc-taoyuanming.png", "npc-xinqiji.png"],
    "佳肴": ["1烧香菇.png", "2炙蛤蜊.png", "3红烧大虾.png", "4烹河豚.png", "5炸螃蟹.png", "6酥油泡螺.png", "7炙泥鳅.png", "8油煎鸡.png", "9水煠肉.png", "10羊灌肠.png", "11桂花糕.png", "12汤包.png", "13鸭血粉丝汤.png", "14杏仁豆腐.png", "15盐水鸭.png", "16佛跳墙.png", "17冰糖甲鱼.png", "19龙井虾仁.png", "food-unknown-1.png", "food-unknown-2.png", "20毛豆腐.png", "21百叶包.png", "22绍三鲜.png", "23清汤越鸡.png", "24叫花鸡.png", "25桃脂烧肉.png", "26西湖牛肉汤.png", "27蟹粉狮子头.png", "28鱼头汤.png", "29羊方藏鱼.png", "30素什锦.png", "31蟹酿橙.png", "32鸽蛋羹.png", "大酒坛.png", "冬瓜虾仁汤.png", "豆角.png", "桂花糖藕.png", "桂花糖芋苗.png", "鸡丝银鱼汤.png", "饺子.png", "菊糕.png", "菊花酒.png", "烤鱼.png", "辣炒螃蟹.png", "辣椒.png", "辣椒-2.png", "醴酪.png", "龙鳞饼.png", "龙须面.png", "绿豆汤.png", "萝卜.png", "麻辣鲜香水煮鱼.png", "浓油厚酱红烧鱼.png", "清明粑.png", "清炸石鳞.png", "清蒸鲈鱼.png", "清蒸咸肉.png", "水煮鱼.png", "糖醋鲤鱼.png", "外酥里嫩松鼠桂鱼.png", "五味香料包.png", "香香软软豆沙包.png", "小酒坛.png", "小糖果.png", "杏仁豆腐.png", "雪菜黄鱼.png", "腌笃鲜.png", "鱼骨.png", "玉米.png", "月饼.png"],
    "季节限定": ["1春-春日踏青.png", "1春-盥手观花.png", "1春-古柳迎春.png", "1春-桃林孤亭.png", "1冬-独钓江雪.png", "1冬-庭霰落梅.png", "1冬-残雪楼园.png", "1冬-雪屋夜棋.png", "1秋-丰收之家.png", "1秋-粮仓晒秋.png", "1秋-连香树.png", "1秋-谷粮集市.png", "1夏-葫芦藤.png", "1夏-林间居.png", "1夏-溪畔悠悠.png", "1夏-夏日垂钓.png", "2春-观花小憩.png", "2春-绿园奇石.png", "2春-落地秋千.png", "2春-玉兰知春.png", "2冬-听雪轩.png", "2冬-望雪亭.png", "2冬-湖上回廊.png", "2冬-雪落蜡梅.png", "2秋-秋日静居.png", "2秋-知秋落枫.png", "2夏-仲夏幽居.png", "2夏-清夏木栾.png", "2夏-清风亭.png", "2夏-青草池塘.png", "3春-春月桐华.png", "3春-紫藤争瀑.png", "3春-紫雨清居.png", "3冬-茶开一扇.png", "3冬-寒酥园.png", "3冬-六出亭.png", "3冬-瑞雪当窗.png", "3冬-山茶小煮.png", "3冬-山中归雪屋.png", "3冬-雾凇抱枝.png", "3秋-林中白桦.png", "3秋-秋游之乐.png", "3秋-叶落秋帐.png", "3夏-吉祥长廊.png", "3夏-亭亭枇杷.png", "3夏-消暑闲居.png", "4春-春光小筑.png", "4春-春山杜鹃.png", "4春-落花墙外.png", "4秋-金钱松.png", "4秋-秋木重楼.png", "4秋-萧萧门楼.png", "4夏-碧水楼台.png", "4夏-枫杨树.png", "4夏-临溪亭.png", "寒雪古木.png", "茅舍听雪.png", "雪覆秋实.png"],
  };
}

// ===== 主组件 =====
export default function DebugLayer({
  containerRef,
  ancientId,
  onExitDebug,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  ancientId?: string;
  onExitDebug: () => void;
}) {
  const [assets, setAssets] = useState<DebugAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const idCounter = useRef(0);
  const initializedRef = useRef(false);

  // ===== 初始化：从 localStorage 或文件配置加载 =====
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // 优先 localStorage，其次文件配置（自动缩放到当前容器尺寸）
    const { assets: loaded } = getEffectiveLayout(w, h);
    if (loaded.length > 0) {
      let maxZ = 0, maxId = 0;
      loaded.forEach((a) => {
        if (a.z > maxZ) maxZ = a.z;
        const match = a.id.match(/(?:asset|scene)-(\d+)/);
        if (match) maxId = Math.max(maxId, parseInt(match[1]));
      });
      idCounter.current = maxId + 1;
      setAssets(loaded as DebugAsset[]);
    }
  }, [containerRef, ancientId]);

  // ===== 自动保存到 localStorage =====
  useEffect(() => {
    const timer = setTimeout(() => {
      const persistable = assets.filter((a) => !a.isBlob);
      saveLocalLayout(persistable);
      if (persistable.length > 0) { setSaved(true); setTimeout(() => setSaved(false), 1500); }
    }, 500);
    return () => clearTimeout(timer);
  }, [assets]);

  // ===== 添加素材 =====
  const addAsset = useCallback((src: string, name: string, x?: number, y?: number, isBlob?: boolean) => {
    const id = `asset-${idCounter.current++}`;
    const container = containerRef.current;
    const cx = container ? container.clientWidth / 2 : 400;
    const cy = container ? container.clientHeight / 2 : 300;
    const maxZ = assets.reduce((mx, a) => Math.max(mx, a.z), 50);
    setAssets((prev) => [...prev, {
      id, src, name,
      x: x ?? cx - 50 + (Math.random() - 0.5) * 100,
      y: y ?? cy - 50 + (Math.random() - 0.5) * 100,
      w: 100, z: maxZ + 1, isBlob,
    }]);
    setSelectedId(id);
  }, [containerRef, assets]);

  // ===== 拖入文件 =====
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const rect = containerRef.current?.getBoundingClientRect();
    files.forEach((file, i) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      const x = rect ? e.clientX - rect.left + i * 20 : undefined;
      const y = rect ? e.clientY - rect.top + i * 20 : undefined;
      addAsset(url, file.name, x, y, true);
    });
  }, [containerRef, addAsset]);

  // ===== 修改素材 =====
  const handleChange = useCallback((id: string, changes: Partial<DebugAsset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }, []);

  // ===== 设置事件绑定 =====
  const handleSetInteraction = useCallback((type: InteractionType) => {
    if (!selectedId) return;
    setAssets((prev) => prev.map((a) => {
      if (a.id === selectedId) return { ...a, interaction: type };
      // 同一类型事件只能绑定一个素材
      if (type && a.interaction === type) return { ...a, interaction: null };
      return a;
    }));
  }, [selectedId]);

  // ===== 层级排序 =====
  const reorder = useCallback((id: string, direction: "up" | "down") => {
    setAssets((prev) => {
      const sorted = [...prev].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx < sorted.length - 1) [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
      else if (direction === "down" && idx > 0) [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
      return sorted.map((a, i) => ({ ...a, z: 51 + i }));
    });
  }, []);

  const bringForward = useCallback(() => { if (selectedId) reorder(selectedId, "up"); }, [selectedId, reorder]);
  const sendBackward = useCallback(() => { if (selectedId) reorder(selectedId, "down"); }, [selectedId, reorder]);
  const bringToFront = useCallback(() => {
    if (!selectedId) return;
    setAssets((prev) => { const maxZ = prev.reduce((mx, a) => Math.max(mx, a.z), 50); return prev.map((a) => (a.id === selectedId ? { ...a, z: maxZ + 1 } : a)); });
  }, [selectedId]);
  const sendToBack = useCallback(() => {
    if (!selectedId) return;
    setAssets((prev) => { const minZ = prev.reduce((mn, a) => Math.min(mn, a.z), 999); return prev.map((a) => (a.id === selectedId ? { ...a, z: minZ - 1 } : a)); });
  }, [selectedId]);

  // ===== 删除选中 =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setAssets((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // ===== 导出为文件格式 JSON =====
  const handleExport = useCallback(() => {
    const persistable = assets.filter((a) => !a.isBlob);
    const json = exportToFileFormat(persistable);
    navigator.clipboard.writeText(json).then(() => {
      alert(
        `已复制 ${persistable.length} 个素材配置到剪贴板！\n\n` +
        `请粘贴到 src/data/scene-layout.json 替换文件内容，\n` +
        `然后清除浏览器 localStorage 覆盖即可生效。`
      );
    }).catch(() => {
      console.log("Scene layout config:", json);
      alert(`已输出到控制台（${persistable.length} 个素材）。请复制后粘贴到 src/data/scene-layout.json`);
    });
  }, [assets]);

  // ===== 重置：清除 localStorage，从文件配置重新加载 =====
  const handleClear = useCallback(() => {
    if (!confirm("确定重置？将清除浏览器临时保存，从配置文件 scene-layout.json 重新加载。")) return;
    clearLocalLayout();
    const container = containerRef.current;
    if (!container) return;
    const { refW, refH } = getFileRefSize();
    const fileAssets = getFileLayout();
    const scaled = scaleAssets(fileAssets, refW, refH, container.clientWidth, container.clientHeight);
    idCounter.current = scaled.length;
    setAssets(scaled as DebugAsset[]);
    setSelectedId(null);
  }, [containerRef]);

  const handleLibrarySelect = useCallback((path: string, name: string) => { addAsset(path, name); setShowLibrary(false); }, [addAsset]);
  const selectedAsset = assets.find((a) => a.id === selectedId);

  return (
    <>
      <DebugToolbar
        assetCount={assets.length}
        onClear={handleClear}
        onExport={handleExport}
        onAddFromLibrary={() => setShowLibrary(true)}
        onToggleLayerPanel={() => setShowLayers(!showLayers)}
        onExitDebug={onExitDebug}
        selectedName={selectedAsset?.name ?? null}
        selectedInteraction={selectedAsset?.interaction ?? null}
        onSetInteraction={handleSetInteraction}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
      />

      {saved && (
        <div className="fixed right-4 top-12 z-[210] rounded-full px-3 py-1 text-xs text-white" style={{ background: "rgba(107, 142, 107, 0.9)" }}>已保存</div>
      )}

      {/* 拖拽区域 */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 100 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onMouseDown={() => setSelectedId(null)}
      >
        {dragOver && (
          <div className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-2xl border-4 border-dashed" style={{ borderColor: "#c44536", background: "rgba(196, 69, 54, 0.05)" }}>
            <p className="text-lg font-bold text-[#c44536]">松开以添加素材</p>
          </div>
        )}
        {assets.map((asset) => (
          <DraggableAsset key={asset.id} asset={asset} isSelected={selectedId === asset.id} onSelect={() => setSelectedId(asset.id)} onChange={(changes) => handleChange(asset.id, changes)} />
        ))}
      </div>

      {/* 底部提示 */}
      <div className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 rounded-full px-4 py-2 text-xs text-white" style={{ background: "rgba(196, 69, 54, 0.85)" }}>
        拖入图片 · 拖动移动 · 右下角缩放 · 选中后绑定事件 · 导出配置后粘贴到 scene-layout.json
      </div>

      {showLayers && <LayerPanel assets={assets} selectedId={selectedId} onSelect={setSelectedId} onReorder={reorder} onClose={() => setShowLayers(false)} />}
      {showLibrary && <AssetLibrary onSelect={handleLibrarySelect} onClose={() => setShowLibrary(false)} />}
    </>
  );
}
