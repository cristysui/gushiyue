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

/** 将 Date 转为本地日期键 YYYY-MM-DD */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 将 ISO 时间戳格式化为 HH:MM */
function toTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/**
 * 笔记模块 —— 古时月
 * 以古风月历形式记录与古人的每日对谈。
 * 日历采用公历日期，配以国风纸笺质感与金色标记。
 */
export default function JournalNotes({ open, onClose, accessToken }: JournalNotesProps) {
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth()); // 0-11
  const [records, setRecords] = useState<ChatHistoryRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  const isLoggedIn = !!accessToken;
  // 首次数据未就绪时显示加载态（仅在已登录时）
  const loading = isLoggedIn && !initialLoaded;

  // 古人 id -> { name, dynasty } 映射
  const ancientMap: Record<string, { name: string; dynasty: string }> = {};
  for (const a of ancientsData) {
    ancientMap[a.id] = { name: a.name, dynasty: a.dynasty };
  }

  // 未登录时不展示任何记录，避免残留旧数据
  const effectiveRecords = isLoggedIn ? records : [];

  // 将记录按本地日期分组，组内按时间升序
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

  // 打开弹窗时重置到当月并清空选中态（React 推荐的「渲染期调整状态」写法，
  // 避免在 effect 中同步调用 setState）
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const today = new Date();
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setSelectedDate(null);
      setInitialLoaded(false);
    }
  }

  // 打开且已登录时加载全部对话历史；setState 仅在异步回调中触发
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
    return () => {
      ignore = true;
    };
  }, [open, accessToken]);

  // 锁定背景滚动 + Esc 关闭
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

  /** 上一月（12 月 -> 1 月时年份减一） */
  const goPrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  /** 下一月（12 月 -> 1 月时年份加一） */
  const goNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  /** 回到今日所在月 */
  const goToday = useCallback(() => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }, []);

  if (!open) return null;

  // ---- 日历格构造 ----
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = 周日
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); // 28-31
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthDateKey = (d: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${viewYear}-${m}-${day}`;
  };

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
      style={{
        background: "rgba(28,25,23,0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      {/* 局部样式：月份切换动画 + 自定义滚动条 */}
      <style>{`
        @keyframes journal-month-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .journal-grid-anim { animation: journal-month-in 0.3s ease-out; }
        @keyframes journal-detail-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .journal-detail-anim { animation: journal-detail-in 0.25s ease-out; }
        .journal-scroll::-webkit-scrollbar { width: 6px; }
        .journal-scroll::-webkit-scrollbar-track { background: transparent; }
        .journal-scroll::-webkit-scrollbar-thumb {
          background: rgba(184,134,11,0.28);
          border-radius: 3px;
        }
        .journal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(184,134,11,0.5);
        }
        .journal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(184,134,11,0.28) transparent;
        }
      `}</style>

      <div className="flex h-full w-full flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 顶部标题栏 */}
        <header
          className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8"
          style={{ borderBottom: "1px solid rgba(214,207,192,0.12)" }}
        >
          <div className="flex items-baseline gap-3">
            <h2
              className="title-serif text-2xl font-bold sm:text-3xl"
              style={{ color: "var(--color-paper)" }}
            >
              笔記
            </h2>
            <span
              className="title-serif text-xs tracking-widest sm:text-sm"
              style={{ color: "var(--color-gold)" }}
            >
              古時月 · 與古人的每日對談
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/5"
            style={{ color: "rgba(245,241,232,0.7)" }}
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        {/* 主体内容 */}
        <main className="journal-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:flex-row lg:items-start">
            {/* 日历卡片 */}
            <section
              className="w-full shrink-0 rounded-2xl ink-shadow-deep lg:w-[400px]"
              style={{ background: "var(--color-paper)", border: "1px solid var(--color-border)" }}
            >
              {/* 日历头：导航 + 年月 */}
              <div className="flex items-center justify-between px-4 py-4">
                <button
                  onClick={goPrevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5"
                  style={{ color: "var(--color-ink)" }}
                  aria-label="上一月"
                >
                  ◀
                </button>
                <div className="flex flex-col items-center">
                  <span
                    className="title-serif text-xl font-bold sm:text-2xl"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {viewYear}年{viewMonth + 1}月
                  </span>
                  <button
                    onClick={goToday}
                    className="title-serif mt-0.5 text-[11px] tracking-wider transition-opacity hover:opacity-70"
                    style={{ color: "var(--color-gold)" }}
                  >
                    回到今日
                  </button>
                </div>
                <button
                  onClick={goNextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors hover:bg-black/5"
                  style={{ color: "var(--color-ink)" }}
                  aria-label="下一月"
                >
                  ▶
                </button>
              </div>

              {/* 星期表头 */}
              <div className="grid grid-cols-7 px-2 pb-1">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="title-serif py-1 text-center text-xs font-semibold"
                    style={{ color: "var(--color-gold)" }}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div
                key={`${viewYear}-${viewMonth}`}
                className="journal-grid-anim grid grid-cols-7 gap-1 px-2 pb-3"
              >
                {cells.map((d, i) => {
                  if (d === null) {
                    return <div key={`blank-${i}`} className="aspect-square" />;
                  }
                  const key = monthDateKey(d);
                  const dayMessages = recordsByDate[key];
                  const hasConv = !!dayMessages;
                  const isSel = selectedDate === key;
                  const isToday = key === todayKey;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg transition-all"
                      style={{
                        border: isSel
                          ? "2px solid var(--color-gold)"
                          : "2px solid transparent",
                        background: isSel ? "rgba(184,134,11,0.08)" : "transparent",
                      }}
                      title={hasConv ? `${dayMessages!.length} 条对话` : undefined}
                    >
                      <span
                        className="title-serif text-sm leading-none sm:text-base"
                        style={{
                          color: isToday ? "var(--color-vermillion)" : "var(--color-ink)",
                          fontWeight: isToday ? 700 : 400,
                        }}
                      >
                        {d}
                      </span>
                      {hasConv && (
                        <span
                          className="mt-1 h-1.5 w-1.5 rounded-full"
                          style={{ background: "var(--color-gold)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 图例 */}
              <div
                className="flex items-center justify-center gap-4 px-4 py-3 text-[11px]"
                style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-muted)" }}
              >
                <span className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-gold)" }}
                  />
                  有对话
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ border: "2px solid var(--color-gold)" }}
                  />
                  已选
                </span>
                <span style={{ color: "var(--color-vermillion)" }}>● 今日</span>
              </div>
            </section>

            {/* 对话详情面板 */}
            <section
              className="flex w-full min-h-0 flex-col rounded-2xl lg:flex-1"
              style={{
                background: "rgba(245,241,232,0.04)",
                border: "1px solid rgba(214,207,192,0.14)",
                height: "min(62vh, 560px)",
              }}
            >
              {/* 详情头 */}
              <div
                className="flex shrink-0 items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid rgba(214,207,192,0.12)" }}
              >
                <span
                  className="title-serif text-sm sm:text-base"
                  style={{ color: "var(--color-paper)" }}
                >
                  {selectedDate ? selectedLabel : "对话详情"}
                </span>
                {selectedDate && selectedMessages.length > 0 && (
                  <span className="text-[11px]" style={{ color: "var(--color-gold)" }}>
                    共 {selectedMessages.length} 则
                  </span>
                )}
              </div>

              {/* 详情内容 */}
              <div className="journal-scroll flex-1 overflow-y-auto px-4 py-4">
                {/* 未登录提示 */}
                {!isLoggedIn && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="title-serif text-3xl" style={{ color: "var(--color-gold)" }}>
                      🔒
                    </span>
                    <p className="title-serif text-base" style={{ color: "var(--color-paper)" }}>
                      登入後方可查閱對話筆記
                    </p>
                    <p className="text-xs" style={{ color: "rgba(245,241,232,0.5)" }}>
                      與古人的每一次對談，皆會留痕於此
                    </p>
                  </div>
                )}

                {/* 加载中 */}
                {isLoggedIn && loading && (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs" style={{ color: "rgba(245,241,232,0.5)" }}>
                      加载笔記中…
                    </span>
                  </div>
                )}

                {/* 已登录但未选日期 */}
                {isLoggedIn && !loading && !selectedDate && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span
                      className="title-serif text-2xl"
                      style={{ color: "rgba(245,241,232,0.3)" }}
                    >
                      ◑
                    </span>
                    <p
                      className="title-serif text-sm"
                      style={{ color: "rgba(245,241,232,0.55)" }}
                    >
                      点击日历中有标记的日期
                    </p>
                    <p className="text-xs" style={{ color: "rgba(245,241,232,0.35)" }}>
                      查阅当日与古人的对话
                    </p>
                  </div>
                )}

                {/* 已选日期但无对话 */}
                {isLoggedIn && !loading && selectedDate && selectedMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span
                      className="title-serif text-2xl"
                      style={{ color: "rgba(245,241,232,0.3)" }}
                    >
                      ○
                    </span>
                    <p
                      className="title-serif text-sm"
                      style={{ color: "rgba(245,241,232,0.55)" }}
                    >
                      此日无对话记录
                    </p>
                  </div>
                )}

                {/* 对话列表 */}
                {isLoggedIn && !loading && selectedDate && selectedMessages.length > 0 && (
                  <div key={selectedDate} className="journal-detail-anim space-y-4">
                    {selectedMessages.map((rec, idx) => {
                      const isUser = rec.role === "user";
                      const ancient = ancientMap[rec.ancient_id];
                      const time = toTimeLabel(rec.created_at);
                      return (
                        <div
                          key={rec.id ?? idx}
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                        >
                          {!isUser && ancient && (
                            <span
                              className="title-serif mb-1 ml-1 text-[11px]"
                              style={{ color: "var(--color-jade)" }}
                            >
                              {ancient.name} · {ancient.dynasty}
                            </span>
                          )}
                          <div
                            className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                            style={
                              isUser
                                ? {
                                    background: "var(--color-paper)",
                                    color: "var(--color-ink)",
                                    borderBottomRightRadius: "6px",
                                  }
                                : {
                                    background: "rgba(107,142,107,0.16)",
                                    color: "#a8c8a9",
                                    border: "1px solid rgba(107,142,107,0.32)",
                                    borderBottomLeftRadius: "6px",
                                  }
                            }
                          >
                            {rec.content}
                          </div>
                          {time && (
                            <span
                              className={`mt-1 text-[10px] ${isUser ? "mr-1" : "ml-1"}`}
                              style={{ color: "rgba(245,241,232,0.4)" }}
                            >
                              {time}
                            </span>
                          )}
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
