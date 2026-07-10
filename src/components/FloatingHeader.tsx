"use client";

import { useState, useEffect } from "react";
import type { TodayData } from "@/lib/types";

interface FloatingHeaderProps {
  today: TodayData | null;
  onExpand?: () => void;
}

/**
 * 透明浮动 Header
 * 始终浮在 3D 场景顶部，半透明毛玻璃效果
 * 移动端：精简显示（农历 + 节气 + 时辰）
 * Web 端：更丰富（五行 + 宜忌）
 * 点击展开详情弹窗
 */
export default function FloatingHeader({ today, onExpand }: FloatingHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!today) {
    return (
      <div className="fixed left-0 right-0 top-0 z-30 flex items-center justify-center py-3"
        style={{ background: "rgba(28, 25, 23, 0.5)", backdropFilter: "blur(8px)" }}
      >
        <span className="text-sm text-paper/60">加载中…</span>
      </div>
    );
  }

  const handleClick = () => {
    setExpanded(!expanded);
    onExpand?.();
  };

  return (
    <>
      {/* 顶部 Header 条 */}
      <div
        className="fixed left-0 right-0 top-0 z-30 transition-all"
        style={{
          background: "rgba(28, 25, 23, 0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(196, 166, 122, 0.15)",
        }}
      >
        <div className={`flex items-center gap-3 px-4 ${isMobile ? "py-2" : "py-2.5"}`}>
          {/* 左侧：标题 */}
          <span className="font-title text-lg text-paper sm:text-xl whitespace-nowrap" style={{ letterSpacing: "0.05em" }}>
            古时月
          </span>

          {/* 分隔符 + 核心历法信息（仅非移动端） */}
          {!isMobile && (
            <>
              <span className="text-paper/20">|</span>

              <div className="flex items-baseline gap-2 cursor-pointer" onClick={handleClick}>
                <span className="title-serif text-sm font-bold text-paper sm:text-base">
                  {today.lunarDate}
                </span>
                <span className="text-xs text-paper/60">{today.date}</span>
              </div>

              <span className="text-paper/30">·</span>

              <span className="cursor-pointer rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold" onClick={handleClick}>
                {today.jieqi}
              </span>

              {today.wuxing && (
                <span className="text-xs text-paper/50">
                  {today.wuxing}日
                </span>
              )}

              <span className="rounded-full border border-jade/30 bg-jade/10 px-2 py-0.5 text-xs text-jade">
                {today.currentShichen?.name}
              </span>
            </>
          )}

          <div className="flex-1" />

          {/* 顶部导航（仅非移动端） */}
          {!isMobile && (
            <nav className="flex items-center gap-4">
              {["书阁", "雅集", "笔记", "设置"].map((item) => (
                <span key={item} className="text-nav text-sm cursor-pointer transition-opacity hover:opacity-100 opacity-80">
                  {item}
                </span>
              ))}
            </nav>
          )}

          {/* 展开按钮 */}
          <span className="cursor-pointer text-xs text-paper/40 transition-transform whitespace-nowrap" style={{ transform: expanded ? "rotate(180deg)" : "" }} onClick={handleClick}>
            ▾
          </span>
        </div>
      </div>

      {/* 详情弹窗 */}
      {expanded && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(28, 25, 23, 0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setExpanded(false)}
          />

          {/* 详情面板 */}
          <div
            className="animate-modal-in fixed left-1/2 top-0 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 overflow-y-auto rounded-b-2xl"
            style={{
              background: "rgba(28, 25, 23, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(196, 166, 122, 0.2)",
              borderBottom: "none",
            }}
          >
            <div className="p-5">
              {/* 关闭按钮 */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="title-serif text-lg font-bold text-paper">今日详情</h2>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-paper/50 hover:bg-white/10 hover:text-paper"
                >
                  ✕
                </button>
              </div>

              {/* 核心日期区 */}
              <div className="mb-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                <p className="title-serif text-xl font-bold text-gold">{today.lunarDate}</p>
                <p className="mt-1 text-sm text-paper/60">{today.date} {today.weekday}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
                    {today.jieqi}
                  </span>
                  {today.jieqiDateRange && (
                    <span className="text-xs text-paper/50">{today.jieqiDateRange}</span>
                  )}
                </div>
              </div>

              {/* 网格信息 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 五行 */}
                <div className="rounded-lg border border-border/30 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-paper/40">五行</p>
                  <p className="text-sm font-medium text-paper">{today.wuxing}</p>
                </div>

                {/* 时辰 */}
                <div className="rounded-lg border border-border/30 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-paper/40">当前时辰</p>
                  <p className="text-sm font-medium text-jade">{today.currentShichen?.name}</p>
                  <p className="text-xs text-paper/40">{today.currentShichen?.time}</p>
                </div>

                {/* 节气宜 */}
                {today.jieqiInfo?.activities && today.jieqiInfo.activities.length > 0 && (
                  <div className="rounded-lg border border-border/30 bg-white/5 p-3">
                    <p className="mb-1 text-xs text-paper/40">节气活动</p>
                    <p className="text-sm font-medium text-accent2">
                      {today.jieqiInfo.activities.slice(0, 3).join("、")}
                    </p>
                  </div>
                )}

                {/* 推荐颜色：利于色（优先）+ 本命色 */}
                {(today.beneficialColors?.length > 0 || today.recommendedColors?.length > 0) && (
                  <div className="rounded-lg border border-border/30 bg-white/5 p-3">
                    <p className="mb-1 text-xs text-paper/40">穿衣推荐色</p>
                    {today.beneficialColors?.length > 0 && (
                      <div className="mb-1.5">
                        <span className="mr-1.5 text-[10px] text-jade/60">利于色</span>
                        <div className="flex flex-wrap gap-1.5">
                          {today.beneficialColors.map((c, i) => (
                            <span key={`b${i}`} className="flex items-center gap-1 text-xs text-paper/70">
                              <span className="h-3 w-3 rounded-full" style={{ background: c.hex }} />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {today.recommendedColors?.length > 0 && (
                      <div>
                        <span className="mr-1.5 text-[10px] text-paper/40">本命色</span>
                        <div className="flex flex-wrap gap-1.5">
                          {today.recommendedColors.map((c, i) => (
                            <span key={`r${i}`} className="flex items-center gap-1 text-xs text-paper/60">
                              <span className="h-3 w-3 rounded-full" style={{ background: c.hex }} />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 宜 */}
              {today.todayYi?.length > 0 && (
                <div className="mt-3 rounded-lg border border-jade/20 bg-jade/5 p-3">
                  <p className="mb-1.5 text-xs text-jade/70">宜</p>
                  <div className="flex flex-wrap gap-1.5">
                    {today.todayYi.map((y: string, i: number) => (
                      <span key={i} className="rounded border border-jade/20 bg-jade/10 px-1.5 py-0.5 text-xs text-jade/80">
                        {y}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 忌 */}
              {today.todayJi?.length > 0 && (
                <div className="mt-3 rounded-lg border border-vermillion/20 bg-vermillion/5 p-3">
                  <p className="mb-1.5 text-xs text-vermillion/70">忌</p>
                  <div className="flex flex-wrap gap-1.5">
                    {today.todayJi.map((j: string, i: number) => (
                      <span key={i} className="rounded border border-vermillion/20 bg-vermillion/10 px-1.5 py-0.5 text-xs text-vermillion/80">
                        {j}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 时令蔬果 */}
              {today.seasonalVegetables?.length > 0 && (
                <div className="mt-3 rounded-lg border border-border/30 bg-white/5 p-3">
                  <p className="mb-1.5 text-xs text-paper/40">时令蔬果</p>
                  <p className="text-sm text-paper/80">
                    {today.seasonalVegetables.join("、")}
                  </p>
                </div>
              )}

              {/* 每日一诗 */}
              {today.dailyPoem && (
                <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-3">
                  <p className="mb-1 text-xs text-gold/60">每日一诗</p>
                  <p className="title-serif text-sm text-paper/90">{today.dailyPoem.title}</p>
                  <p className="text-xs text-paper/50">— {today.dailyPoem.author}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-paper/70">
                    {today.dailyPoem.content}
                  </p>
                </div>
              )}

              {/* 节气简介 */}
              {today.jieqiInfo?.intro && (
                <div className="mt-3 rounded-lg border border-border/30 bg-white/5 p-3">
                  <p className="mb-1 text-xs text-paper/40">节气简介</p>
                  <p className="text-sm leading-relaxed text-paper/70">
                    {today.jieqiInfo.intro}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
