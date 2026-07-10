"use client";

import { useState, useEffect, useCallback } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { fetchAllChatHistory, type ChatHistoryRecord } from "@/lib/db-client";
import ancientsData from "@/data/ancients.json";

interface JournalNotesProps {
  open: boolean;
  onClose: () => void;
  accessToken?: string | null;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/**
 * 笔记模块 —— 古时月
 * 默认展示本周日历，下拉切换到完整月视图。
 */
export default function JournalNotes({ open, onClose, accessToken }: JournalNotesProps) {
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth()); // 0-11
  const [weekOffset, setWeekOffset] = useState(0); // 0 = 当前周, -1 上周, 1 下周...
  const [expanded, setExpanded] = useState(false); // false = 周视图, true = 月视图
  const [records, setRecords] = useState<ChatHistoryRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  const isLoggedIn = !!accessToken;
  const loading = isLoggedIn && !initialLoaded;

  const ancientMap: Record<string, { name: string; dynasty: string }> = {};
  for (const a of ancientsData) {
    ancientMap[a.id] = { name: a.name, dynasty: a.dynasty };
  }

  const effectiveRecords = isLoggedIn ? records : [];

  const recordsByDate: Record<string, ChatHistoryRecord[]> = {};
  for (const r of effectiveRecords) {
    const key = toDateKey(new Date(r.created_at));
    if (!recordsByDate[key]) recordsByDate[key] = [];
    recordsByDate[key].push(r);
  }
  for (const k of Object.keys(recordsByDate)) {
    recordsByDate[k].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const today = new Date();
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setWeekOffset(0);
      setExpanded(false);
      setSelectedDate(toDateKey(today));
      setInitialLoaded(false);
    }
  }

  useEffect(() => {
    if (!open || !accessToken) return;
    let ignore = false;
    const client = getBrowserClient();
    const p: Promise<ChatHistoryRecord[]> = client
      ? fetchAllChatHistory(client)
      : Promise.resolve([] as ChatHistoryRecord[]);
    p.then((all) => {
      if (ignore) return;
      setRecords(all);
      setInitialLoaded(true);
    }).catch(() => {
      if (ignore) return;
      setRecords([]);
      setInitialLoaded(true);
    });
    return () => { ignore = true; };
  }, [open, accessToken]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /** 获取当前周的日期范围（基于 weekOffset） */
  const getWeekDates = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0=周日
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek + weekOffset * 7);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [weekOffset]);

  const goPrevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const goNextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  const goToday = useCallback(() => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekOffset(0);
  }, []);

  if (!open) return null;

  // ---- 月历格构造 ----
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthDateKey = (d: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${viewYear}-${m}-${day}`;
  };

  // ---- 周历格构造 ----
  const weekDates = getWeekDates();
  const weekMonthLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    if (first.getMonth() === last.getMonth()) {
      return `${first.getFullYear()}年${first.getMonth() + 1}月`;
    }
    return `${first.getFullYear()}年${first.getMonth() + 1}月 - ${last.getMonth() + 1}月`;
  })();

  const todayKey = toDateKey(new Date());
  const selectedMessages = selectedDate ? recordsByDate[selectedDate] ?? [] : [];

  const selectedLabel = (() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    return `${y}年${m}月${d}日`;
  })();

  return (
    <div
      className="animate-modal-in fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(28,25,23,0.95)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes journal-month-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .journal-grid-anim { animation: journal-month-in 0.3s ease-out; }
        @keyframes journal-detail-in { from { opacity: 0; } to { opacity: 1; } }
        .journal-detail-anim { animation: journal-detail-in 0.25s ease-out; }
        @keyframes journal-expand { from { max-height: 0; opacity: 0; } to { max-height: 600px; opacity: 1; } }
        .journal-expand-anim { animation: journal-expand 0.4s ease-out forwards; overflow: hidden; }
        .journal-scroll::-webkit-scrollbar { width: 6px; }
        .journal-scroll::-webkit-scrollbar-track { background: transparent; }
        .journal-scroll::-webkit-scrollbar-thumb { background: rgba(184,134,11,0.28); border-radius: 3px; }
        .journal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(184,134,11,0.5); }
        .journal-scroll { scrollbar-width: thin; scrollbar-color: rgba(184,134,11,0.28) transparent; }
      `}</style>

      <div className="flex h-full w-full flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题栏 */}
        <header className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8" style={{ borderBottom: "1px solid rgba(184,134,11,0.15)" }}>
          <div className="flex items-baseline gap-3">
            <h2 className="title-serif text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-gold)" }}>日記</h2>
            <span className="title-serif text-xs tracking-widest sm:text-sm" style={{ color: "rgba(245,241,232,0.5)" }}>古時月 · 與古人的每日對談</span>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/5" style={{ color: "rgba(245,241,232,0.7)" }} aria-label="关闭">✕</button>
        </header>

        {/* 主体内容 */}
        <main className="journal-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:flex-row lg:items-start">
            {/* 日历卡片 —— 宣纸卷面 */}
            <section
              className="w-full shrink-0 lg:w-[400px]"
              style={{
                background: `
                  repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(139,105,20,0.035) 30px, rgba(139,105,20,0.035) 31px),
                  linear-gradient(180deg, #f7f2e6 0%, #f0e9d6 100%)
                `,
                border: "1px solid rgba(184,134,11,0.3)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 0 50px rgba(139,105,20,0.04)",
              }}
            >
              {/* 卷面顶部装饰条 */}
              <div
                className="flex items-center justify-center gap-3 py-2"
                style={{ borderBottom: "1px solid rgba(184,134,11,0.15)" }}
              >
                <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(184,134,11,0.3))" }} />
                <span className="title-serif text-[10px] tracking-[0.3em]" style={{ color: "var(--color-gold)", opacity: 0.6 }}>日历</span>
                <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(184,134,11,0.3), transparent)" }} />
              </div>

              {/* 日历头：导航 + 年月 + 展开/收起 */}
              <div className="flex items-center justify-between px-4 py-4">
                {expanded ? (
                  <>
                    <button onClick={goPrevMonth} className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5" style={{ color: "var(--color-ink)" }} aria-label="上一月">◀</button>
                    <div className="flex flex-col items-center">
                      <span className="title-serif text-xl font-bold sm:text-2xl" style={{ color: "var(--color-ink)" }}>{viewYear}年{viewMonth + 1}月</span>
                      <button onClick={goToday} className="title-serif mt-0.5 text-[11px] tracking-wider transition-opacity hover:opacity-70" style={{ color: "var(--color-gold)" }}>回到今日</button>
                    </div>
                    <button onClick={goNextMonth} className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5" style={{ color: "var(--color-ink)" }} aria-label="下一月">▶</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setWeekOffset(w => w - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5" style={{ color: "var(--color-ink)" }} aria-label="上一周">◀</button>
                    <div className="flex flex-col items-center">
                      <span className="title-serif text-base font-bold sm:text-lg" style={{ color: "var(--color-ink)" }}>{weekMonthLabel}</span>
                      <button onClick={goToday} className="title-serif mt-0.5 text-[11px] tracking-wider transition-opacity hover:opacity-70" style={{ color: "var(--color-gold)" }}>回到今日</button>
                    </div>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5" style={{ color: "var(--color-ink)" }} aria-label="下一周">▶</button>
                  </>
                )}
              </div>

              {/* 展开切换按钮 */}
              <div className="flex items-center justify-center pb-2">
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] transition-all"
                  style={{ color: "var(--color-gold)", border: "1px solid rgba(184,134,11,0.25)", background: "rgba(184,134,11,0.06)" }}
                >
                  <span className="title-serif tracking-wider">{expanded ? "收起为周视图" : "展开为月视图"}</span>
                  <span className="text-[10px]" style={{ transform: expanded ? "rotate(180deg)" : "", transition: "transform 0.3s" }}>▾</span>
                </button>
              </div>

              {/* 星期表头 —— 篆字风格 */}
              <div className="grid grid-cols-7 px-2 pb-1" style={{ borderBottom: "1px solid rgba(184,134,11,0.1)" }}>
                {WEEKDAYS.map((w, idx) => (
                  <div key={w} className="title-serif py-1.5 text-center text-xs font-semibold" style={{
                    color: idx === 0 || idx === 6 ? "var(--color-vermillion)" : "var(--color-gold)",
                    opacity: 0.8,
                  }}>{w}</div>
                ))}
              </div>

              {/* ===== 周视图（默认） ===== */}
              {!expanded && (
                <div key={`week-${weekOffset}`} className="journal-grid-anim grid grid-cols-7 gap-1 px-2 pb-3 pt-1">
                  {weekDates.map((d) => {
                    const key = toDateKey(d);
                    const dayMessages = recordsByDate[key];
                    const hasConv = !!dayMessages;
                    const isSel = selectedDate === key;
                    const isToday = key === todayKey;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        className="relative flex aspect-square cursor-pointer flex-col items-center justify-center transition-all"
                        style={{
                          borderRadius: "6px",
                          border: isSel ? "1.5px solid var(--color-gold)" : "1px solid transparent",
                          background: isSel
                            ? "linear-gradient(180deg, rgba(184,134,11,0.12) 0%, rgba(184,134,11,0.06) 100%)"
                            : isToday
                              ? "rgba(196,69,54,0.05)"
                              : "transparent",
                          boxShadow: isSel ? "0 2px 8px rgba(184,134,11,0.15)" : "none",
                        }}
                        title={hasConv ? `${dayMessages!.length} 条对话` : undefined}
                      >
                        {isToday && !isSel && (
                          <span className="absolute inset-0 rounded-md" style={{ border: "1px dashed rgba(196,69,54,0.4)" }} />
                        )}
                        <span className="title-serif text-sm leading-none sm:text-base" style={{
                          color: isToday ? "var(--color-vermillion)" : isWeekend ? "var(--color-vermillion)" : "var(--color-ink)",
                          fontWeight: isToday ? 700 : 400,
                          opacity: isWeekend && !isToday ? 0.7 : 1,
                        }}>{d.getDate()}</span>
                        {hasConv && <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-gold)", boxShadow: "0 0 4px rgba(184,134,11,0.4)" }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ===== 月视图（展开后） ===== */}
              {expanded && (
                <div key={`${viewYear}-${viewMonth}`} className="journal-grid-anim journal-expand-anim grid grid-cols-7 gap-1 px-2 pb-3 pt-1">
                  {cells.map((d, i) => {
                    if (d === null) return <div key={`blank-${i}`} className="aspect-square" />;
                    const key = monthDateKey(d);
                    const dayMessages = recordsByDate[key];
                    const hasConv = !!dayMessages;
                    const isSel = selectedDate === key;
                    const isToday = key === todayKey;
                    const dow = new Date(viewYear, viewMonth, d).getDay();
                    const isWeekend = dow === 0 || dow === 6;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        className="relative flex aspect-square cursor-pointer flex-col items-center justify-center transition-all"
                        style={{
                          borderRadius: "6px",
                          border: isSel ? "1.5px solid var(--color-gold)" : "1px solid transparent",
                          background: isSel
                            ? "linear-gradient(180deg, rgba(184,134,11,0.12) 0%, rgba(184,134,11,0.06) 100%)"
                            : isToday
                              ? "rgba(196,69,54,0.05)"
                              : "transparent",
                          boxShadow: isSel ? "0 2px 8px rgba(184,134,11,0.15)" : "none",
                        }}
                        title={hasConv ? `${dayMessages!.length} 条对话` : undefined}
                      >
                        {isToday && !isSel && (
                          <span className="absolute inset-0 rounded-md" style={{ border: "1px dashed rgba(196,69,54,0.4)" }} />
                        )}
                        <span className="title-serif text-sm leading-none sm:text-base" style={{
                          color: isToday ? "var(--color-vermillion)" : isWeekend ? "var(--color-vermillion)" : "var(--color-ink)",
                          fontWeight: isToday ? 700 : 400,
                          opacity: isWeekend && !isToday ? 0.7 : 1,
                        }}>{d}</span>
                        {hasConv && <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-gold)", boxShadow: "0 0 4px rgba(184,134,11,0.4)" }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 图例 */}
              <div
                className="flex items-center justify-center gap-5 px-4 py-3 text-[11px]"
                style={{ borderTop: "1px solid rgba(184,134,11,0.12)", color: "var(--color-ink-light)" }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-gold)", boxShadow: "0 0 4px rgba(184,134,11,0.4)" }} />
                  <span className="title-serif">有墨</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ border: "1.5px solid var(--color-gold)", background: "rgba(184,134,11,0.08)" }} />
                  <span className="title-serif">已选</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ border: "1px dashed rgba(196,69,54,0.5)" }} />
                  <span className="title-serif" style={{ color: "var(--color-vermillion)" }}>今日</span>
                </span>
              </div>
            </section>

            {/* 对话详情面板 */}
            <section className="flex w-full min-h-0 flex-col rounded-2xl lg:flex-1" style={{ background: "rgba(245,241,232,0.04)", border: "1px solid rgba(214,207,192,0.14)", height: "min(62vh, 560px)" }}>
              <div className="flex shrink-0 items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(214,207,192,0.12)" }}>
                <span className="title-serif text-sm sm:text-base" style={{ color: "var(--color-paper)" }}>{selectedDate ? selectedLabel : "对话详情"}</span>
                {selectedDate && selectedMessages.length > 0 && <span className="text-[11px]" style={{ color: "var(--color-gold)" }}>共 {selectedMessages.length} 则</span>}
              </div>

              <div className="journal-scroll flex-1 overflow-y-auto px-4 py-4">
                {!isLoggedIn && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="title-serif text-3xl" style={{ color: "var(--color-gold)" }}>🔒</span>
                    <p className="title-serif text-base" style={{ color: "var(--color-paper)" }}>登入後方可查閱對話筆記</p>
                    <p className="text-xs" style={{ color: "rgba(245,241,232,0.5)" }}>與古人的每一次對談，皆會留痕於此</p>
                  </div>
                )}

                {isLoggedIn && loading && (
                  <div className="flex h-full items-center justify-center"><span className="text-xs" style={{ color: "rgba(245,241,232,0.5)" }}>加载笔記中…</span></div>
                )}

                {isLoggedIn && !loading && !selectedDate && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span className="title-serif text-2xl" style={{ color: "rgba(245,241,232,0.3)" }}>◑</span>
                    <p className="title-serif text-sm" style={{ color: "rgba(245,241,232,0.55)" }}>点击日历中有标记的日期</p>
                    <p className="text-xs" style={{ color: "rgba(245,241,232,0.35)" }}>查阅当日与古人的对话</p>
                  </div>
                )}

                {isLoggedIn && !loading && selectedDate && selectedMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span className="title-serif text-2xl" style={{ color: "rgba(245,241,232,0.3)" }}>○</span>
                    <p className="title-serif text-sm" style={{ color: "rgba(245,241,232,0.55)" }}>此日无对话记录</p>
                  </div>
                )}

                {isLoggedIn && !loading && selectedDate && selectedMessages.length > 0 && (
                  <div key={selectedDate} className="journal-detail-anim space-y-4">
                    {selectedMessages.map((rec, idx) => {
                      const isUser = rec.role === "user";
                      const ancient = ancientMap[rec.ancient_id];
                      const time = toTimeLabel(rec.created_at);
                      return (
                        <div key={rec.id ?? idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                          {!isUser && ancient && (
                            <span className="title-serif mb-1 ml-1 text-[11px]" style={{ color: "var(--color-jade)" }}>{ancient.name} · {ancient.dynasty}</span>
                          )}
                          <div
                            className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                            style={isUser
                              ? { background: "var(--color-paper)", color: "var(--color-ink)", borderBottomRightRadius: "6px" }
                              : { background: "rgba(107,142,107,0.16)", color: "#a8c8a9", border: "1px solid rgba(107,142,107,0.32)", borderBottomLeftRadius: "6px" }
                            }
                          >
                            {rec.content}
                          </div>
                          {time && <span className={`mt-1 text-[10px] ${isUser ? "mr-1" : "ml-1"}`} style={{ color: "rgba(245,241,232,0.4)" }}>{time}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
