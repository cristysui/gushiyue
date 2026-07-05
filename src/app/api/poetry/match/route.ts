/**
 * 古时月 —— 诗词匹配 API
 * POST /api/poetry/match
 *
 * 请求体：{ scene: string }（场景描述文字）
 * 返回：{ poems: Poem[] }（匹配的诗词列表）
 *
 * 匹配逻辑：
 *   1. 将用户输入的场景描述与内置主题关键词进行比对，识别主题（春/夏/秋/冬/月/雨/雪/思乡等）
 *   2. 从内置诗词库中按主题选取匹配诗词
 *   3. 从节气方案数据中检索标题或内容包含相关字词的诗词
 *   4. 合并去重后返回
 */

import { getAllJieqiPlans } from '@/lib/data'
import type { ApiResponse } from '@/lib/types'

/** 诗词类型 */
interface Poem {
  title: string
  author: string
  content: string
  theme?: string // 匹配到的主题
}

/** 匹配结果 */
interface MatchResult {
  poems: Poem[]
}

/**
 * 场景主题与关键词映射
 * 每个主题对应一组触发关键词，命中任一关键词即归入该主题
 */
const SCENE_KEYWORDS: Record<string, string[]> = {
  春: ['春', '花开', '踏青', '春风', '春雨', '春色', '柳', '桃', '播种', '万物生'],
  夏: ['夏', '荷', '蝉', '炎热', '夏夜', '盛夏', '暑', '萤火', '纳凉'],
  秋: ['秋', '落叶', '秋月', '秋风', '秋思', '霜', '菊', '桂', '丰收', '登高'],
  冬: ['冬', '雪', '寒', '梅', '冬至', '冬日', '凛冽', '围炉', '冰'],
  月: ['月', '月亮', '明月', '月光', '月色', '赏月', '嫦娥', '中秋'],
  雨: ['雨', '下雨', '细雨', '暴雨', '听雨', '梅雨', '烟雨'],
  雪: ['雪', '下雪', '飞雪', '白雪', '冰雪', '踏雪'],
  思乡: ['思乡', '故乡', '家乡', '归家', '客居', '漂泊', '游子', '乡愁'],
  离别: ['离别', '送别', '分手', '远行', '赠别', '折柳', '长亭'],
  爱情: ['爱情', '相思', '思念', '想念', '情', '红豆', '姻缘'],
  饮酒: ['酒', '饮酒', '醉', '杯', '酌', '酿酒', '对饮'],
  山水: ['山', '水', '山水', '风景', '游历', '登高', '江河', '湖', '溪'],
  人生: ['人生', '感悟', '岁月', '时光', '年华', '命运', '豁达'],
  友情: ['友情', '朋友', '知己', '故人', '相聚', '重逢'],
}

/**
 * 内置诗词库（按主题分类）
 * 提供常见场景的经典诗词，作为匹配结果的主力来源
 */
const BUILTIN_POEMS: Record<string, Poem[]> = {
  春: [
    { title: '春晓', author: '孟浩然', content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。' },
    { title: '咏柳', author: '贺知章', content: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。' },
    { title: '钱塘湖春行', author: '白居易', content: '几处早莺争暖树，谁家新燕啄春泥。乱花渐欲迷人眼，浅草才能没马蹄。' },
    { title: '春夜喜雨', author: '杜甫', content: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。' },
  ],
  夏: [
    { title: '小池', author: '杨万里', content: '小荷才露尖尖角，早有蜻蜓立上头。' },
    { title: '晓出净慈寺送林子方', author: '杨万里', content: '接天莲叶无穷碧，映日荷花别样红。' },
    { title: '山亭夏日', author: '高骈', content: '绿树阴浓夏日长，楼台倒影入池塘。水晶帘动微风起，满架蔷薇一院香。' },
  ],
  秋: [
    { title: '山行', author: '杜牧', content: '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。' },
    { title: '秋词', author: '刘禹锡', content: '自古逢秋悲寂寥，我言秋日胜春朝。晴空一鹤排云上，便引诗情到碧霄。' },
    { title: '天净沙·秋思', author: '马致远', content: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。' },
  ],
  冬: [
    { title: '江雪', author: '柳宗元', content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。' },
    { title: '梅花', author: '王安石', content: '墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。' },
    { title: '白雪歌送武判官归京', author: '岑参', content: '忽如一夜春风来，千树万树梨花开。' },
  ],
  月: [
    { title: '静夜思', author: '李白', content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
    { title: '水调歌头·明月几时有', author: '苏轼', content: '明月几时有？把酒问青天。但愿人长久，千里共婵娟。' },
    { title: '望月怀远', author: '张九龄', content: '海上生明月，天涯共此时。情人怨遥夜，竟夕起相思。' },
  ],
  雨: [
    { title: '春夜喜雨', author: '杜甫', content: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。' },
    { title: '渔歌子', author: '张志和', content: '青箬笠，绿蓑衣，斜风细雨不须归。' },
    { title: '声声慢', author: '李清照', content: '梧桐更兼细雨，到黄昏、点点滴滴。这次第，怎一个愁字了得！' },
  ],
  雪: [
    { title: '江雪', author: '柳宗元', content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。' },
    { title: '夜雪', author: '白居易', content: '已讶衾枕冷，复见窗户明。夜深知雪重，时闻折竹声。' },
    { title: '问刘十九', author: '白居易', content: '绿蚁新醅酒，红泥小火炉。晚来天欲雪，能饮一杯无？' },
  ],
  思乡: [
    { title: '静夜思', author: '李白', content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。' },
    { title: '九月九日忆山东兄弟', author: '王维', content: '独在异乡为异客，每逢佳节倍思亲。' },
    { title: '泊船瓜洲', author: '王安石', content: '春风又绿江南岸，明月何时照我还。' },
  ],
  离别: [
    { title: '送杜少府之任蜀州', author: '王勃', content: '海内存知己，天涯若比邻。' },
    { title: '赠汪伦', author: '李白', content: '桃花潭水深千尺，不及汪伦送我情。' },
    { title: '别董大', author: '高适', content: '莫愁前路无知己，天下谁人不识君。' },
  ],
  爱情: [
    { title: '相思', author: '王维', content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。' },
    { title: '一剪梅', author: '李清照', content: '此情无计可消除，才下眉头，却上心头。' },
    { title: '无题', author: '李商隐', content: '春蚕到死丝方尽，蜡炬成灰泪始干。' },
  ],
  饮酒: [
    { title: '将进酒', author: '李白', content: '人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。' },
    { title: '问刘十九', author: '白居易', content: '绿蚁新醅酒，红泥小火炉。晚来天欲雪，能饮一杯无？' },
    { title: '月下独酌', author: '李白', content: '花间一壶酒，独酌无相亲。举杯邀明月，对影成三人。' },
  ],
  山水: [
    { title: '望庐山瀑布', author: '李白', content: '飞流直下三千尺，疑是银河落九天。' },
    { title: '望岳', author: '杜甫', content: '会当凌绝顶，一览众山小。' },
    { title: '饮湖上初晴后雨', author: '苏轼', content: '水光潋滟晴方好，山色空蒙雨亦奇。' },
  ],
  人生: [
    { title: '定风波', author: '苏轼', content: '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。回首向来萧瑟处，归去，也无风雨也无晴。' },
    { title: '登鹳雀楼', author: '王之涣', content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。' },
    { title: '长歌行', author: '佚名', content: '少壮不努力，老大徒伤悲。' },
  ],
  友情: [
    { title: '送杜少府之任蜀州', author: '王勃', content: '海内存知己，天涯若比邻。' },
    { title: '赠汪伦', author: '李白', content: '桃花潭水深千尺，不及汪伦送我情。' },
    { title: '芙蓉楼送辛渐', author: '王昌龄', content: '洛阳亲友如相问，一片冰心在玉壶。' },
  ],
}

/**
 * 根据场景描述识别匹配的主题
 *
 * @param scene 场景描述文字
 * @returns 匹配到的主题数组
 */
function matchThemes(scene: string): string[] {
  const matched: string[] = []
  for (const [theme, keywords] of Object.entries(SCENE_KEYWORDS)) {
    if (keywords.some((kw) => scene.includes(kw))) {
      matched.push(theme)
    }
  }
  return matched
}

/**
 * 从节气方案数据中检索匹配的诗词
 * 当标题或内容包含场景中的关键字时纳入结果
 *
 * @param scene 场景描述文字
 * @returns 匹配的诗词数组
 */
function searchPoemsFromJieqi(scene: string): Poem[] {
  const plans = getAllJieqiPlans()
  const results: Poem[] = []
  for (const plan of plans) {
    if (!Array.isArray(plan.poetry)) continue
    for (const poem of plan.poetry) {
      // 标题或内容包含场景关键词即匹配
      if (poem.title.includes(scene) || poem.content.includes(scene)) {
        results.push({ ...poem, theme: plan.name })
      }
    }
  }
  return results
}

/**
 * 对诗词列表去重（以标题+作者为唯一键）
 */
function deduplicatePoems(poems: Poem[]): Poem[] {
  const seen = new Set<string>()
  const result: Poem[] = []
  for (const poem of poems) {
    const key = `${poem.title}-${poem.author}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(poem)
    }
  }
  return result
}

/**
 * POST /api/poetry/match
 * 根据场景描述匹配诗词
 *
 * 请求体：{ scene: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scene } = body as { scene: string }

    // 参数校验
    if (!scene || typeof scene !== 'string') {
      return Response.json(
        { success: false, error: '缺少 scene 参数或参数格式不正确' } as ApiResponse<MatchResult>,
        { status: 400 }
      )
    }

    const trimmedScene = scene.trim()
    if (!trimmedScene) {
      return Response.json(
        { success: false, error: '场景描述不能为空' } as ApiResponse<MatchResult>,
        { status: 400 }
      )
    }

    // 1. 识别场景主题
    const themes = matchThemes(trimmedScene)

    // 2. 从内置诗词库按主题收集诗词
    const matchedPoems: Poem[] = []
    for (const theme of themes) {
      const poems = BUILTIN_POEMS[theme]
      if (poems) {
        matchedPoems.push(...poems.map((p) => ({ ...p, theme })))
      }
    }

    // 3. 从节气方案数据中检索包含关键词的诗词
    const jieqiPoems = searchPoemsFromJieqi(trimmedScene)

    // 4. 合并去重
    const allPoems = deduplicatePoems([...matchedPoems, ...jieqiPoems])

    // 5. 若无任何匹配，返回一首随机鼓励诗
    if (allPoems.length === 0) {
      // 尝试按场景中每个字宽泛匹配内置诗词
      for (const char of trimmedScene) {
        for (const [theme, poems] of Object.entries(BUILTIN_POEMS)) {
          const found = poems.find((p) => p.content.includes(char) || p.title.includes(char))
          if (found) {
            allPoems.push({ ...found, theme })
          }
        }
      }
    }

    return Response.json({
      success: true,
      data: { poems: deduplicatePoems(allPoems) },
    } as ApiResponse<MatchResult>)
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '诗词匹配失败',
      } as ApiResponse<MatchResult>,
      { status: 500 }
    )
  }
}
