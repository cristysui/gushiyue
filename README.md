# 古时月

> 用古人的智慧，照亮当下的生活

TRAE AI 创造力大赛 2026 参赛项目 —— 一款帮你好好生活和了解中国传统文化的跨平台应用。

## 快速开始

```bash
# 安装依赖
npm install

# 复制环境变量配置（可选，不配置也能用模拟数据运行）
cp .env.example .env.local

# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

## 功能概览

### Tab 1：今日
每天打开就能看到专属信息：
- 今日五行属性 + 推荐穿戴颜色（传统色）
- 今日宜/忌
- 当前节气 + 节气生活方案（民俗、宜做、饮食）
- 时令蔬果（按月份）
- 当月盛开花卉
- 当前时辰 + 古人此时在做什么
- 每日一诗

### Tab 2：古人
每天随机一位古人以穿越者身份来到"今天"：
- 查看古人正在做什么（根据当前时辰）
- 发送文字给古人，他会从自己的视角回复
- 一键换一位古人

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（服务端）
│   │   ├── today/         # GET /api/today — 今日综合数据
│   │   └── ancient/       # 古人相关 API
│   │       ├── random/    # GET — 随机古人
│   │       └── chat/      # POST — 古人对话
│   ├── page.tsx           # 首页（今日 Tab）
│   └── ancient/page.tsx   # 古人对话 Tab
├── components/             # React 组件
├── data/                   # JSON 数据文件
│   ├── jieqi-plans.json   # 二十四节气生活方案
│   ├── shichen.json       # 十二时辰作息表
│   ├── seasonal-food.json # 时令蔬果表
│   ├── flowers.json       # 花卉花期表
│   ├── chinese-colors.json# 中国传统色库
│   ├── wuxing-colors.json # 五行对应颜色
│   └── ancients.json      # 古人角色库（12位）
└── lib/                    # 工具函数
    ├── types.ts           # TypeScript 类型定义
    ├── data.ts            # 数据加载工具
    └── env.ts             # 环境变量配置
```

## 环境变量

所有环境变量都是可选的，不配置时使用模拟数据：

| 变量 | 用途 | 申请地址 |
|------|------|---------|
| `JUHE_KEY` | 聚合数据（真实黄历/节气） | https://www.juhe.cn/ |
| `AI_API_KEY` | 大模型 API（古人对话） | https://platform.deepseek.com/ |
| `AI_API_URL` | AI 接口地址 | 默认 DeepSeek |
| `AI_MODEL` | 模型名称 | 默认 deepseek-chat |

## 技术栈

- **框架**: Next.js 16 (App Router + Turbopack)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **数据**: 本地 JSON 文件 + 外部 API（可选）
- **AI**: DeepSeek / OpenAI 兼容接口（可选）

## 开发计划

- [x] 项目搭建 + 核心数据
- [x] 今日首页（节气、五行、宜忌、蔬果、花卉、时辰、诗词）
- [x] 古人对话（随机古人 + 模拟回复）
- [ ] 接入真实 AI 模型（配置 AI_API_KEY 即可）
- [ ] 接入真实黄历 API（配置 JUHE_KEY 即可）
- [ ] Supabase 用户数据持久化
- [ ] 移动端（React Native）
- [ ] 拍照匹配诗词功能
