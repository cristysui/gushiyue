/**
 * 古时月 —— 环境变量配置
 * 统一管理所有外部服务密钥与配置项，便于全局引用。
 *
 * 可在项目根目录创建 .env.local 文件配置以下变量：
 *   JUHE_KEY       —— 聚合数据 API Key（用于真实黄历数据）
 *   TIANAPI_KEY    —— 天行数据 API Key（备用数据源）
 *   AI_API_KEY     —— 大模型 API Key（如 DeepSeek）
 *   AI_API_URL     —— 大模型接口地址
 *   AI_MODEL       —— 大模型名称
 */

export const env = {
  // 聚合数据 Key（黄历 / 历法数据）
  JUHE_KEY: process.env.JUHE_KEY || '',
  // 天行数据 Key（备用数据源）
  TIANAPI_KEY: process.env.TIANAPI_KEY || '',
  // 大模型 API Key（用于古人对话）
  AI_API_KEY: process.env.AI_API_KEY || '',
  // 大模型接口地址（默认 DeepSeek）
  AI_API_URL: process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions',
  // 大模型名称
  AI_MODEL: process.env.AI_MODEL || 'deepseek-chat',
}
