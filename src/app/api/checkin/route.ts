/**
 * 古时月 —— 节气打卡 API
 * POST /api/checkin  — 提交打卡
 * GET  /api/checkin  — 查询打卡历史
 *
 * 需要 Supabase 已配置且用户已登录
 */

import { getServerClient, isSupabaseConfigured } from '@/lib/supabase'
import type { ApiResponse } from '@/lib/types'

/**
 * POST /api/checkin
 * 提交一次节气打卡
 * 请求体：{ jieqi, activities?, note? }
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json(
        { success: false, error: 'Supabase 尚未配置' } as ApiResponse<never>,
        { status: 503 }
      )
    }

    const supabase = getServerClient()!
    const body = await request.json()
    const { jieqi, activities, note } = body as {
      jieqi: string
      activities?: string[]
      note?: string
    }

    if (!jieqi) {
      return Response.json(
        { success: false, error: '缺少节气名称' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // 从请求头获取用户 token（前端通过 Supabase Auth 登录后传入）
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json(
        { success: false, error: '请先登录' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json(
        { success: false, error: '用户认证失败' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        jieqi,
        activities: activities || [],
        note: note || null,
      })
      .select()
      .single()

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
        error: error instanceof Error ? error.message : '打卡失败',
      } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * GET /api/checkin
 * 查询当前用户的打卡历史
 */
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json(
        { success: false, error: 'Supabase 尚未配置' } as ApiResponse<never>,
        { status: 503 }
      )
    }

    const supabase = getServerClient()!
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json(
        { success: false, error: '请先登录' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json(
        { success: false, error: '用户认证失败' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

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
