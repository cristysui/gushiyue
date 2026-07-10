/**
 * 古时月 —— 书阁古籍数据
 * 唐诗、宋词等经典古诗文集合
 */

export interface ClassicPoem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string;
  category: string;
  appreciation?: string;
}

export interface ClassicCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const classicCategories: ClassicCategory[] = [
  { id: "tangshi", name: "唐诗", description: "盛唐气象，千古绝唱", icon: "诗" },
  { id: "songci", name: "宋词", description: "婉约豪放，词苑千秋", icon: "词" },
  { id: "shijing", name: "诗经", description: "风雅颂，三百篇", icon: "经" },
  { id: "chuci", name: "楚辞", description: "屈子离骚，浪漫源头", icon: "骚" },
];

export const classicPoems: ClassicPoem[] = [
  // ===== 唐诗 =====
  {
    id: "ts-001",
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    category: "tangshi",
    content: "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。",
    appreciation: "这首诗写的是在寂静的月夜思念家乡的感受。短短四句，清新朴素，明白如话，却意味深长。",
  },
  {
    id: "ts-002",
    title: "春望",
    author: "杜甫",
    dynasty: "唐",
    category: "tangshi",
    content: "国破山河在，城春草木深。\n感时花溅泪，恨别鸟惊心。\n烽火连三月，家书抵万金。\n白头搔更短，浑欲不胜簪。",
    appreciation: "全篇忧国伤时，念家悲己，情感真挚深沉，是杜甫现实主义诗风的代表作。",
  },
  {
    id: "ts-003",
    title: "将进酒",
    author: "李白",
    dynasty: "唐",
    category: "tangshi",
    content: "君不见黄河之水天上来，奔流到海不复回。\n君不见高堂明镜悲白发，朝如青丝暮成雪。\n人生得意须尽欢，莫使金樽空对月。\n天生我材必有用，千金散尽还复来。",
    appreciation: "全诗情感奔放，气势豪迈，是李白诗歌艺术的巅峰之作。",
  },
  {
    id: "ts-004",
    title: "琵琶行（节选）",
    author: "白居易",
    dynasty: "唐",
    category: "tangshi",
    content: "大弦嘈嘈如急雨，小弦切切如私语。\n嘈嘈切切错杂弹，大珠小珠落玉盘。\n间关莺语花底滑，幽咽泉流冰下难。",
    appreciation: "以绝妙的比喻描写琵琶声，声情并茂，被誉为描写音乐的千古绝唱。",
  },
  {
    id: "ts-005",
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    category: "tangshi",
    content: "白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。",
    appreciation: "诗境壮阔，哲理深刻，是盛唐咏物诗中的不朽名篇。",
  },
  {
    id: "ts-006",
    title: "山居秋暝",
    author: "王维",
    dynasty: "唐",
    category: "tangshi",
    content: "空山新雨后，天气晚来秋。\n明月松间照，清泉石上流。\n竹喧归浣女，莲动下渔舟。\n随意春芳歇，王孙自可留。",
    appreciation: "诗中有画，画中有诗，是王维山水田园诗的代表作。",
  },
  {
    id: "ts-007",
    title: "无题·相见时难别亦难",
    author: "李商隐",
    dynasty: "唐",
    category: "tangshi",
    content: "相见时难别亦难，东风无力百花残。\n春蚕到死丝方尽，蜡炬成灰泪始干。\n晓镜但愁云鬓改，夜吟应觉月光寒。\n蓬山此去无多路，青鸟殷勤为探看。",
    appreciation: "以缠绵悱恻之笔写离别相思之情，意境朦胧而深情。",
  },
  {
    id: "ts-008",
    title: "枫桥夜泊",
    author: "张继",
    dynasty: "唐",
    category: "tangshi",
    content: "月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。",
    appreciation: "全诗有声有色，情景交融，将旅人愁思与江南夜景融为一体。",
  },

  // ===== 宋词 =====
  {
    id: "sc-001",
    title: "水调歌头·明月几时有",
    author: "苏轼",
    dynasty: "宋",
    category: "songci",
    content: "明月几时有？把酒问青天。\n不知天上宫阙，今夕是何年。\n我欲乘风归去，又恐琼楼玉宇，高处不胜寒。\n起舞弄清影，何似在人间。\n\n转朱阁，低绮户，照无眠。\n不应有恨，何事长向别时圆？\n人有悲欢离合，月有阴晴圆缺，此事古难全。\n但愿人长久，千里共婵娟。",
    appreciation: "全词情感旷达洒脱，是中秋词中的千古绝唱。",
  },
  {
    id: "sc-002",
    title: "声声慢·寻寻觅觅",
    author: "李清照",
    dynasty: "宋",
    category: "songci",
    content: "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。\n乍暖还寒时候，最难将息。\n三杯两盏淡酒，怎敌他、晚来风急？\n雁过也，正伤心，却是旧时相识。\n\n满地黄花堆积，憔悴损，如今有谁堪摘？\n守着窗儿，独自怎生得黑？\n梧桐更兼细雨，到黄昏、点点滴滴。\n这次第，怎一个愁字了得！",
    appreciation: "叠词连用，声情悲怆，是李清照晚年词作的代表作。",
  },
  {
    id: "sc-003",
    title: "念奴娇·赤壁怀古",
    author: "苏轼",
    dynasty: "宋",
    category: "songci",
    content: "大江东去，浪淘尽，千古风流人物。\n故垒西边，人道是，三国周郎赤壁。\n乱石穿空，惊涛拍岸，卷起千堆雪。\n江山如画，一时多少豪杰。\n\n遥想公瑾当年，小乔初嫁了，雄姿英发。\n羽扇纶巾，谈笑间，樯橹灰飞烟灭。\n故国神游，多情应笑我，早生华发。\n人生如梦，一尊还酹江月。",
    appreciation: "气象磅礴，境界宏大，是豪放词的巅峰之作。",
  },
  {
    id: "sc-004",
    title: "雨霖铃·寒蝉凄切",
    author: "柳永",
    dynasty: "宋",
    category: "songci",
    content: "寒蝉凄切，对长亭晚，骤雨初歇。\n都门帐饮无绪，留恋处，兰舟催发。\n执手相看泪眼，竟无语凝噎。\n念去去，千里烟波，暮霭沉沉楚天阔。\n\n多情自古伤离别，更那堪，冷落清秋节！\n今宵酒醒何处？杨柳岸，晓风残月。\n此去经年，应是良辰好景虚设。\n便纵有千种风情，更与何人说？",
    appreciation: "婉约词的代表作，写尽离愁别绪，情景交融。",
  },
  {
    id: "sc-005",
    title: "虞美人·春花秋月何时了",
    author: "李煜",
    dynasty: "五代",
    category: "songci",
    content: "春花秋月何时了？往事知多少。\n小楼昨夜又东风，故国不堪回首月明中。\n\n雕栏玉砌应犹在，只是朱颜改。\n问君能有几多愁？恰似一江春水向东流。",
    appreciation: "以水喻愁，千古名句，是李煜亡国后的绝命词。",
  },
  {
    id: "sc-006",
    title: "满江红·写怀",
    author: "岳飞",
    dynasty: "宋",
    category: "songci",
    content: "怒发冲冠，凭栏处、潇潇雨歇。\n抬望眼，仰天长啸，壮怀激烈。\n三十功名尘与土，八千里路云和月。\n莫等闲，白了少年头，空悲切！\n\n靖康耻，犹未雪。臣子恨，何时灭！\n驾长车，踏破贺兰山缺。\n壮志饥餐胡虏肉，笑谈渴饮匈奴血。\n待从头、收拾旧山河，朝天阙。",
    appreciation: "慷慨激昂，忠愤之气溢于言表，是爱国词的代表作。",
  },

  // ===== 诗经 =====
  {
    id: "sj-001",
    title: "关雎",
    author: "佚名",
    dynasty: "周",
    category: "shijing",
    content: "关关雎鸠，在河之洲。\n窈窕淑女，君子好逑。\n参差荇菜，左右流之。\n窈窕淑女，寤寐求之。\n求之不得，寤寐思服。\n悠哉悠哉，辗转反侧。",
    appreciation: "《诗经》首篇，写男女之情，温婉含蓄，为千古情诗之祖。",
  },
  {
    id: "sj-002",
    title: "蒹葭",
    author: "佚名",
    dynasty: "周",
    category: "shijing",
    content: "蒹葭苍苍，白露为霜。\n所谓伊人，在水一方。\n溯洄从之，道阻且长。\n溯游从之，宛在水中央。",
    appreciation: "朦胧空灵的意境，被誉为中国诗歌中最美的追寻之诗。",
  },
  {
    id: "sj-003",
    title: "桃夭",
    author: "佚名",
    dynasty: "周",
    category: "shijing",
    content: "桃之夭夭，灼灼其华。\n之子于归，宜其室家。\n桃之夭夭，有蕡其实。\n之子于归，宜其家室。",
    appreciation: "以桃花喻新娘之美，是古代贺婚诗的代表。",
  },

  // ===== 楚辞 =====
  {
    id: "cc-001",
    title: "离骚（节选）",
    author: "屈原",
    dynasty: "战国",
    category: "chuci",
    content: "帝高阳之苗裔兮，朕皇考曰伯庸。\n路漫漫其修远兮，吾将上下而求索。\n亦余心之所善兮，虽九死其犹未悔。\n日月忽其不淹兮，春与秋其代序。",
    appreciation: "中国浪漫主义文学的源头，屈原忠贞不渝的人格写照。",
  },
  {
    id: "cc-002",
    title: "九歌·湘夫人（节选）",
    author: "屈原",
    dynasty: "战国",
    category: "chuci",
    content: "帝子降兮北渚，目眇眇兮愁予。\n袅袅兮秋风，洞庭波兮木叶下。\n登白薠兮骋望，与佳期兮夕张。",
    appreciation: "以神话入诗，意境幽远，是楚辞中最美的篇章之一。",
  },
];
