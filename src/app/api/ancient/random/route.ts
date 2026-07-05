/**
 * 古时月 —— 随机古人 API
 * GET /api/ancient/random
 *
 * 返回一个随机的古人角色，用于「与古人对话」功能的角色选取。
 */

import { getRandomAncient } from '@/lib/data'
import type { ApiResponse, Ancient } from '@/lib/types'

/**
 * GET /api/ancient/random
 * 返回随机古人角色数据
 */
export async function GET() {
  try {
    const ancient = getRandomAncient()
    return Response.json({ success: true, data: ancient } as ApiResponse<Ancient>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取随机古人失败',
      } as ApiResponse<Ancient>,
      { status: 500 }
    )
  }
}
