/**
 * 古时月 —— Supabase 客户端
 * 用于用户数据持久化（打卡记录、对话历史等）
 *
 * 需在 .env.local 中配置：
 *   NEXT_PUBLIC_SUPABASE_URL   —— Supabase 项目 URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY —— Supabase 匿名 Key
 *   SUPABASE_SERVICE_ROLE_KEY  —— Supabase 服务端 Key（仅服务端使用）
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * 浏览器端客户端（使用 anon key，受 RLS 策略保护）
 */
let browserClient: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

/**
 * 服务端客户端（使用 service role key，绕过 RLS）
 * 仅在 API Routes 中使用，不可暴露给前端
 */
let serverClient: SupabaseClient | null = null

export function getServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseServiceKey)
  }
  return serverClient
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}
