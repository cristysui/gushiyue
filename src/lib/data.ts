/**
 * 古时月 —— 数据加载工具
 * 从 @/data/ 目录加载 JSON 数据，并提供各类查询函数。
 *
 * 依赖的 JSON 数据文件（由另一模块创建）：
 *   @/data/jieqi-plans.json    —— 节气生活方案数组
 *   @/data/shichen.json        —— 十二时辰数组
 *   @/data/seasonal-food.json  —— 每月时令蔬果
 *   @/data/flowers.json        —— 每月花卉
 *   @/data/chinese-colors.json —— 中国传统色
 *   @/data/wuxing-colors.json  —— 五行对应颜色
 *   @/data/ancients.json       —— 古人角色数组
 */

import jieqiPlans from '@/data/jieqi-plans.json'
import shichenData from '@/data/shichen.json'
import seasonalFood from '@/data/seasonal-food.json'
import flowersData from '@/data/flowers.json'
import chineseColors from '@/data/chinese-colors.json'
import wuxingColors from '@/data/wuxing-colors.json'
import ancientsData from '@/data/ancients.json'
import type { JieqiPlan, Shichen, Ancient } from './types'

/**
 * 二十四节气及其近似开始日期（公历）
 * [节气名, 月份, 日]，按时间先后排列
 */
const JIEQI_DATES: [string, number, number][] = [
  ['小寒', 1, 6],
  ['大寒', 1, 20],
  ['立春', 2, 4],
  ['雨水', 2, 19],
  ['惊蛰', 3, 6],
  ['春分', 3, 21],
  ['清明', 4, 5],
  ['谷雨', 4, 20],
  ['立夏', 5, 6],
  ['小满', 5, 21],
  ['芒种', 6, 6],
  ['夏至', 6, 21],
  ['小暑', 7, 7],
  ['大暑', 7, 23],
  ['立秋', 8, 8],
  ['处暑', 8, 23],
  ['白露', 9, 8],
  ['秋分', 9, 23],
  ['寒露', 10, 8],
  ['霜降', 10, 24],
  ['立冬', 11, 7],
  ['小雪', 11, 22],
  ['大雪', 12, 7],
  ['冬至', 12, 22],
]

/**
 * 十二时辰名称（按时间顺序）
 * 子时为深夜 23:00 - 01:00，依次类推
 */
const SHICHEN_NAMES = [
  '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
  '午时', '未时', '申时', '酉时', '戌时', '亥时',
]

/**
 * 获取当前节气名称
 * 根据日期的月、日与二十四节气近似日期比对，
 * 返回当前日期所属的节气（即上一个已过的节气）。
 *
 * @param date 日期对象，默认为当前时间
 * @returns 节气名称，如「立春」
 */
export function getCurrentJieqi(date = new Date()): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  // 若在小寒（第一个节气）之前，则属于上一年的冬至
  let currentJieqi = '冬至'
  for (const [name, m, d] of JIEQI_DATES) {
    if (month > m || (month === m && day >= d)) {
      currentJieqi = name
    } else {
      // 日期已小于当前节气起始日，停止遍历
      break
    }
  }
  return currentJieqi
}

/**
 * 根据节气名获取对应的生活方案
 *
 * @param name 节气名称，如「立春」
 * @returns 节气方案对象，未找到时返回 null
 */
export function getJieqiPlan(name: string): JieqiPlan | null {
  const plans = jieqiPlans as unknown as JieqiPlan[]
  return plans.find((p) => p.name === name) ?? null
}

/**
 * 获取当前时辰
 * 根据当前小时判断所属时辰（子时 23-1 点，丑时 1-3 点……）
 *
 * 时辰索引计算公式：Math.floor(((hour + 1) % 24) / 2)
 *   - 23 点和 0 点 → 子时（索引 0）
 *   - 1 点和 2 点 → 丑时（索引 1）
 *   - 以此类推
 *
 * @param date 日期对象，默认为当前时间
 * @returns 当前时辰信息
 */
export function getCurrentShichen(date = new Date()): Shichen {
  const hour = date.getHours()
  // (hour + 1) % 24 再除以 2 取整，得到时辰在十二时辰中的序号
  const index = Math.floor(((hour + 1) % 24) / 2)
  const list = shichenData as unknown as Shichen[]
  // 优先按名称匹配，确保顺序不受 JSON 顺序影响
  const name = SHICHEN_NAMES[index]
  const matched = list.find((s) => s.name === name)
  return (
    matched ??
    list[index] ?? {
      name,
      time: '',
      meridian: '',
      activity: '',
      suitable: '',
      avoid: '',
    }
  )
}

/**
 * 获取当月时令蔬果
 * 兼容两种 JSON 结构：
 *   1. 以月份字符串为键的对象：{ "1": { vegetables: [...], fruits: [...] } }
 *   2. 数组形式：[{ month: 1, vegetables: [...], fruits: [...] }]
 *
 * @param month 月份（1-12，从 1 开始）
 * @returns { vegetables, fruits } 时令蔬菜与水果数组
 */
export function getSeasonalFood(month: number): { vegetables: string[]; fruits: string[] } {
  // 兼容中英文键名：蔬菜/vegetables、水果/fruits
  type RawEntry = Record<string, unknown>
  const data = seasonalFood as unknown as Record<string, RawEntry> | RawEntry[]

  /** 从原始条目中提取蔬果数据，兼容中英文键名 */
  function extract(entry: RawEntry | undefined): { vegetables: string[]; fruits: string[] } {
    if (!entry) return { vegetables: [], fruits: [] }
    const vegetables = (entry.vegetables ?? entry['蔬菜']) as string[] | undefined
    const fruits = (entry.fruits ?? entry['水果']) as string[] | undefined
    return {
      vegetables: Array.isArray(vegetables) ? vegetables : [],
      fruits: Array.isArray(fruits) ? fruits : [],
    }
  }

  // 数组形式
  if (Array.isArray(data)) {
    const entry = data.find((item) => item.month === month)
    return extract(entry)
  }
  // 对象形式（以月份字符串为键）
  return extract(data[String(month)])
}

/**
 * 获取当月花卉
 * 兼容两种 JSON 结构：
 *   1. 以月份字符串为键的对象：{ "1": ["梅花", ...] }
 *   2. 数组形式：[{ month: 1, flowers: [...] }]
 *
 * @param month 月份（1-12，从 1 开始）
 * @returns 当月花卉名称数组
 */
export function getFlowers(month: number): string[] {
  const data = flowersData as unknown as
    | Record<string, string[]>
    | Array<{ month: number; flowers: string[] }>

  // 数组形式
  if (Array.isArray(data)) {
    const entry = data.find((item) => item.month === month)
    return entry?.flowers ?? []
  }
  // 对象形式
  return data[String(month)] ?? []
}

/**
 * 五行转推荐颜色
 * 根据五行（金/木/水/火/土）返回对应的中国传统颜色列表
 *
 * @param wuxing 五行名称，如「木」
 * @returns 颜色名称数组
 */
export function getColorsByWuxing(wuxing: string): string[] {
  const data = wuxingColors as unknown as Record<string, { colors: string[]; direction: string; season: string }>
  return data[wuxing]?.colors ?? []
}

/**
 * 根据颜色名称查找传统色的 hex 值
 * @param name 颜色名称，如「月白」
 * @returns hex 色值，如「#F0FCFF」，未找到时返回灰色兜底
 */
export function getColorHex(name: string): string {
  const colors = chineseColors as unknown as Array<{ name: string; hex: string; pinyin: string; description: string }>
  return colors.find((c) => c.name === name)?.hex ?? '#CCCCCC'
}

/**
 * 获取随机古人角色
 *
 * @returns 随机一位古人
 */
export function getRandomAncient(): Ancient {
  const list = ancientsData as unknown as Ancient[]
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * 根据 id 获取古人角色
 *
 * @param id 古人唯一标识，如「libai」
 * @returns 古人对象，未找到时返回 null
 */
export function getAncientById(id: string): Ancient | null {
  const list = ancientsData as unknown as Ancient[]
  return list.find((a) => a.id === id) ?? null
}

/**
 * 获取随机诗词
 * 从所有节气方案中收集诗词，随机返回一首
 *
 * @returns { title, author, content } 诗词对象
 */
export function getRandomPoem(): { title: string; author: string; content: string } {
  const plans = jieqiPlans as unknown as JieqiPlan[]
  const allPoems: { title: string; author: string; content: string }[] = []
  for (const plan of plans) {
    if (Array.isArray(plan.poetry)) {
      allPoems.push(...plan.poetry)
    }
  }
  if (allPoems.length === 0) {
    return { title: '', author: '', content: '' }
  }
  return allPoems[Math.floor(Math.random() * allPoems.length)]
}

/**
 * 获取中国传统色列表
 *
 * @returns 中国传统色数据（原始 JSON 结构）
 */
export function getChineseColors() {
  return chineseColors
}

/**
 * 获取所有节气方案
 * 供诗词匹配等场景使用
 *
 * @returns 节气方案数组
 */
export function getAllJieqiPlans(): JieqiPlan[] {
  return jieqiPlans as unknown as JieqiPlan[]
}
