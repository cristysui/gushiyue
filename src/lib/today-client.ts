/**
 * 古时月 —— 客户端今日数据计算
 * 将原 /api/today 的服务端逻辑移到前端，使用 lunar-javascript 本地计算。
 * lunar-javascript 本身就是前端库，无需服务端。
 */

import { Solar } from 'lunar-javascript'
import {
  getCurrentJieqi,
  getJieqiPlan,
  getCurrentShichen,
  getSeasonalFood,
  getFlowers,
  getColorsByWuxing,
  getColorHex,
  getRandomPoem,
} from './data'
import type { TodayData } from './types'

/**
 * 根据时区获取当前本地时间的 Date 对象
 * 在浏览器中直接用 new Date() 即可（浏览器自带本地时区）
 */
function getLocalDate(): Date {
  return new Date()
}

/**
 * 计算今日综合数据（客户端版本）
 * 替代原 /api/today 服务端 API
 */
export function computeTodayData(): TodayData {
  const now = getLocalDate()
  const month = now.getMonth() + 1

  // ===== 使用 lunar-javascript 获取精准历法数据 =====
  const solar = Solar.fromDate(now)
  const lunar = solar.getLunar()

  // 农历日期字符串
  const lunarDate = `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

  // 五行：取日干的天干对应五行
  const dayGan = lunar.getDayGan()
  const TIANGAN_WUXING: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  }
  const wuxing = TIANGAN_WUXING[dayGan] || '土'

  // 每日宜忌
  const dayYi = lunar.getDayYi()
  const dayJi = lunar.getDayJi()

  // 节气
  const jieqiFromLunar = lunar.getJieQi()
  const jieqi = jieqiFromLunar || getCurrentJieqi(now)
  const jieqiInfo = getJieqiPlan(jieqi)

  // 时辰
  const currentShichen = getCurrentShichen(now)

  // 时令蔬果与花卉
  const seasonal = getSeasonalFood(month)
  const flowers = getFlowers(month)

  // 每日一诗
  const dailyPoem = getRandomPoem()

  // 五行推荐颜色
  const colorNames = getColorsByWuxing(wuxing)
  const recommendedColors = colorNames.map((name) => ({ name, hex: getColorHex(name) }))

  // 日期格式化
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  return {
    date: dateStr,
    lunarDate,
    jieqi,
    jieqiInfo,
    wuxing,
    todayYi: dayYi,
    todayJi: dayJi,
    recommendedColors,
    seasonalVegetables: seasonal.vegetables,
    seasonalFruits: seasonal.fruits,
    flowers,
    currentShichen,
    dailyPoem,
  }
}
