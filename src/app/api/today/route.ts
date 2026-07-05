/**
 * 古时月 —— 今日首页 API
 * GET /api/today
 *
 * 使用 lunar-javascript 库计算精准的农历、干支、五行、每日宜忌、节气等数据。
 * 无需外部 API Key，全部本地计算。
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
} from '@/lib/data'
import type { TodayData, ApiResponse } from '@/lib/types'

/**
 * GET /api/today
 * 返回今日综合数据
 */
export async function GET() {
  try {
    const now = new Date()
    const month = now.getMonth() + 1

    // ===== 使用 lunar-javascript 获取精准历法数据 =====
    const solar = Solar.fromDate(now)
    const lunar = solar.getLunar()

    // 农历日期字符串（如"丙午年五月十六"）
    const lunarDate = `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`

    // 干支纪日
    const dayGanZhi = lunar.getDayInGanZhi()

    // 五行：取日干的天干对应五行
    const dayGan = lunar.getDayGan() // 天干（甲乙丙丁...）
    const TIANGAN_WUXING: Record<string, string> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
      '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    }
    const wuxing = TIANGAN_WUXING[dayGan] || '土'

    // 每日宜忌（来自 lunar-javascript 内置的黄历数据）
    const dayYi = lunar.getDayYi() // 宜（字符串数组）
    const dayJi = lunar.getDayJi() // 忌（字符串数组）

    // 节气：优先用 lunar-javascript 获取当前节气
    const jieqiFromLunar = lunar.getJieQi() // 当前节气名（如"夏至"）
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

    const data: TodayData = {
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

    return Response.json({ success: true, data } as ApiResponse<TodayData>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取今日数据失败',
      } as ApiResponse<TodayData>,
      { status: 500 }
    )
  }
}
