/**
 * 古时月 —— 客户端 Supabase 数据操作
 * 对话历史和打卡记录直连 Supabase，通过 RLS 策略保护数据安全。
 * 替代原 /api/history 和 /api/checkin 服务端 API。
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ===== 对话历史 =====

export interface ChatHistoryRecord {
  id: string
  user_id: string
  ancient_id: string
  role: 'user' | 'ancient'
  content: string
  source: string
  created_at: string
}

/**
 * 查询与某位古人的对话历史
 */
export async function fetchChatHistory(
  client: SupabaseClient,
  ancientId: string
): Promise<ChatHistoryRecord[]> {
  const { data, error } = await client
    .from('chat_history')
    .select('*')
    .eq('ancient_id', ancientId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return []
  return (data || []) as ChatHistoryRecord[]
}

/**
 * 查询当前用户的所有对话历史（用于笔记模块）
 */
export async function fetchAllChatHistory(
  client: SupabaseClient
): Promise<ChatHistoryRecord[]> {
  const { data, error } = await client
    .from('chat_history')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1000)

  if (error) return []
  return (data || []) as ChatHistoryRecord[]
}

/**
 * 保存一条对话消息
 */
export async function saveChatMessage(
  client: SupabaseClient,
  ancientId: string,
  role: 'user' | 'ancient',
  content: string,
  source: string
): Promise<boolean> {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return false

  const { error } = await client.from('chat_history').insert({
    user_id: user.id,
    ancient_id: ancientId,
    role,
    content,
    source,
  })

  return !error
}

/**
 * 清空与某位古人的对话历史
 */
export async function clearChatHistory(
  client: SupabaseClient,
  ancientId: string
): Promise<boolean> {
  const { error } = await client
    .from('chat_history')
    .delete()
    .eq('ancient_id', ancientId)

  return !error
}

// ===== 节气打卡 =====

export interface CheckinRecord {
  id: string
  user_id: string
  jieqi: string
  activities: string[]
  note: string | null
  created_at: string
}

/**
 * 提交一次节气打卡
 */
export async function createCheckin(
  client: SupabaseClient,
  jieqi: string,
  activities?: string[],
  note?: string
): Promise<CheckinRecord | null> {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null

  const { data, error } = await client
    .from('checkins')
    .insert({
      user_id: user.id,
      jieqi,
      activities: activities || [],
      note: note || null,
    })
    .select()
    .single()

  if (error) return null
  return data as CheckinRecord
}

/**
 * 查询打卡历史
 */
export async function fetchCheckins(
  client: SupabaseClient
): Promise<CheckinRecord[]> {
  const { data, error } = await client
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  return (data || []) as CheckinRecord[]
}
