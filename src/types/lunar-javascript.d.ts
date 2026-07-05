/**
 * lunar-javascript 类型声明
 * 该库未自带 TypeScript 类型声明，此处手动声明项目中用到的 API
 */

declare module 'lunar-javascript' {
  /** 农历对象 */
  export class Lunar {
    /** 年干支（如"丙午"） */
    getYearInGanZhi(): string
    /** 年生肖（如"马"） */
    getYearShengXiao(): string
    /** 农历月中文（如"五"） */
    getMonthInChinese(): string
    /** 农历日中文（如"十六"） */
    getDayInChinese(): string
    /** 日干支（如"甲子"） */
    getDayInGanZhi(): string
    /** 日天干（如"甲"） */
    getDayGan(): string
    /** 日地支（如"子"） */
    getDayZhi(): string
    /** 月干支 */
    getMonthInGanZhi(): string
    /** 每日宜（字符串数组） */
    getDayYi(): string[]
    /** 每日忌（字符串数组） */
    getDayJi(): string[]
    /** 当前节气名（如"夏至"），无则返回空字符串 */
    getJieQi(): string
    /** 获取所有节气信息 */
    getJieQiTable(): Record<string, string>
    /** 节气 */
    getJie(): string
    /** 气 */
    getQi(): string
    /** 当前日期所在节气 */
    getCurrentJieQi(): string
  }

  /** 阳历对象 */
  export class Solar {
    /** 从 Date 对象创建 Solar 实例 */
    static fromDate(date: Date): Solar
    /** 从年月日创建 Solar 实例 */
    static fromYmd(year: number, month: number, day: number): Solar
    /** 获取对应的农历对象 */
    getLunar(): Lunar
    /** 年 */
    getYear(): number
    /** 月 */
    getMonth(): number
    /** 日 */
    getDay(): number
    /** 星期（0=日, 1=一, ...） */
    getWeek(): number
  }
}
