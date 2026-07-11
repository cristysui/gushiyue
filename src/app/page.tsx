"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ScrollModal from "@/components/ScrollModal";
import ChatModal from "@/components/ChatModal";
import AuthModal from "@/components/AuthModal";
import ColorBadge from "@/components/ColorBadge";
import TagList from "@/components/TagList";
import FloatingHeader from "@/components/FloatingHeader";
import BookPavilion from "@/components/BookPavilion";
import JournalNotes from "@/components/JournalNotes";
import DailyFortune from "@/components/DailyFortune";
import StudyScene from "@/components/scene/StudyScene";
import DebugOverlay from "@/components/scene/DebugOverlay";
import { useAuth } from "@/lib/auth";
import { computeTodayData } from "@/lib/today-client";
import { getRandomAncientClient } from "@/lib/ancients-client";
import type { TodayData } from "@/lib/types";

interface Ancient {
  id: string; name: string; dynasty: string; birthYear: string;
  title: string; personality: string; bio: string;
  famousWorks: string[]; speakingStyle: string; promptHint: string;
}

type ModalType = "calendar" | "jieqi" | "poem" | "garden" | "flowers" | "shichen" | "clothing" | null;

// ===== 五行穿衣配色数据 =====
// 五行穿衣规则:
//   大吉色 = 我生者(当日五行所生之色, 能量自然流向, 如火日→土色, 火生土)
//   次吉色 = 比和(当日五行同类色, 如火日→火色)
//   不宜色 = 生我者(生当日之色, 泄气, 如火日→木色, 木生火)
interface ClothingColor { name: string; hex: string; }
interface WuxingClothingData {
  color: string; bg: string; desc: string;
  lucky: ClothingColor[]; secondary: ClothingColor[]; unlucky: ClothingColor[];
}
const WUXING_CLOTHING_DATA: Record<string, WuxingClothingData> = {
  "金": {
    color: "#c0a062", bg: "rgba(192,160,98,0.1)", desc: "金日主收敛肃杀",
    // 大吉: 金生水 → 水色
    lucky: [{ name: "黑色", hex: "#2c3e50" }, { name: "蓝色", hex: "#3498db" }, { name: "玄色", hex: "#1a1a2e" }],
    // 次吉: 比和 → 金色
    secondary: [{ name: "白色", hex: "#ffffff" }, { name: "银色", hex: "#c0c0c0" }, { name: "金色", hex: "#d4af37" }],
    // 不宜: 土生金 → 土色(泄气)
    unlucky: [{ name: "黄色", hex: "#e6c84c" }, { name: "棕色", hex: "#8b6914" }, { name: "褐色", hex: "#6b4226" }],
  },
  "木": {
    color: "#4a8b4a", bg: "rgba(74,139,74,0.1)", desc: "木日主生发条达",
    // 大吉: 木生火 → 火色
    lucky: [{ name: "红色", hex: "#e74c3c" }, { name: "紫色", hex: "#8e44ad" }, { name: "朱色", hex: "#c0392b" }],
    // 次吉: 比和 → 木色
    secondary: [{ name: "青色", hex: "#2ecc8f" }, { name: "绿色", hex: "#27ae60" }, { name: "翠色", hex: "#16a085" }],
    // 不宜: 水生木 → 水色(泄气)
    unlucky: [{ name: "黑色", hex: "#2c3e50" }, { name: "蓝色", hex: "#3498db" }, { name: "玄色", hex: "#1a1a2e" }],
  },
  "水": {
    color: "#3498db", bg: "rgba(52,152,219,0.1)", desc: "水日主润下灵秀",
    // 大吉: 水生木 → 木色
    lucky: [{ name: "青色", hex: "#2ecc8f" }, { name: "绿色", hex: "#27ae60" }, { name: "翠色", hex: "#16a085" }],
    // 次吉: 比和 → 水色
    secondary: [{ name: "黑色", hex: "#2c3e50" }, { name: "蓝色", hex: "#3498db" }, { name: "玄色", hex: "#1a1a2e" }],
    // 不宜: 金生水 → 金色(泄气)
    unlucky: [{ name: "白色", hex: "#ffffff" }, { name: "银色", hex: "#c0c0c0" }, { name: "金色", hex: "#d4af37" }],
  },
  "火": {
    color: "#e74c3c", bg: "rgba(231,76,60,0.1)", desc: "火日主炎上炽热",
    // 大吉: 火生土 → 土色
    lucky: [{ name: "黄色", hex: "#e6c84c" }, { name: "棕色", hex: "#8b6914" }, { name: "褐色", hex: "#6b4226" }],
    // 次吉: 比和 → 火色
    secondary: [{ name: "红色", hex: "#e74c3c" }, { name: "紫色", hex: "#8e44ad" }, { name: "朱色", hex: "#c0392b" }],
    // 不宜: 木生火 → 木色(泄气)
    unlucky: [{ name: "青色", hex: "#2ecc8f" }, { name: "绿色", hex: "#27ae60" }, { name: "翠色", hex: "#16a085" }],
  },
  "土": {
    color: "#8b6914", bg: "rgba(139,105,20,0.1)", desc: "土日主承载厚德",
    // 大吉: 土生金 → 金色
    lucky: [{ name: "白色", hex: "#ffffff" }, { name: "银色", hex: "#c0c0c0" }, { name: "金色", hex: "#d4af37" }],
    // 次吉: 比和 → 土色
    secondary: [{ name: "黄色", hex: "#e6c84c" }, { name: "棕色", hex: "#8b6914" }, { name: "褐色", hex: "#6b4226" }],
    // 不宜: 火生土 → 火色(泄气)
    unlucky: [{ name: "红色", hex: "#e74c3c" }, { name: "紫色", hex: "#8e44ad" }, { name: "朱色", hex: "#c0392b" }],
  },
};

export default function HomePage() {
  const [today, setToday] = useState<TodayData | null>(null);
  const [ancient, setAncient] = useState<Ancient | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [bookPavilionOpen, setBookPavilionOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  const { user, accessToken, signIn, signUp, signOut } = useAuth();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    setToday(computeTodayData());
    setAncient(getRandomAncientClient());
    setLoading(false);

    // 检查 URL 是否有 debug 参数（仅开发环境）
    if (isDev && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "true") {
        setDebugMode(true);
      }
    }
  }, [isDev]);

  // 快捷键 Ctrl+Shift+D（仅开发环境）
  useEffect(() => {
    if (!isDev) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDebugMode((prev) => {
          const next = !prev;
          const url = new URL(window.location.href);
          if (next) url.searchParams.set("debug", "true");
          else url.searchParams.delete("debug");
          window.history.replaceState({}, "", url.toString());
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 场景交互回调
  const handleSceneInteract = useCallback((type: string) => {
    switch (type) {
      case "ancient":
        setTimeout(() => setChatOpen(true), 300);
        break;
      case "poetry":
        setTimeout(() => setActiveModal("poem"), 300);
        break;
      case "jieqi":
        setTimeout(() => setActiveModal("jieqi"), 300);
        break;
      case "calendar":
        setTimeout(() => setActiveModal("calendar"), 300);
        break;
      case "flowers":
        setTimeout(() => setActiveModal("flowers"), 300);
        break;
      case "garden":
        setTimeout(() => setActiveModal("garden"), 300);
        break;
      case "shichen":
        setTimeout(() => setActiveModal("shichen"), 300);
        break;
      case "clothing":
        setTimeout(() => setActiveModal("clothing"), 300);
        break;
    }
  }, []);

  const handleReplaceAncient = () => {
    setAncient(getRandomAncientClient());
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4" style={{ background: "linear-gradient(180deg, #d4c5a0 0%, #a3c1a0 100%)" }}>
        <div className="relative h-16 w-16">
          <div className="h-16 w-16 rounded-full border-2 border-[#d6cfc0]" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-t-2 border-[#b8860b]" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ===== 场景 ===== */}
      <div ref={sceneContainerRef} className="absolute inset-0">
        <StudyScene ancient={ancient} onInteract={handleSceneInteract} containerRef={sceneContainerRef} debugMode={debugMode} today={today} onSwitchAncient={handleReplaceAncient} />
      </div>

      {/* ===== Debug 拖拽层 ===== */}
      {debugMode && (
        <DebugOverlay
          containerRef={sceneContainerRef}
          onExit={() => {
            setDebugMode(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("debug");
            window.history.replaceState({}, "", url.toString());
          }}
        />
      )}

      {/* ===== 透明浮动 Header（非 Debug 时显示）===== */}
      {!debugMode && (
        <FloatingHeader
          today={today}
          onNavClick={(item) => {
            if (item === "书阁") setBookPavilionOpen(true);
            else if (item === "日记") setJournalOpen(true);
            else if (item === "日签") setFortuneOpen(true);
          }}
        />
      )}

      {/* ===== 移动端底部 Tab 栏 ===== */}
      {!debugMode && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around sm:hidden"
          style={{
            background: "rgba(28,25,23,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(184,134,11,0.2)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {[
            { label: "书阁", icon: "阁", action: () => setBookPavilionOpen(true) },
            { label: "日签", icon: "签", action: () => setFortuneOpen(true) },
            { label: "日记", icon: "记", action: () => setJournalOpen(true) },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={tab.action}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors"
              style={{ color: "rgba(245,241,232,0.6)" }}
            >
              <span
                className="title-serif flex h-7 w-7 items-center justify-center rounded-full text-sm"
                style={{
                  border: "1px solid rgba(184,134,11,0.25)",
                  background: "rgba(184,134,11,0.06)",
                  color: "var(--color-gold)",
                }}
              >
                {tab.icon}
              </span>
              <span className="title-serif text-[10px] tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ===== 书阁模块 ===== */}
      <BookPavilion open={bookPavilionOpen} onClose={() => setBookPavilionOpen(false)} />

      {/* ===== 笔记模块 ===== */}
      <JournalNotes open={journalOpen} onClose={() => setJournalOpen(false)} accessToken={accessToken} />

      {/* ===== 日签模块 ===== */}
      <DailyFortune open={fortuneOpen} onClose={() => setFortuneOpen(false)} />

      {/* ===== 右上角：用户区（非 Debug 时显示）===== */}
      {!debugMode && (
        <div className="fixed right-3 top-14 z-30 flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-dark/60 px-2.5 py-1.5 text-xs text-paper/80"
                style={{ backdropFilter: "blur(8px)", border: "1px solid rgba(196,166,122,0.15)" }}
              >
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-lg bg-dark/60 px-2.5 py-1.5 text-xs text-paper/60 hover:text-paper"
                style={{ backdropFilter: "blur(8px)", border: "1px solid rgba(196,166,122,0.15)" }}
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-lg bg-dark/60 px-3 py-1.5 text-xs text-paper hover:bg-dark/80"
              style={{ backdropFilter: "blur(8px)", border: "1px solid rgba(196,166,122,0.15)" }}
            >
              登入
            </button>
          )}
        </div>
      )}

      {/* ===== 左下角：Debug 按钮（仅开发环境显示）===== */}
      {!debugMode && isDev && (
        <button
          onClick={() => {
            setDebugMode(true);
            const url = new URL(window.location.href);
            url.searchParams.set("debug", "true");
            window.history.replaceState({}, "", url.toString());
          }}
          className="fixed bottom-5 left-5 z-30 rounded-full px-3 py-1.5 text-xs text-paper/50 transition hover:text-paper"
          style={{
            background: "rgba(28, 25, 23, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          Debug
        </button>
      )}

      {/* ===== 卷轴弹窗 ===== */}
      <ScrollModal open={activeModal === "calendar"} onClose={() => setActiveModal(null)} title="万年历" subtitle={today?.date} sealText="宜忌">
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

      <ScrollModal open={activeModal === "jieqi"} onClose={() => setActiveModal(null)} title={today?.jieqiInfo?.name ?? "节气"} subtitle={today?.jieqiInfo?.period} sealText="节气">
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

      <ScrollModal open={activeModal === "poem"} onClose={() => setActiveModal(null)} title="每日一诗" sealText="诗">
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

      <ScrollModal open={activeModal === "garden"} onClose={() => setActiveModal(null)} title="时令蔬果" subtitle="顺时而食 · 应季而餐" sealText="食">
        {today && (
          <div className="space-y-4">
            <div>
              <p className="title-serif mb-2 text-sm font-semibold text-jade">时令蔬菜</p>
              <TagList items={today.seasonalVegetables} variant="yi" />
            </div>
            <div className="border-t border-scroll-edge/15 pt-4">
              <p className="title-serif mb-2 text-sm font-semibold text-accent2">时令水果</p>
              <TagList items={today.seasonalFruits} />
            </div>
          </div>
        )}
      </ScrollModal>

      <ScrollModal
        open={activeModal === "flowers"}
        onClose={() => setActiveModal(null)}
        title="花信风"
        subtitle="二十四番花信风"
        sealText="花"
      >
        <div className="space-y-3 text-center">
          <p className="title-serif text-lg font-bold text-ink">花信风</p>
          <p className="text-sm text-ink-light">
            小寒至谷雨，八气二十四候，每候应一花信。
          </p>
        </div>
      </ScrollModal>

      <ScrollModal
        open={activeModal === "shichen"}
        onClose={() => setActiveModal(null)}
        title="十二时辰"
        subtitle="日出而作 · 日入而息"
        sealText="时"
      >
        <div className="space-y-3 text-center">
          <p className="title-serif text-lg font-bold text-ink">十二时辰</p>
          <p className="text-sm text-ink-light">
            子丑寅卯辰巳午未申酉戌亥，一日十二时，时辰各有当令。
          </p>
        </div>
      </ScrollModal>

      {/* ===== 五行穿衣弹窗 ===== */}
      <ScrollModal
        open={activeModal === "clothing"}
        onClose={() => setActiveModal(null)}
        title="五行穿衣"
        subtitle={today ? `${today.lunarDateShort} · ${today.wuxing}日` : undefined}
        sealText="衣"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="title-serif text-base font-bold text-ink">今日五行穿衣指南</p>
            <p className="mt-1 text-xs text-ink-light">
              依据当日天干五行，推演穿衣配色宜忌
            </p>
          </div>

          {/* 当日五行 */}
          {today?.wuxing && (
            <div className="flex items-center justify-center gap-3 rounded-lg px-4 py-3" style={{ background: WUXING_CLOTHING_DATA[today.wuxing]?.bg || "rgba(184,134,11,0.08)" }}>
              <span className="title-serif text-3xl font-bold" style={{ color: WUXING_CLOTHING_DATA[today.wuxing]?.color }}>{today.wuxing}</span>
              <span className="text-sm text-ink-light">日 · {WUXING_CLOTHING_DATA[today.wuxing]?.desc}</span>
            </div>
          )}

          {/* 大吉色 */}
          {today?.wuxing && (
            <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
              <p className="title-serif text-sm font-bold text-gold">大吉色 · 宜穿</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {WUXING_CLOTHING_DATA[today.wuxing]?.lucky.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full" style={{ background: c.hex, border: "1px solid var(--color-border)" }} />
                    <span className="text-sm text-ink">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 次吉色 */}
          {today?.wuxing && (
            <div className="rounded-lg border border-jade/30 bg-jade/5 px-4 py-3">
              <p className="title-serif text-sm font-bold text-jade">次吉色 · 可穿</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {WUXING_CLOTHING_DATA[today.wuxing]?.secondary.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full" style={{ background: c.hex, border: "1px solid var(--color-border)" }} />
                    <span className="text-sm text-ink">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 不宜色 */}
          {today?.wuxing && (
            <div className="rounded-lg border border-vermillion/30 bg-vermillion/5 px-4 py-3">
              <p className="title-serif text-sm font-bold text-vermillion">不宜色 · 慎穿</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {WUXING_CLOTHING_DATA[today.wuxing]?.unlucky.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full" style={{ background: c.hex, border: "1px solid var(--color-border)", opacity: 0.5 }} />
                    <span className="text-sm text-ink-light">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-2 pb-2 pt-1 text-center">
            <p className="text-xs text-ink-light leading-relaxed">
              五行相生：金生水 · 水生木 · 木生火 · 火生土 · 土生金
            </p>
            <p className="mt-1 text-xs text-ink-light leading-relaxed">
              五行相克：金克木 · 木克土 · 土克水 · 水克火 · 火克金
            </p>
          </div>
        </div>
      </ScrollModal>
      {ancient && (
        <ChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          ancient={ancient}
          accessToken={accessToken}
        />
      )}

      {/* ===== 登入弹窗 ===== */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </div>
  );
}
