/**
 * 古时月 —— 古人对话 API
 * POST /api/ancient/chat
 *
 * 请求体：{ ancientId: string, message: string, messages?: ChatMessage[] }
 * 返回：{ reply: string }
 *
 * 对话逻辑：
 *   1. 若配置了 AI_API_KEY，调用大模型 API（如 DeepSeek）生成回复
 *      —— 以古人身份构建 system prompt，注入性格、生平、说话风格等信息
 *   2. 未配置或调用失败时，降级为模拟回复
 *      —— 从该古人的名句库中随机选取一句，结合用户消息生成上下文回复
 */

import { getAncientById } from '@/lib/data'
import { env } from '@/lib/env'
import type { ApiResponse, ChatMessage, Ancient } from '@/lib/types'

// ============ 模拟回复名句库 ============

/**
 * 古人名句库（按 id 索引）
 * 用于未配置大模型 API 时的模拟对话回复
 */
const ANCIENT_QUOTES: Record<string, string[]> = {
  libai: [
    '举杯邀明月，对影成三人。',
    '天生我材必有用，千金散尽还复来。',
    '长风破浪会有时，直挂云帆济沧海。',
    '抽刀断水水更流，举杯消愁愁更愁。',
    '两岸猿声啼不住，轻舟已过万重山。',
    '花间一壶酒，独酌无相亲。',
    '云想衣裳花想容，春风拂槛露华浓。',
  ],
  dufu: [
    '会当凌绝顶，一览众山小。',
    '国破山河在，城春草木深。',
    '无边落木萧萧下，不尽长江滚滚来。',
    '安得广厦千万间，大庇天下寒士俱欢颜。',
    '感时花溅泪，恨别鸟惊心。',
    '读书破万卷，下笔如有神。',
  ],
  sushi: [
    '但愿人长久，千里共婵娟。',
    '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。',
    '大江东去，浪淘尽，千古风流人物。',
    '不识庐山真面目，只缘身在此山中。',
    '人间有味是清欢。',
    '回首向来萧瑟处，归去，也无风雨也无晴。',
  ],
  wangwei: [
    '独在异乡为异客，每逢佳节倍思亲。',
    '空山新雨后，天气晚来秋。',
    '行到水穷处，坐看云起时。',
    '明月松间照，清泉石上流。',
    '大漠孤烟直，长河落日圆。',
    '红豆生南国，春来发几枝。',
  ],
  liqingzhao: [
    '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。',
    '知否，知否？应是绿肥红瘦。',
    '莫道不销魂，帘卷西风，人比黄花瘦。',
    '生当作人杰，死亦为鬼雄。',
    '此情无计可消除，才下眉头，却上心头。',
    '花自飘零水自流，一种相思，两处闲愁。',
  ],
  baijuyi: [
    '同是天涯沦落人，相逢何必曾相识。',
    '野火烧不尽，春风吹又生。',
    '在天愿作比翼鸟，在地愿为连理枝。',
    '人间四月芳菲尽，山寺桃花始盛开。',
    '晚来天欲雪，能饮一杯无？',
  ],
  xinqiji: [
    '众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。',
    '少年不识愁滋味，爱上层楼。',
    '醉里挑灯看剑，梦回吹角连营。',
    '青山遮不住，毕竟东流去。',
  ],
  taoyuanming: [
    '采菊东篱下，悠然见南山。',
    '久在樊笼里，复得返自然。',
    '衣沾不足惜，但使愿无违。',
    '此中有真意，欲辨已忘言。',
  ],
}

/** 模拟回复的开场白 */
const OPENINGS = [
  '善哉，汝之所言，令吾感慨万千。',
  '汝之所问，正合吾意。',
  '且听吾道来。',
  '吾观汝之所思，颇有诗意。',
  '妙哉妙哉，容吾一述。',
  '汝言甚善，吾有一语相赠。',
]

/**
 * 生成模拟回复
 * 根据古人 id 从名句库中随机选取一句，结合用户消息内容拼装回复
 */
function generateMockReply(ancientId: string, ancientName: string, message: string): string {
  const quotes = ANCIENT_QUOTES[ancientId]
  const opening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)]
  // 截取用户消息前 20 字，避免回复过长
  const snippet = message.length > 20 ? message.slice(0, 20) + '……' : message

  if (quotes && quotes.length > 0) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    return `${opening} 汝言「${snippet}」，吾有一句相赠：${quote}`
  }

  // 无专属名句时的通用回复
  return `${opening} 汝言「${snippet}」，吾${ancientName}虽才疏学浅，愿与汝共赏此情此景。`
}

// ============ 大模型 API 调用 ============

/**
 * 调用大模型 API 生成古人风格的回复
 * 兼容 OpenAI / DeepSeek 等遵循 OpenAI 接口规范的服务
 */
async function callAiApi(
  ancient: Ancient,
  messages: ChatMessage[],
  message: string
): Promise<string> {
  // 构建 system prompt：注入古人的身份、性格、生平与说话风格
  const systemPrompt = `你现在是${ancient.name}，${ancient.dynasty}代${ancient.title}。
性格：${ancient.personality}
生平：${ancient.bio}
代表作品：${ancient.famousWorks.join('、')}
说话风格：${ancient.speakingStyle}
${ancient.promptHint}

请以${ancient.name}的口吻和身份回答用户的问题。要求：
1. 语言风格符合古人的身份和时代特征，使用文言或半文言
2. 适当引用自己的诗词作品
3. 回答要有文化底蕴和诗意
4. 保持角色一致性，不要出戏
5. 回答简洁有韵味，不宜过长`

  // 组装消息列表：system + 历史对话 + 当前消息
  // 将前端 role 映射为 OpenAI 格式：user → user, ancient → assistant
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === 'ancient' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const res = await fetch(env.AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages: apiMessages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    throw new Error(`AI API 请求失败：${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  // 兼容 OpenAI 标准返回格式
  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI API 返回内容为空')
  }
  return content
}

// ============ 路由处理 ============

/** 对话返回数据类型 */
interface ChatReply {
  reply: string
  source: 'ai' | 'mock' // 标记回复来源：大模型或模拟
}

/**
 * POST /api/ancient/chat
 * 与指定古人进行对话
 *
 * 请求体：{ ancientId, message, messages? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ancientId, message, messages } = body as {
      ancientId: string
      message: string
      messages?: ChatMessage[]
    }

    // 参数校验
    if (!ancientId || !message) {
      return Response.json(
        { success: false, error: '缺少 ancientId 或 message 参数' } as ApiResponse<ChatReply>,
        { status: 400 }
      )
    }

    // 查找古人角色
    const ancient = getAncientById(ancientId)
    if (!ancient) {
      return Response.json(
        { success: false, error: '未找到该古人角色' } as ApiResponse<ChatReply>,
        { status: 404 }
      )
    }

    let reply: string
    let source: 'ai' | 'mock'

    if (env.AI_API_KEY) {
      // 已配置大模型 Key，调用 AI 生成回复
      try {
        reply = await callAiApi(ancient, messages ?? [], message)
        source = 'ai'
      } catch {
        // AI 调用失败时降级为模拟回复
        reply = generateMockReply(ancientId, ancient.name, message)
        source = 'mock'
      }
    } else {
      // 未配置 AI Key，直接使用模拟回复
      reply = generateMockReply(ancientId, ancient.name, message)
      source = 'mock'
    }

    return Response.json({
      success: true,
      data: { reply, source },
    } as ApiResponse<ChatReply>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '对话请求失败',
      } as ApiResponse<ChatReply>,
      { status: 500 }
    )
  }
}
