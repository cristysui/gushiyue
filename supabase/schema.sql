-- ===== 古时月 Supabase 数据库表结构 =====
-- 在 Supabase Dashboard 的 SQL Editor 中执行此文件

-- 1. 用户表（使用 Supabase Auth，此表存储额外用户信息）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  region TEXT DEFAULT '华东', -- 所在地区，用于时令蔬果推荐
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 节气打卡记录
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  jieqi TEXT NOT NULL, -- 节气名称
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities TEXT[] DEFAULT '{}', -- 今日完成的活动
  note TEXT, -- 打卡心得
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 古人对话历史
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ancient_id TEXT NOT NULL, -- 古人 ID
  role TEXT NOT NULL CHECK (role IN ('user', 'ancient')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'mock', -- 'ai' 或 'mock'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 用户收藏的诗词
CREATE TABLE IF NOT EXISTS public.favorite_poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'daily', -- 'daily' 或 'match'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 索引 =====
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.checkins(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history(user_id, ancient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_favorite_poems_user ON public.favorite_poems(user_id);

-- ===== RLS 策略（行级安全）=====
-- 用户只能访问自己的数据

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_poems ENABLE ROW LEVEL SECURITY;

-- profiles：用户可以查看和编辑自己的资料
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- checkins：用户可以管理自己的打卡记录
CREATE POLICY "Users can view own checkins" ON public.checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.checkins FOR DELETE USING (auth.uid() = user_id);

-- chat_history：用户可以管理自己的对话历史
CREATE POLICY "Users can view own chats" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.chat_history FOR DELETE USING (auth.uid() = user_id);

-- favorite_poems：用户可以管理自己的收藏
CREATE POLICY "Users can view own favorites" ON public.favorite_poems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorite_poems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorite_poems FOR DELETE USING (auth.uid() = user_id);
