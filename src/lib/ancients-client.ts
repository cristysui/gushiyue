/**
 * 古时月 —— 客户端古人数据
 * 将原 /api/ancient/random 的服务端逻辑移到前端。
 */

import ancientsData from '@/data/ancients.json'
import type { Ancient } from './types'

const ancients = ancientsData as unknown as Ancient[]

/**
 * 获取随机古人角色
 */
export function getRandomAncientClient(): Ancient {
  return ancients[Math.floor(Math.random() * ancients.length)]
}

/**
 * 根据 id 获取古人角色
 */
export function getAncientByIdClient(id: string): Ancient | null {
  return ancients.find((a) => a.id === id) ?? null
}

/**
 * 获取所有古人列表
 */
export function getAllAncientsClient(): Ancient[] {
  return ancients
}
