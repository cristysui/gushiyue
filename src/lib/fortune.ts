/**
 * 古时月 —— 日签运势计算库
 *
 * 基于生肖与地支关系，完全在本地计算每日运势，无任何外部 API 调用。
 * 同一用户同一日的结果完全确定（确定性伪随机）。
 *
 * 核心思路：
 *  1. 由出生年份推算本命生肖；
 *  2. 由当日地支推算「日值生肖」；
 *  3. 比对本命生肖与日值生肖的刑冲合害关系，定运势等级；
 *  4. 由当日天干定五行，衍幸运色与河图幸运数；
 *  5. 依运势等级取宜忌条目与古风寄语。
 */

// ===== 基础常量 =====

/** 十二生肖（顺序与地支一致：子鼠、丑牛、寅虎……） */
const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/** 十二地支 */
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 地支对应生肖（与 ZODIAC 同序） */
const ZODIAC_OF_BRANCH = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/** 十天干 */
const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/** 天干 → 五行 */
const TIANGAN_WUXING: Record<string, string> = {
  "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
  "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水",
};

/** 五行 → 幸运色名 */
const WUXING_COLORS: Record<string, string[]> = {
  "金": ["白色", "银色", "金色"],
  "木": ["青色", "绿色", "翠色"],
  "水": ["黑色", "蓝色", "玄色"],
  "火": ["红色", "紫色", "朱色"],
  "土": ["黄色", "棕色", "褐色"],
};

/** 五行 → 河图先天数（金四九、木三八、水一六、火二七、土五十） */
const WUXING_NUMBERS: Record<string, number[]> = {
  "金": [4, 9],
  "木": [3, 8],
  "水": [1, 6],
  "火": [2, 7],
  "土": [5, 10],
};

/** 颜色名 → 十六进制色值（供前端渲染色圈） */
export const COLOR_HEX: Record<string, string> = {
  "白色": "#f0ebe0",
  "银色": "#b8b5ad",
  "金色": "#c9a227",
  "青色": "#4a8b8b",
  "绿色": "#6b8e6b",
  "翠色": "#3da37a",
  "黑色": "#2d2a26",
  "蓝色": "#4a6fa5",
  "玄色": "#1f1e2e",
  "红色": "#c44536",
  "紫色": "#6c5b7b",
  "朱色": "#d4380c",
  "黄色": "#d4a017",
  "棕色": "#8b6f47",
  "褐色": "#6b4f3a",
};

/** 取颜色十六进制值，未匹配时回退中性灰 */
export function getColorHex(colorName: string): string {
  return COLOR_HEX[colorName] || "#8a8074";
}

// ===== 运势等级 =====

type Rating = "大吉" | "吉" | "平" | "小心" | "慎";

/** 各等级对应主色 */
const RATING_COLOR: Record<Rating, string> = {
  "大吉": "#c44536", // 朱红 —— 大吉大利
  "吉": "#b8860b",   // 金色 —— 吉星高照
  "平": "#8a8074",   // 灰褐 —— 平淡是福
  "小心": "#b5651d",  // 琥珀 —— 提醒之色
  "慎": "#5c544a",    // 墨色 —— 慎重守静
};

/** 各等级古风寄语 */
const FORTUNE_MESSAGES: Record<Rating, string> = {
  "大吉": "紫气东来，万事顺遂。宜行大事，所求皆得。",
  "吉": "吉星高照，稳步前行。守正出奇，自有妙得。",
  "平": "平淡是福，不急不躁。守成待变，静候时机。",
  "小心": "谨慎行事，勿急勿贪。守本安分，可保无虞。",
  "慎": "今日宜静，不宜妄动。守心正念，待时而动。",
};

// ===== 宜 / 忌 词库 =====

/** 宜 —— 进取类（吉日所宜） */
const ADVICE_ACTIVE: string[] = [
  "拜访贵人", "出行游玩", "会友小聚", "抚琴对弈", "书信往来", "赏花赏月",
];

/** 宜 —— 静守类（凶日所宜） */
const ADVICE_CALM: string[] = [
  "品茶静思", "整理书案", "焚香读书", "临池习字", "温故知新", "种花莳草",
];

/** 忌 —— 须谨慎之事 */
const CAUTION_POOL: string[] = [
  "争吵口角", "冲动决策", "大额消费", "熬夜伤身", "远行奔波",
  "饮酒过量", "签约立据", "口无遮拦", "搬迁移居", "针锋相对",
];

/** 依运势等级取宜之词库 */
function getAdvicePool(rating: Rating): string[] {
  switch (rating) {
    case "大吉":
    case "吉":
      return ADVICE_ACTIVE;
    case "小心":
    case "慎":
      return ADVICE_CALM;
    case "平":
    default:
      return [...ADVICE_ACTIVE, ...ADVICE_CALM];
  }
}

/** 依运势等级定宜 / 忌条数 */
const RATIO_COUNTS: Record<Rating, { advice: number; caution: number }> = {
  "大吉": { advice: 3, caution: 1 },
  "吉": { advice: 3, caution: 1 },
  "平": { advice: 2, caution: 2 },
  "小心": { advice: 1, caution: 3 },
  "慎": { advice: 1, caution: 3 },
};

// ===== 地支关系定义（均以 0-11 索引表示，与生肖索引一致）=====

/**
 * 三合：申子辰(猴鼠龙)、亥卯未(猪兔羊)、寅午戌(虎马狗)、巳酉丑(蛇鸡牛)
 */
const SANHE_GROUPS: number[][] = [
  [8, 0, 4],  // 申子辰
  [11, 3, 7], // 亥卯未
  [2, 6, 10], // 寅午戌
  [5, 9, 1],  // 巳酉丑
];

/**
 * 六合：子丑、寅亥、卯戌、辰酉、巳申、午未
 */
const LIUHE_PAIRS: [number, number][] = [
  [0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
];

/**
 * 相冲：子午、丑未、寅申、卯酉、辰戌、巳亥
 */
const CHONG_PAIRS: [number, number][] = [
  [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
];

/**
 * 相害：子未、丑午、寅巳、卯辰、申亥、酉戌
 */
const HAI_PAIRS: [number, number][] = [
  [0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10],
];

/**
 * 相刑：子卯(无礼)、寅巳申(恃势)、丑戌未(无恩)；自刑为辰午酉亥(同支)。
 * 此处列出互刑之两两组合。
 */
const XING_PAIRS: [number, number][] = [
  [0, 3],                       // 子卯 · 无礼之刑
  [2, 5], [5, 8], [2, 8],       // 寅巳申 · 恃势之刑
  [1, 10], [10, 7], [1, 7],     // 丑戌未 · 无恩之刑
];

/** 自刑地支：辰、午、酉、亥 */
const SELF_XING_BRANCHES = [4, 6, 9, 11];

/** 判定两支是否构成给定配对关系（无序） */
function isPairMatch(a: number, b: number, pairs: [number, number][]): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

type RelationType = "三合" | "六合" | "相冲" | "相害" | "相刑" | "本命" | "平";

interface ZodiacRelation {
  type: RelationType;
  rating: Rating;
}

/**
 * 推断本命生肖与日值生肖之间的关系及运势等级。
 *
 * 判定优先级（取首个命中者）：
 *  相冲 → 慎（最凶，气场对冲）
 *  三合 → 大吉（最吉，气场相融）
 *  六合 → 吉（暗中相佐）
 *  相害 → 小心（多有妨克）
 *  相刑 → 小心（含自刑，刑伤之气）
 *  本命 → 平（值日本命，宜守本心）
 *  无涉 → 平（平顺之日）
 */
function getZodiacRelation(userIdx: number, dayIdx: number): ZodiacRelation {
  // 相冲（最严重，优先判定）
  if (isPairMatch(userIdx, dayIdx, CHONG_PAIRS)) {
    return { type: "相冲", rating: "慎" };
  }
  // 三合（同组且非自身）
  if (userIdx !== dayIdx &&
      SANHE_GROUPS.some((g) => g.includes(userIdx) && g.includes(dayIdx))) {
    return { type: "三合", rating: "大吉" };
  }
  // 六合
  if (isPairMatch(userIdx, dayIdx, LIUHE_PAIRS)) {
    return { type: "六合", rating: "吉" };
  }
  // 相害
  if (isPairMatch(userIdx, dayIdx, HAI_PAIRS)) {
    return { type: "相害", rating: "小心" };
  }
  // 相刑（含自刑：同支且属自刑地支）
  if (userIdx === dayIdx && SELF_XING_BRANCHES.includes(userIdx)) {
    return { type: "相刑", rating: "小心" };
  }
  if (isPairMatch(userIdx, dayIdx, XING_PAIRS)) {
    return { type: "相刑", rating: "小心" };
  }
  // 本命（同支但非自刑）
  if (userIdx === dayIdx) {
    return { type: "本命", rating: "平" };
  }
  // 无涉
  return { type: "平", rating: "平" };
}

/** 生成关系描述（古风） */
function describeRelation(
  type: RelationType,
  userZodiac: string,
  dayZodiac: string,
): string {
  switch (type) {
    case "三合":
      return `今日${dayZodiac}日，与君之${userZodiac}呈三合之势，气场相融，诸事和顺。`;
    case "六合":
      return `今日${dayZodiac}与君之${userZodiac}六合相契，暗中相佐，喜事可期。`;
    case "相冲":
      return `今日${dayZodiac}与君之${userZodiac}相冲对克，气场逆乱，宜静守不宜妄动。`;
    case "相害":
      return `今日${dayZodiac}与君之${userZodiac}相害相妨，须防口舌是非，慎待人事。`;
    case "相刑":
      return `今日${dayZodiac}与君之${userZodiac}相刑，刑伤之气渐生，谨言慎行为上。`;
    case "本命":
      return `今日${dayZodiac}日，正值君之本命，宜守本心，祈福纳祥。`;
    case "平":
    default:
      return `今日${dayZodiac}与君之${userZodiac}无涉刑冲合害，平顺之日，随缘而行。`;
  }
}

// ===== 历法推算 =====

/** 参考基准日：2000-01-01（本地时间） */
const REF_DATE = new Date(2000, 0, 1);
const MS_PER_DAY = 86400000;

/**
 * 取某日的地支索引（0-11）。
 *
 * 以 2000-01-01 为「子」日（子=鼠）作基准，地支每 12 日一循环。
 * 注：此为本地推算用基准，与天文历实际日柱或有出入，仅供日签趣味之用。
 */
export function getDayBranch(date: Date): number {
  const diffDays = Math.floor((date.getTime() - REF_DATE.getTime()) / MS_PER_DAY);
  return ((diffDays % 12) + 12) % 12;
}

/**
 * 取某日的天干。
 *
 * 以 2000-01-01 为「戊」日作基准（与地支基准合为「戊子」），天干每 10 日一循环。
 * 戊在天干中索引为 4，故以 (diffDays + 4) 起算。
 */
export function getDayStem(date: Date): string {
  const diffDays = Math.floor((date.getTime() - REF_DATE.getTime()) / MS_PER_DAY);
  const idx = (((diffDays + 4) % 10) + 10) % 10;
  return TIANGAN[idx];
}

/** 取某日天干所对应的五行 */
export function getDayWuxing(date: Date): string {
  return TIANGAN_WUXING[getDayStem(date)] || "土";
}

/** 取某日的日值生肖（由地支推得） */
export function getDayZodiac(date: Date): string {
  return ZODIAC_OF_BRANCH[getDayBranch(date)];
}

/** 取某日的地支名（如「卯」） */
export function getDayBranchName(date: Date): string {
  return EARTHLY_BRANCHES[getDayBranch(date)];
}

/** 取某日的干支（如「乙卯」） */
export function getDayGanZhi(date: Date): string {
  return getDayStem(date) + EARTHLY_BRANCHES[getDayBranch(date)];
}

// ===== 确定性伪随机 =====

/**
 * 线性同余伪随机生成器（MINSTD）。
 * 同一种子必产生同一序列，保证结果可复现。
 */
function createRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** 从数组中确定性选取 n 个不重复元素 */
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ===== 对外类型 =====

export interface DailyFortune {
  date: string;           // 如 "2026年7月10日"
  zodiac: string;         // 本命生肖
  dayZodiac: string;      // 日值生肖
  rating: string;         // 大吉 / 吉 / 平 / 小心 / 慎
  ratingColor: string;    // 等级主色（hex）
  luckyColors: string[];  // 幸运色名
  luckyNumbers: number[]; // 幸运数字
  advice: string[];       // 宜
  caution: string[];      // 忌
  message: string;        // 古风寄语
  relationship: string;   // 今日生肖关系描述
}

// ===== 对外函数 =====

/**
 * 由出生年份推算本命生肖。
 * 以公元 4 年为鼠年（子）作基准，生肖每 12 年一循环。
 */
export function getZodiacFromBirthYear(year: number): string {
  const idx = (((year - 4) % 12) + 12) % 12;
  return ZODIAC[idx];
}

/** 十二时辰名称 */
export const SHICHEN_NAMES = [
  "子时(23-1点)", "丑时(1-3点)", "寅时(3-5点)", "卯时(5-7点)",
  "辰时(7-9点)", "巳时(9-11点)", "午时(11-13点)", "未时(13-15点)",
  "申时(15-17点)", "酉时(17-19点)", "戌时(19-21点)", "亥时(21-23点)",
];

/**
 * 计算今日日签运势。
 *
 * @param birthYear  出生年份（公历）
 * @param birthMonth 出生月份（1-12）
 * @param birthDay   出生日（1-31）
 * @param birthHour  出生时辰索引(0-11, 对应子-亥)，可选
 * @returns 今日运势数据（同日同人结果确定）
 */
export function getDailyFortune(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour?: number,
): DailyFortune {
  const now = new Date();

  // 本命生肖及其地支索引
  const userZodiac = getZodiacFromBirthYear(birthYear);
  const userIdx = (((birthYear - 4) % 12) + 12) % 12;

  // 日值生肖、五行
  const dayIdx = getDayBranch(now);
  const dayZodiac = ZODIAC_OF_BRANCH[dayIdx];
  const wuxing = getDayWuxing(now);

  // 关系与运势等级
  const relation = getZodiacRelation(userIdx, dayIdx);
  const rating = relation.rating;

  // 确定性种子：日期 + 生辰，保证同日同人一致、不同人有别
  const seed =
    now.getFullYear() * 10000 +
    (now.getMonth() + 1) * 100 +
    now.getDate() +
    birthYear * 31 +
    birthMonth * 53 +
    birthDay * 71 +
    (birthHour !== undefined ? birthHour * 97 : 0);
  const rng = createRng(seed);

  // 幸运色：当日五行之色，取其二
  const colorPool = WUXING_COLORS[wuxing] || WUXING_COLORS["土"];
  const luckyColors = pickN(colorPool, 2, rng);

  // 幸运数字：五行河图数 + 一衍生数
  const wuxingNums = WUXING_NUMBERS[wuxing] || [5, 10];
  const luckyNumbers: number[] = [...wuxingNums];
  let extra = ((dayIdx + birthYear) % 9) + 1;
  while (luckyNumbers.includes(extra)) {
    extra = (extra % 9) + 1;
  }
  luckyNumbers.push(extra);

  // 宜 / 忌
  const { advice: adviceCount, caution: cautionCount } = RATIO_COUNTS[rating];
  const advice = pickN(getAdvicePool(rating), adviceCount, rng);
  const caution = pickN(CAUTION_POOL, cautionCount, rng);

  // 日期串
  const date = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  return {
    date,
    zodiac: userZodiac,
    dayZodiac,
    rating,
    ratingColor: RATING_COLOR[rating],
    luckyColors,
    luckyNumbers,
    advice,
    caution,
    message: FORTUNE_MESSAGES[rating],
    relationship: describeRelation(relation.type, userZodiac, dayZodiac),
  };
}

// ===== AI 运势接口（复用现有 Supabase edge function）=====

/**
 * 调用现有 ancient-chat edge function 生成 AI 运势寄语。
 * 需要用户已登录（edge function 要求认证）。
 * 失败时返回 null，调用方应回退到本地寄语。
 *
 * @param birthYear  出生年
 * @param birthMonth 出生月
 * @param birthDay   出生日
 * @param birthHour  出生时辰索引(0-11)，可选
 * @param accessToken Supabase access token
 */
export async function fetchAiFortuneMessage(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number | undefined,
  accessToken: string,
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pnbrlpsblvgkvbokvbkv.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_liBkYUhKjK0tWqoq5R-ZoQ_f4eeX6bo";

  const shichenStr = birthHour !== undefined ? SHICHEN_NAMES[birthHour] : "时辰不详";
  const now = new Date();
  const todayStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const zodiac = getZodiacFromBirthYear(birthYear);

  const prompt = `请作为一位精通命理的先生，根据以下信息给出今日运势寄语（限80字以内，古风文言）：

生辰：${birthYear}年${birthMonth}月${birthDay}日 ${shichenStr}
生肖：${zodiac}
今日：${todayStr}

请给出今日的运势总评和一句古风寄语，语气典雅简练。`;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ancient-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ancientId: "fortune",
        message: prompt,
        messages: [],
        ancient: {
          id: "fortune",
          name: "天机先生",
          dynasty: "宋",
          title: "命理先生",
          bio: "精通八字命理，善于推演每日运势",
          personality: "神秘睿智",
          speakingStyle: "古风文言",
          famousWorks: [],
          promptHint: "命理运势",
        },
      }),
    });
    const json = await res.json();
    if (json.success && json.data?.reply) {
      return json.data.reply as string;
    }
    return null;
  } catch {
    return null;
  }
}
