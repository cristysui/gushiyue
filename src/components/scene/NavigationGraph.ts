/**
 * 导航图系统 —— 2D 组合式场景
 *
 * 天空在上，纯色背景在下，场景元素（地面/建筑/树木/花卉）分层组合
 */

// ===== 平台 ID =====
export type PlatformId = "courtyard" | "waterGarden" | "centralGarden" | "pavilion" | "observatory";

// ===== 场景元素定义 =====
export interface SceneElement {
  src: string;
  /** 相对于平台的 X 偏移 (px) */
  dx: number;
  /** 相对于平台的 Y 偏移 (px)，负数=向上 */
  dy: number;
  /** 宽度 (px) */
  w: number;
  /** z-index 偏移 */
  z?: number;
}

// ===== 平台节点 =====
export interface PlatformNode {
  id: PlatformId;
  name: string;
  /** 屏幕位置 (百分比 0-100) */
  pos: { x: number; y: number };
  /** 地面宽度 */
  width: number;
  /** 地面图片 */
  ground: string;
  /** 平台上的元素 */
  elements: SceneElement[];
  /** 交互点类型 */
  interaction?: "ancient" | "poetry" | "jieqi";
}

// ===== 连接定义 =====
export interface Connection {
  from: PlatformId;
  to: PlatformId;
  image: string;
  /** 连接位置 (百分比) */
  pos: { x: number; y: number };
  width: number;
  rotation?: number;
}

// ===== 季节 =====
export type Season = "spring" | "summer" | "autumn" | "winter";

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

// ===== 季节资源 =====
export const SEASON_ASSETS = {
  spring: {
    sky: "/assets/sky/sky-clear.jpg",
    mountain: "/assets/sky/mountain-spring.jpg",
    weather: "petals" as const,
    flowerCourtyard: "/assets/flower/flower-peach.png",
    flowerCentral: "/assets/flower/flower-peony.png",
    crop: "/assets/crop/crop-spring-shoot.png",
  },
  summer: {
    sky: "/assets/sky/sky-clear.jpg",
    mountain: "/assets/sky/mountain-summer.jpg",
    weather: "rain" as const,
    flowerCourtyard: "/assets/flower/flower-pomegranate.png",
    flowerCentral: "/assets/flower/flower-lotus.png",
    crop: "/assets/crop/crop-summer-melon.png",
  },
  autumn: {
    sky: "/assets/sky/sky-sunset.jpg",
    mountain: "/assets/sky/mountain-autumn.jpg",
    weather: "petals" as const,
    flowerCourtyard: "/assets/flower/flower-osmanthus.png",
    flowerCentral: "/assets/flower/flower-chrysanthemum.png",
    crop: "/assets/crop/crop-autumn-rice.png",
  },
  winter: {
    sky: "/assets/sky/sky-snow.jpg",
    mountain: "/assets/sky/mountain-winter.jpg",
    weather: "snow" as const,
    flowerCourtyard: "/assets/flower/flower-plum.png",
    flowerCentral: "/assets/flower/flower-plum.png",
    crop: "/assets/crop/crop-winter-radish.png",
  },
};

// ===== 根据季节获取平台配置 =====
export function getPlatforms(season: Season): Record<PlatformId, PlatformNode> {
  const sa = SEASON_ASSETS[season];
  return {
    courtyard: {
      id: "courtyard",
      name: "庭院入口",
      pos: { x: 75, y: 78 },
      width: 180,
      ground: "/assets/ground/ground-courtyard.png",
      elements: [
        // 门楼
        { src: "/assets/building/building-gate.png", dx: 0, dy: -50, w: 100, z: 2 },
        // 松树（左侧）
        { src: "/assets/tree/tree-pine.png", dx: -65, dy: -40, w: 70, z: 1 },
        // 石灯笼
        { src: "/assets/building/stone-lantern.png", dx: 55, dy: -25, w: 35, z: 3 },
        // 季节花卉
        { src: sa.flowerCourtyard, dx: 50, dy: -15, w: 45, z: 1 },
      ],
    },
    waterGarden: {
      id: "waterGarden",
      name: "水车花园",
      pos: { x: 22, y: 75 },
      width: 180,
      ground: "/assets/ground/ground-watergarden.png",
      elements: [
        // 水车
        { src: "/assets/building/water-wheel.png", dx: -10, dy: -55, w: 80, z: 2 },
        // 柳树
        { src: "/assets/tree/tree-willow.png", dx: 55, dy: -50, w: 70, z: 1 },
        // 荷花
        { src: "/assets/flower/flower-lotus.png", dx: -50, dy: -10, w: 45, z: 1 },
        // 石灯笼
        { src: "/assets/building/stone-lantern.png", dx: -60, dy: -20, w: 30, z: 3 },
      ],
    },
    centralGarden: {
      id: "centralGarden",
      name: "中央花园",
      pos: { x: 48, y: 52 },
      width: 200,
      ground: "/assets/ground/ground-central.png",
      elements: [
        // 节气碑
        { src: "/assets/building/stone-tablet-jieqi.png", dx: 0, dy: -55, w: 60, z: 2 },
        // 竹子（左）
        { src: "/assets/tree/tree-bamboo.png", dx: -65, dy: -45, w: 55, z: 1 },
        // 季节花卉
        { src: sa.flowerCentral, dx: 60, dy: -20, w: 55, z: 1 },
        // 作物
        { src: sa.crop, dx: -40, dy: -10, w: 50, z: 1 },
      ],
      interaction: "jieqi",
    },
    pavilion: {
      id: "pavilion",
      name: "书院亭台",
      pos: { x: 22, y: 28 },
      width: 180,
      ground: "/assets/ground/ground-pavilion.png",
      elements: [
        // 亭台建筑
        { src: "/assets/building/building-pavilion.png", dx: 0, dy: -55, w: 110, z: 2 },
        // 梅树
        { src: "/assets/tree/tree-plum.png", dx: 60, dy: -45, w: 65, z: 1 },
        // 石灯笼
        { src: "/assets/building/stone-lantern.png", dx: -55, dy: -25, w: 30, z: 3 },
      ],
      interaction: "ancient",
    },
    observatory: {
      id: "observatory",
      name: "观星台",
      pos: { x: 75, y: 25 },
      width: 180,
      ground: "/assets/ground/ground-observatory.png",
      elements: [
        // 诗碑
        { src: "/assets/building/stone-tablet-poetry.png", dx: -20, dy: -50, w: 50, z: 2 },
        // 日晷
        { src: "/assets/building/sundial.png", dx: 35, dy: -30, w: 40, z: 2 },
        // 枫树
        { src: "/assets/tree/tree-maple.png", dx: 55, dy: -45, w: 65, z: 1 },
        // 石灯笼
        { src: "/assets/building/stone-lantern.png", dx: -55, dy: -20, w: 28, z: 3 },
      ],
      interaction: "poetry",
    },
  };
}

// ===== 连接 =====
export function getConnections(): Connection[] {
  return [
    // 庭院 → 水车花园
    {
      from: "courtyard", to: "waterGarden",
      image: "/assets/ground/bridge-stone.png",
      pos: { x: 48, y: 77 }, width: 100, rotation: -5,
    },
    // 水车花园 → 中央花园
    {
      from: "waterGarden", to: "centralGarden",
      image: "/assets/ground/stairs-straight.png",
      pos: { x: 35, y: 64 }, width: 90, rotation: -25,
    },
    // 中央花园 → 书院亭台
    {
      from: "centralGarden", to: "pavilion",
      image: "/assets/ground/stairs-spiral.png",
      pos: { x: 34, y: 40 }, width: 90, rotation: -15,
    },
    // 中央花园 → 观星台
    {
      from: "centralGarden", to: "observatory",
      image: "/assets/ground/bridge-stone.png",
      pos: { x: 62, y: 38 }, width: 90, rotation: 20,
    },
  ];
}

// ===== 邻接表 =====
const ADJACENCY: Record<PlatformId, PlatformId[]> = {
  courtyard: ["waterGarden", "centralGarden"],
  waterGarden: ["courtyard", "centralGarden"],
  centralGarden: ["waterGarden", "courtyard", "pavilion", "observatory"],
  pavilion: ["centralGarden", "observatory"],
  observatory: ["centralGarden", "pavilion"],
};

// ===== BFS 寻路 =====
export function findPath(from: PlatformId, to: PlatformId): PlatformId[] {
  if (from === to) return [from];
  const visited = new Set<PlatformId>([from]);
  const queue: PlatformId[][] = [[from]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const next of ADJACENCY[current]) {
      if (visited.has(next)) continue;
      visited.add(next);
      const newPath = [...path, next];
      if (next === to) return newPath;
      queue.push(newPath);
    }
  }
  return [from];
}

// ===== 生成行走路径点 =====
export function getPathWaypoints2D(platformPath: PlatformId[], platforms: Record<PlatformId, PlatformNode>): { x: number; y: number }[] {
  if (platformPath.length === 0) return [];
  return platformPath.map((id) => platforms[id].pos);
}

// ===== 生成场景素材列表（用于 Debug 模式）=====
export interface SceneAssetInit {
  id: string;
  src: string;
  name: string;
  x: number;   // 像素坐标
  y: number;
  w: number;
  z: number;
  category: string;
}

export function generateSceneAssets(
  containerW: number,
  containerH: number,
  season: Season,
  ancientId?: string,
): SceneAssetInit[] {
  const sa = SEASON_ASSETS[season];
  const platforms = getPlatforms(season);
  const connections = getConnections();
  const assets: SceneAssetInit[] = [];
  let n = 0;

  // 百分比转像素
  const px = (pct: number) => (pct / 100) * containerW;
  const py = (pct: number) => (pct / 100) * containerH;

  // 天空（全宽，顶部 38%）
  assets.push({
    id: `scene-${n++}`, src: sa.sky, name: "天空",
    x: 0, y: 0, w: containerW, z: 0, category: "sky",
  });

  // 远山
  assets.push({
    id: `scene-${n++}`, src: sa.mountain, name: "远山",
    x: 0, y: py(8), w: containerW, z: 1, category: "sky",
  });

  // 连接（楼梯/桥）
  connections.forEach((conn, i) => {
    assets.push({
      id: `scene-${n++}`, src: conn.image,
      name: conn.image.split("/").pop()?.replace(/\.\w+$/, "") ?? `连接${i + 1}`,
      x: px(conn.pos.x) - conn.width / 2,
      y: py(conn.pos.y) - conn.width / 4,
      w: conn.width, z: 8, category: "ground",
    });
  });

  // 平台 + 元素
  (Object.keys(platforms) as PlatformId[]).forEach((pid) => {
    const p = platforms[pid];
    const cx = px(p.pos.x);
    const cy = py(p.pos.y);

    // 地面
    assets.push({
      id: `scene-${n++}`, src: p.ground, name: p.name,
      x: cx - p.width / 2, y: cy - p.width / 4,
      w: p.width, z: 15, category: "ground",
    });

    // 平台上的元素
    p.elements.forEach((el) => {
      const fileName = el.src.split("/").pop()?.replace(/\.\w+$/, "") ?? "元素";
      assets.push({
        id: `scene-${n++}`, src: el.src, name: fileName,
        x: cx + el.dx - el.w / 2,
        y: cy + el.dy - el.w / 2,
        w: el.w, z: 15 + (el.z ?? 1),
        category: el.src.includes("building") ? "building"
          : el.src.includes("tree") ? "tree"
          : el.src.includes("flower") ? "flower"
          : el.src.includes("crop") ? "crop" : "element",
      });
    });
  });

  // NPC
  const npcSrc = ancientId
    ? (NPC_IMAGES[ancientId] ?? "/assets/npc/npc-libai.png")
    : "/assets/npc/npc-libai.png";
  const pavilionPos = platforms.pavilion.pos;
  assets.push({
    id: `scene-${n++}`, src: npcSrc, name: "古人NPC",
    x: px(pavilionPos.x + 3) - 24,
    y: py(pavilionPos.y - 6) - 24,
    w: 48, z: 25, category: "npc",
  });

  // 角色
  const courtyardPos = platforms.courtyard.pos;
  assets.push({
    id: `scene-${n++}`, src: "/assets/char/char-stand-v2.png", name: "角色",
    x: px(courtyardPos.x) - 19,
    y: py(courtyardPos.y) - 20,
    w: 38, z: 30, category: "char",
  });

  return assets;
}

// ===== NPC 图片映射 =====
export const NPC_IMAGES: Record<string, string> = {
  libai: "/assets/npc/npc-libai.png",
  sushi: "/assets/npc/npc-sushi.png",
  dufu: "/assets/npc/npc-dufu.png",
  wangwei: "/assets/npc/npc-wangwei.png",
  liqingzhao: "/assets/npc/npc-liqingzhao.png",
  luyou: "/assets/npc/npc-luyou.png",
  taoyuanming: "/assets/npc/npc-taoyuanming.png",
  xinqiji: "/assets/npc/npc-xinqiji.png",
  baijuyi: "/assets/npc/npc-sushi.png",
  nalanxingde: "/assets/npc/npc-liqingzhao.png",
  wangyangming: "/assets/npc/npc-wangwei.png",
  zhuangzi: "/assets/npc/npc-taoyuanming.png",
};
