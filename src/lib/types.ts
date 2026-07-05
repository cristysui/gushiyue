/**
 * 古时月 —— TypeScript 类型定义
 * 定义项目中所有数据接口，供 API 路由与前端组件共用。
 */

// 节气生活方案：包含单个节气的民俗、活动、饮食、诗词等信息
export interface JieqiPlan {
  name: string; // 节气名称，如「立春」
  period: string; // 时间段说明，如「2月3日-5日」
  intro: string; // 节气简介
  customs: string[]; // 民俗习俗列表
  activities: string[]; // 推荐活动列表
  foods: string[]; // 时令饮食列表
  poetry: { title: string; author: string; content: string }[]; // 相关诗词
}

// 十二时辰：对应古代一日十二时段的作息建议
export interface Shichen {
  name: string; // 时辰名称，如「子时」
  time: string; // 对应现代时间，如「23:00-01:00」
  meridian: string; // 当令经脉，如「胆经」
  activity: string; // 推荐活动
  suitable: string[]; // 适宜之事
  avoid: string[]; // 不宜之事
}

// 今日综合数据（/api/today 返回类型）
export interface TodayData {
  date: string; // 公历日期
  lunarDate: string; // 农历日期 / 干支纪日
  jieqi: string; // 当前节气名称
  jieqiInfo: JieqiPlan | null; // 当前节气详细方案
  wuxing: string; // 今日五行（金/木/水/火/土）
  todayYi: string[]; // 今日宜
  todayJi: string[]; // 今日忌
  recommendedColors: { name: string; hex: string }[]; // 五行推荐颜色
  seasonalVegetables: string[]; // 当月时令蔬菜
  seasonalFruits: string[]; // 当月时令水果
  flowers: string[]; // 当月花卉
  currentShichen: Shichen; // 当前时辰
  dailyPoem: { title: string; author: string; content: string }; // 每日一诗
}

// 古人角色：用于「与古人对话」功能
export interface Ancient {
  id: string; // 唯一标识，如「libai」
  name: string; // 姓名，如「李白」
  dynasty: string; // 朝代，如「唐」
  birthYear: string; // 生卒年，如「701-762」
  title: string; // 称号，如「诗仙」
  personality: string; // 性格特点
  bio: string; // 生平简介
  famousWorks: string[]; // 代表作品列表
  speakingStyle: string; // 说话风格
  promptHint: string; // AI 提示词补充说明
}

// 对话消息：与古人对话的单条消息
export interface ChatMessage {
  role: 'user' | 'ancient'; // 发送角色：user=用户，ancient=古人
  content: string; // 消息内容
  timestamp?: string; // 时间戳（可选）
}

// 统一 API 响应格式
export interface ApiResponse<T> {
  success: boolean; // 是否成功
  data?: T; // 返回数据
  error?: string; // 错误信息
}
