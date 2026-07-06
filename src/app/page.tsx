"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ScrollModal from "@/components/ScrollModal";
import ChatModal from "@/components/ChatModal";
import AuthModal from "@/components/AuthModal";
import ColorBadge from "@/components/ColorBadge";
import TagList from "@/components/TagList";
import FloatingHeader from "@/components/FloatingHeader";
import { useAuth } from "@/lib/auth";
import { computeTodayData } from "@/lib/today-client";
import { getRandomAncientClient } from "@/lib/ancients-client";
import type { TodayData } from "@/lib/types";

// 3D 场景动态导入（避免 SSR，静态导出兼容）
const GardenScene = dynamic(() => import("@/components/scene/GardenScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-16 w-16">
        <div className="h-16 w-16 rounded-full border-2 border-border/40" />
        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-t-2 border-accent" />
      </div>
    </div>
  ),
});

interface Ancient {
  id: string; name: string; dynasty: string; birthYear: string;
  title: string; personality: string; bio: string;
  famousWorks: string[]; speakingStyle: string; promptHint: string;
}

type ModalType = "calendar" | "jieqi" | "poem" | "garden" | "flowers" | "shichen" | null;

export default function HomePage() {
  const [today, setToday] = useState<TodayData | null>(null);
  const [ancient, setAncient] = useState<Ancient | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState<string | null>(null);

  const { user, accessToken, signIn, signUp, signOut } = useAuth();

  useEffect(() => {
    setToday(computeTodayData());
    setAncient(getRandomAncientClient());
    setLoading(false);
  }, []);

  // 3D 场景交互回调
  const handleReachAncient = useCallback(() => {
    setHint("靠近了古人，点击可交谈");
    // 自动打开对话
    setTimeout(() => setChatOpen(true), 400);
  }, []);

  const handleReachPoetry = useCallback(() => {
    setHint("走到了诗碑前");
    setTimeout(() => setActiveModal("poem"), 400);
  }, []);

  const handleReachJieqi = useCallback(() => {
    setHint("来到了节气碑前");
    setTimeout(() => setActiveModal("jieqi"), 400);
  }, []);

  // 提示自动消失
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), 3000);
    return () => clearTimeout(timer);
  }, [hint]);

  const handleReplaceAncient = () => {
    setAncient(getRandomAncientClient());
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
    <div className="fixed inset-0 overflow-hidden">
      {/* ===== 3D 庭院场景（全屏底图）===== */}
      <div className="absolute inset-0">
        <GardenScene
          ancient={ancient}
          onReachAncient={handleReachAncient}
          onReachPoetry={handleReachPoetry}
          onReachJieqi={handleReachJieqi}
        />
      </div>

      {/* ===== 透明浮动 Header ===== */}
      <FloatingHeader today={today} />

      {/* ===== 右上角：用户区 ===== */}
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

      {/* ===== 底部操作提示 ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 pb-4">
        <div className="flex items-center gap-3 rounded-full px-4 py-2"
          style={{
            background: "rgba(28, 25, 23, 0.5)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(196, 166, 122, 0.1)",
          }}
        >
          <span className="text-xs text-paper/50">点击地面行走</span>
          <span className="text-paper/20">|</span>
          <span className="text-xs text-paper/50">靠近古人交谈</span>
          <span className="text-paper/20">|</span>
          <span className="text-xs text-paper/50">探索石碑</span>
        </div>
      </div>

      {/* ===== 交互提示气泡 ===== */}
      {hint && (
        <div className="animate-bubble-in fixed left-1/2 top-20 z-40 -translate-x-1/2">
          <div className="rounded-full px-4 py-2 text-xs text-paper"
            style={{
              background: "rgba(28, 25, 23, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(196, 166, 122, 0.3)",
            }}
          >
            {hint}
          </div>
        </div>
      )}

      {/* ===== 右下角：换古人按钮 ===== */}
      {ancient && !chatOpen && (
        <button
          onClick={handleReplaceAncient}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-paper transition-all hover:scale-105"
          style={{
            background: "rgba(28, 25, 23, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(196, 166, 122, 0.2)",
          }}
        >
          <span className="title-serif">换一位古人</span>
          <span className="text-paper/40">→</span>
        </button>
      )}

      {/* ===== 卷轴弹窗：万年历 ===== */}
      <ScrollModal
        open={activeModal === "calendar"}
        onClose={() => setActiveModal(null)}
        title="万年历"
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
        sealText="节气"
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
        title="每日一诗"
        sealText="诗"
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
        title="时令蔬果"
        subtitle="顺时而食 · 应季而餐"
        sealText="食"
      >
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

      {/* ===== 卷轴弹窗：当月花信 ===== */}
      <ScrollModal
        open={activeModal === "flowers"}
        onClose={() => setActiveModal(null)}
        title="当月花信"
        subtitle="二十四番花信风"
        sealText="花"
      >
        {today && (
          <div className="space-y-4">
            <TagList items={today.flowers} />
            <div className="border-t border-scroll-edge/15 pt-3">
              <p className="text-xs leading-relaxed text-muted">
                花信风，自小寒至谷雨，每候一花，以花为期。
                梅花先行，杨花殿后，八气二十四候，得二十四番花信。
              </p>
            </div>
          </div>
        )}
      </ScrollModal>

      {/* ===== 卷轴弹窗：当下时辰 ===== */}
      <ScrollModal
        open={activeModal === "shichen"}
        onClose={() => setActiveModal(null)}
        title={today?.currentShichen?.name ?? "时辰"}
        subtitle={today?.currentShichen?.time}
        sealText="时"
      >
        {today?.currentShichen && (
          <div className="space-y-4">
            <p className="text-center text-sm text-accent2">{today.currentShichen.meridian}</p>
            <div className="rounded-lg bg-scroll-edge/5 p-3 text-center">
              <p className="text-sm text-ink">
                古人此时：<span className="title-serif font-bold text-accent">{today.currentShichen.activity}</span>
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
    </div>
  );
}
