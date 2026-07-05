/**
 * 古时月 —— 对话历史 API
 * GET    /api/history?ancient_id=xxx  — 查询与某位古人的对话历史
 * POST   /api/history                  — 保存一条对话消息
 * DELETE /api/history?ancient_id=xxx  — 清空与某位古人的对话历史
 *
 * 需要 Supabase 已配置且用户已登录
 */

import { getServerClient, isSupabaseConfigured } from '@/lib/supabase'
import type { ApiResponse } from '@/lib/types'

/**
 * 获取用户认证信息
 */
async function getAuthUser(request: Request, supabase: ReturnType<typeof getServerClient>) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase!.auth.getUser(token)
  return user
}

/**
 * GET /api/history?ancient_id=xxx
 * 查询对话历史
 */
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ success: true, data: [] } as ApiResponse<unknown[]>)
    }

    const supabase = getServerClient()!
    const user = await getAuthUser(request, supabase)
    if (!user) {
      return Response.json({ success: true, data: [] } as ApiResponse<unknown[]>)
    }

    const { searchParams } = new URL(request.url)
    const ancientId = searchParams.get('ancient_id')

    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(200)

    if (ancientId) {
      query = query.eq('ancient_id', ancientId)
    }

    const { data, error } = await query
    if (error) {
      return Response.json(
        { success: false, error: error.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return Response.json({ success: true, data } as ApiResponse<typeof data>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/history
 * 保存一条对话消息
 *
 * 请求体：{ ancientId, role, content, source }
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ success: true } as ApiResponse<never>)
    }

    const supabase = getServerClient()!
    const user = await getAuthUser(request, supabase)
    if (!user) {
      return Response.json(
        { success: false, error: '请先登录' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ancientId, role, content, source } = body as {
      ancientId: string
      role: 'user' | 'ancient'
      content: string
      source?: string
    }

    // 参数校验
    if (!ancientId || !role || !content) {
      return Response.json(
        { success: false, error: '缺少必要参数' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    const { error } = await supabase.from('chat_history').insert({
      user_id: user.id,
      ancient_id: ancientId,
      role,
      content,
      source: source || 'ai',
    })

    if (error) {
      return Response.json(
        { success: false, error: error.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return Response.json({ success: true } as ApiResponse<never>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '保存失败',
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/history?ancient_id=xxx
 * 清空对话历史
 */
export async function DELETE(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ success: true } as ApiResponse<never>)
    }

    const supabase = getServerClient()!
    const user = await getAuthUser(request, supabase)
    if (!user) {
      return Response.json(
        { success: false, error: '请先登录' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ancientId = searchParams.get('ancient_id')

    let query = supabase.from('chat_history').delete().eq('user_id', user.id)
    if (ancientId) {
      query = query.eq('ancient_id', ancientId)
    }

    const { error } = await query
    if (error) {
      return Response.json(
        { success: false, error: error.message } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return Response.json({ success: true } as ApiResponse<never>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}
