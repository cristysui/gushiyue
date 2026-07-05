"use client";

import { useEffect, useState } from "react";
import ScrollModal from "@/components/ScrollModal";
import ChatModal from "@/components/ChatModal";
import AuthModal from "@/components/AuthModal";
import ColorBadge from "@/components/ColorBadge";
import TagList from "@/components/TagList";
import { useAuth } from "@/lib/auth";

// ===== 类型定义 =====
interface RecommendedColor { name: string; hex: string }
interface JieqiInfo {
  name: string; period: string; intro: string;
  customs: string[]; activities: string[]; foods: string[];
  poetry: { title: string; author: string; content: string }[];
}
interface CurrentShichen {
  name: string; time: string; meridian: string;
  activity: string; suitable: string[]; avoid: string[];
}
interface DailyPoem { title: string; author: string; content: string }
interface TodayData {
  date: string; lunarDate: string; jieqi: string; jieqiInfo: JieqiInfo;
  wuxing: string; todayYi: string[]; todayJi: string[];
  recommendedColors: RecommendedColor[];
  seasonalVegetables: string[]; seasonalFruits: string[];
  flowers: string[]; currentShichen: CurrentShichen; dailyPoem: DailyPoem;
}
interface Ancient {
  id: string; name: string; dynasty: string; birthYear: string;
  title: string; personality: string; bio: string;
  famousWorks: string[]; speakingStyle: string; promptHint: string;
}
interface ChatMessage { role: "user" | "ancient"; content: string }

type ModalType = "calendar" | "jieqi" | "poem" | "garden" | "flowers" | "shichen" | null;

export default function HomePage() {
  const [today, setToday] = useState<TodayData | null>(null);
  const [ancient, setAncient] = useState<Ancient | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, accessToken, signIn, signUp, signOut } = useAuth();

  // 拉取数据
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/today").then(r => r.json()),
      fetch("/api/ancient/random").then(r => r.json()),
    ]).then(([todayJson, ancientJson]) => {
      if (!active) return;
      setToday(todayJson.data ?? todayJson);
      setAncient(ancientJson.data ?? ancientJson);
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false };
  }, []);

  const handleReplaceAncient = async () => {
    try {
      const res = await fetch("/api/ancient/random");
      const json = await res.json();
      setAncient(json.data ?? json);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
        <div className="relative h-16 w-16">
          <div className="h-16 w-16 rounded-full border-2 border-border/40" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-t-2 border-accent" />
        </div>
        <p className="title-serif text-sm tracking-widest text-muted">研墨展卷中…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== 庭院主视觉 ===== */}
      <div className="absolute inset-0">
        <img
          src="/courtyard-main.jpg"
          alt="中式庭院"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/10 via-transparent to-paper/80" />
      </div>

      {/* ===== 顶部信息栏 ===== */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="seal">古時月</span>
          <span className="title-serif text-sm tracking-widest text-ink-light/80">
            今月曾經照古人
          </span>
        </div>
        <div className="flex items-center gap-3">
          {today && (
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-lg bg-card/70 px-3 py-1.5 ink-border backdrop-blur-sm">
                <span className="title-serif text-ink">{today.date}</span>
                <span className="ml-2 text-xs text-muted">{today.lunarDate}</span>
              </div>
              <div className="rounded-lg border border-vermillion/20 bg-vermillion/5 px-3 py-1.5 backdrop-blur-sm">
                <span className="title-serif text-accent2">{today.jieqi}</span>
              </div>
            </div>
          )}
          {/* 用户登录/登出按钮 */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-card/70 px-2.5 py-1.5 text-xs text-ink-light ink-border backdrop-blur-sm">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-border/50 bg-card/70 px-2.5 py-1.5 text-xs text-muted backdrop-blur-sm hover:text-ink"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-lg bg-card/70 px-3 py-1.5 text-xs text-ink ink-border backdrop-blur-sm hover:bg-card"
            >
              登入
            </button>
          )}
        </div>
      </header>

      {/* ===== 庭院交互区 ===== */}
      <main className="relative z-10 mx-auto max-w-5xl px-6" style={{ minHeight: "calc(100vh - 80px)" }}>
        <div className="relative mx-auto" style={{ maxWidth: "900px", aspectRatio: "16/9" }}>

          {/* --- 古人坐在石桌旁 --- */}
          {ancient && (
            <button
              onClick={() => setChatOpen(true)}
              className="game-icon group absolute"
              style={{ top: "48%", left: "55%" }}
              aria-label={`与${ancient.name}对话`}
            >
              <div className="relative">
                {/* 脉冲提示 */}
                <div className="pulse-ring relative flex h-14 w-14 items-center justify-center rounded-full bg-card/90 ink-border backdrop-blur-sm">
                  <span className="title-serif text-2xl font-bold text-accent2">
                    {ancient.name[0]}
                  </span>
                </div>
                {/* 名牌 */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                  {ancient.name} · {ancient.dynasty}
                </div>
                {/* 正在做什么 */}
                {today?.currentShichen && (
                  <div className="animate-float absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-card/90 px-2.5 py-1 text-[11px] text-muted ink-border backdrop-blur-sm">
                    {today.currentShichen.activity}
                  </div>
                )}
              </div>
            </button>
          )}

          {/* --- 万年历（五行宜色 + 宜忌）--- */}
          <button
            onClick={() => setActiveModal("calendar")}
            className="game-icon group absolute"
            style={{ top: "8%", left: "8%" }}
            aria-label="万年历"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-card/85 ink-border backdrop-blur-sm">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="5" width="20" height="18" rx="2" stroke="var(--color-gold)" strokeWidth="1.8"/>
                <line x1="3" y1="10" x2="23" y2="10" stroke="var(--color-gold)" strokeWidth="1.5"/>
                <line x1="9" y1="2" x2="9" y2="7" stroke="var(--color-gold)" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="17" y1="2" x2="17" y2="7" stroke="var(--color-gold)" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="15" r="1.2" fill="var(--color-vermillion)"/>
                <circle cx="13" cy="15" r="1.2" fill="var(--color-gold)"/>
                <circle cx="17" cy="15" r="1.2" fill="var(--color-jade)"/>
                <circle cx="9" cy="19" r="1.2" fill="var(--color-gold)"/>
                <circle cx="13" cy="19" r="1.2" fill="var(--color-vermillion)"/>
              </svg>
              <span className="hotspot-dot" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              万年历
            </div>
          </button>

          {/* --- 节气生活 --- */}
          <button
            onClick={() => setActiveModal("jieqi")}
            className="game-icon group absolute"
            style={{ top: "12%", right: "10%" }}
            aria-label="节气生活"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-card/85 ink-border backdrop-blur-sm">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M13 3 C13 3, 8 8, 8 13 C8 17, 10 20, 13 20 C16 20, 18 17, 18 13 C18 8, 13 3, 13 3 Z"
                  stroke="var(--color-jade)" strokeWidth="1.5" fill="rgba(107,142,107,0.1)"/>
                <line x1="13" y1="20" x2="13" y2="24" stroke="var(--color-jade)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 12 Q13 10, 16 12" stroke="var(--color-jade)" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              节气生活
            </div>
          </button>

          {/* --- 时令蔬果（菜园区域）--- */}
          <button
            onClick={() => setActiveModal("garden")}
            className="game-icon group absolute"
            style={{ bottom: "12%", left: "12%" }}
            aria-label="时令蔬果"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-card/85 ink-border backdrop-blur-sm">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M13 22 L13 14" stroke="var(--color-jade)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 14 C10 12, 8 10, 9 8 C11 9, 13 11, 13 14" fill="var(--color-jade)" opacity="0.6"/>
                <path d="M13 14 C16 12, 18 10, 17 8 C15 9, 13 11, 13 14" fill="var(--color-jade)" opacity="0.6"/>
                <path d="M13 14 C13 11, 14 9, 16 9 C16 11, 15 13, 13 14" fill="var(--color-jade)" opacity="0.5"/>
                <ellipse cx="13" cy="22" rx="6" ry="1.5" fill="var(--color-gold)" opacity="0.2"/>
              </svg>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              时令蔬果
            </div>
          </button>

          {/* --- 当月花信 --- */}
          <button
            onClick={() => setActiveModal("flowers")}
            className="game-icon group absolute"
            style={{ top: "30%", right: "6%" }}
            aria-label="当月花信"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-card/85 ink-border backdrop-blur-sm">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="10" r="3" fill="var(--color-vermillion)" opacity="0.6"/>
                <circle cx="10" cy="13" r="3" fill="var(--color-vermillion)" opacity="0.5"/>
                <circle cx="16" cy="13" r="3" fill="var(--color-vermillion)" opacity="0.5"/>
                <circle cx="13" cy="16" r="3" fill="var(--color-vermillion)" opacity="0.4"/>
                <circle cx="13" cy="13" r="2" fill="var(--color-gold)"/>
                <line x1="13" y1="19" x2="13" y2="24" stroke="var(--color-jade)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              当月花信
            </div>
          </button>

          {/* --- 每日一诗 --- */}
          <button
            onClick={() => setActiveModal("poem")}
            className="game-icon group absolute"
            style={{ bottom: "15%", right: "12%" }}
            aria-label="每日一诗"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-card/85 ink-border backdrop-blur-sm">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M8 6 L8 20 Q8 22, 10 22 L18 22" stroke="var(--color-ink)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M8 6 Q8 4, 10 4 L16 4 Q18 4, 18 6 L18 20 Q18 22, 16 22" stroke="var(--color-ink)" strokeWidth="1.5" fill="rgba(253,251,246,0.5)"/>
                <line x1="11" y1="9" x2="15" y2="9" stroke="var(--color-ink)" strokeWidth="1" opacity="0.5"/>
                <line x1="11" y1="12" x2="15" y2="12" stroke="var(--color-ink)" strokeWidth="1" opacity="0.5"/>
                <line x1="11" y1="15" x2="14" y2="15" stroke="var(--color-ink)" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
              每日一诗
            </div>
          </button>

          {/* --- 当下时辰 --- */}
          {today?.currentShichen && (
            <button
              onClick={() => setActiveModal("shichen")}
              className="game-icon group absolute"
              style={{ top: "25%", left: "40%" }}
              aria-label="当下时辰"
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-card/85 ink-border backdrop-blur-sm">
                <div className="text-center">
                  <p className="title-serif text-base font-bold text-ink leading-none">
                    {today.currentShichen.name}
                  </p>
                  <p className="text-[9px] text-muted leading-none mt-0.5">
                    {today.currentShichen.time}
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card/90 px-2 py-0.5 text-xs text-ink ink-border backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                {today.currentShichen.meridian}
              </div>
            </button>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-2 text-center">
          <p className="title-serif text-xs tracking-widest text-muted/70">
            點擊庭院中的物件，探索今日之趣
          </p>
        </div>
      </main>

      {/* ===== 卷轴弹窗：万年历 ===== */}
      <ScrollModal
        open={activeModal === "calendar"}
        onClose={() => setActiveModal(null)}
        title="萬年曆"
        subtitle={today?.date}
        sealText="宜忌"
      >
        {today && (
          <div className="space-y-5">
            <div>
              <p className="title-serif mb-2 text-sm font-semibold text-ink">
                今日五行 · <span className="text-accent">{today.wuxing}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {today.recommendedColors.map((c) => (
                  <ColorBadge key={c.name} name={c.name} hex={c.hex} />
                ))}
              </div>
            </div>
            <div className="border-t border-scroll-edge/15 pt-4">
              <p className="title-serif mb-2 text-sm font-semibold text-jade">宜</p>
              <TagList items={today.todayYi} variant="yi" />
            </div>
            <div>
              <p className="title-serif mb-2 text-sm font-semibold text-accent2">忌</p>
              <TagList items={today.todayJi} variant="ji" />
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：节气生活 ===== */}
      <ScrollModal
        open={activeModal === "jieqi"}
        onClose={() => setActiveModal(null)}
        title={today?.jieqiInfo?.name ?? "节气"}
        subtitle={today?.jieqiInfo?.period}
        sealText="節氣"
      >
        {today?.jieqiInfo && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-light">{today.jieqiInfo.intro}</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="title-serif mb-1.5 text-xs font-semibold text-muted">民俗</p>
                <TagList items={today.jieqiInfo.customs} />
              </div>
              <div>
                <p className="title-serif mb-1.5 text-xs font-semibold text-jade">宜做</p>
                <TagList items={today.jieqiInfo.activities} variant="yi" />
              </div>
              <div>
                <p className="title-serif mb-1.5 text-xs font-semibold text-muted">饮食</p>
                <TagList items={today.jieqiInfo.foods} />
              </div>
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：每日一诗 ===== */}
      <ScrollModal
        open={activeModal === "poem"}
        onClose={() => setActiveModal(null)}
        title="每日一詩"
        sealText="詩"
      >
        {today?.dailyPoem && (
          <div className="space-y-3 text-center">
            <p className="title-serif text-xl font-bold text-ink">{today.dailyPoem.title}</p>
            <p className="text-sm text-muted">— {today.dailyPoem.author}</p>
            <div className="mt-4 space-y-2">
              {today.dailyPoem.content.split("\n").map((line, i) => (
                <p key={i} className="title-serif text-lg leading-loose text-ink-light">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：时令蔬果 ===== */}
      <ScrollModal
        open={activeModal === "garden"}
        onClose={() => setActiveModal(null)}
        title="時令蔬果"
        subtitle="順時而食 · 應季而餐"
        sealText="食"
      >
        {today && (
          <div className="space-y-4">
            <div>
              <p className="title-serif mb-2 text-sm font-semibold text-jade">時令蔬菜</p>
              <TagList items={today.seasonalVegetables} variant="yi" />
            </div>
            <div className="border-t border-scroll-edge/15 pt-4">
              <p className="title-serif mb-2 text-sm font-semibold text-accent2">時令水果</p>
              <TagList items={today.seasonalFruits} />
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：当月花信 ===== */}
      <ScrollModal
        open={activeModal === "flowers"}
        onClose={() => setActiveModal(null)}
        title="當月花信"
        subtitle="二十四番花信風"
        sealText="花"
      >
        {today && (
          <div className="space-y-4">
            <TagList items={today.flowers} />
            <div className="border-t border-scroll-edge/15 pt-3">
              <p className="text-xs leading-relaxed text-muted">
                花信風，自小寒至穀雨，每候一花，以花為期。
                梅花先行，楊花殿後，八氣二十四候，得二十四番花信。
              </p>
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：当下时辰 ===== */}
      <ScrollModal
        open={activeModal === "shichen"}
        onClose={() => setActiveModal(null)}
        title={today?.currentShichen?.name ?? "時辰"}
        subtitle={today?.currentShichen?.time}
        sealText="時"
      >
        {today?.currentShichen && (
          <div className="space-y-4">
            <p className="text-center text-sm text-accent2">{today.currentShichen.meridian}</p>
            <div className="rounded-lg bg-scroll-edge/5 p-3 text-center">
              <p className="text-sm text-ink">
                古人此時：<span className="title-serif font-bold text-accent">{today.currentShichen.activity}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="title-serif mb-1.5 text-xs font-semibold text-jade">宜</p>
                <TagList items={today.currentShichen.suitable} variant="yi" />
              </div>
              <div>
                <p className="title-serif mb-1.5 text-xs font-semibold text-accent2">忌</p>
                <TagList items={today.currentShichen.avoid} variant="ji" />
              </div>
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 古人对话弹窗 ===== */}
      <ChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        ancient={ancient}
        currentShichenActivity={today?.currentShichen?.activity}
        accessToken={accessToken}
      />

      {/* ===== 登录/注册弹窗 ===== */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* ===== 右下角：换古人按钮 ===== */}
      {ancient && !chatOpen && (
        <button
          onClick={handleReplaceAncient}
          className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-card/90 px-4 py-2.5 text-sm text-ink ink-border ink-shadow backdrop-blur-sm transition-all hover:bg-card"
        >
          <span className="title-serif">換一位古人</span>
          <span className="text-muted">→</span>
        </button>
      )}
    </div>
  );
}
