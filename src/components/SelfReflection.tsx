"use client";

import { useState, useEffect, useCallback } from "react";

interface SelfReflectionProps {
  open: boolean;
  onClose: () => void;
}

interface DayRecord {
  mood: string | null;
  merits: { id: string; text: string; time: string }[];
  demerits: { id: string; text: string; time: string }[];
}

const MOODS = [
  { id: "joy", label: "愉悦", icon: "喜", color: "#d4a017" },
  { id: "calm", label: "平和", icon: "安", color: "#6b8e6b" },
  { id: "sad", label: "伤感", icon: "悲", color: "#5f7a8b" },
  { id: "angry", label: "愤懑", icon: "怒", color: "#c44536" },
  { id: "tired", label: "倦怠", icon: "倦", color: "#8b7355" },
  { id: "inspired", label: "感悟", icon: "悟", color: "#8e44ad" },
];

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateLabel(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const STORAGE_KEY = "gushiyue-self-reflection";

function loadAllRecords(): Record<string, DayRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRecord(dateKey: string, record: DayRecord) {
  const all = loadAllRecords();
  all[dateKey] = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* */ }
}

export default function SelfReflection({ open, onClose }: SelfReflectionProps) {
  const today = new Date();
  const todayKey = getDateKey(today);
  const [record, setRecord] = useState<DayRecord>({ mood: null, merits: [], demerits: [] });
  const [meritInput, setMeritInput] = useState("");
  const [demeritInput, setDemeritInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load today's record when opening
  useEffect(() => {
    if (!open) return;
    const all = loadAllRecords();
    const todayRecord = all[todayKey] || { mood: null, merits: [], demerits: [] };
    setRecord(todayRecord);
    setLoaded(true);
  }, [open, todayKey]);

  // Lock body scroll + ESC
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

  const updateRecord = useCallback((updater: (prev: DayRecord) => DayRecord) => {
    setRecord((prev) => {
      const next = updater(prev);
      saveRecord(todayKey, next);
      return next;
    });
  }, [todayKey]);

  const setMood = useCallback((moodId: string) => {
    updateRecord((prev) => ({ ...prev, mood: prev.mood === moodId ? null : moodId }));
  }, [updateRecord]);

  const addMerit = useCallback(() => {
    const text = meritInput.trim();
    if (!text) return;
    const item = { id: Date.now().toString(), text, time: new Date().toISOString() };
    updateRecord((prev) => ({ ...prev, merits: [...prev.merits, item] }));
    setMeritInput("");
  }, [meritInput, updateRecord]);

  const addDemerit = useCallback(() => {
    const text = demeritInput.trim();
    if (!text) return;
    const item = { id: Date.now().toString(), text, time: new Date().toISOString() };
    updateRecord((prev) => ({ ...prev, demerits: [...prev.demerits, item] }));
    setDemeritInput("");
  }, [demeritInput, updateRecord]);

  const removeMerit = useCallback((id: string) => {
    updateRecord((prev) => ({ ...prev, merits: prev.merits.filter((m) => m.id !== id) }));
  }, [updateRecord]);

  const removeDemerit = useCallback((id: string) => {
    updateRecord((prev) => ({ ...prev, demerits: prev.demerits.filter((d) => d.id !== id) }));
  }, [updateRecord]);

  if (!open) return null;

  const currentMood = MOODS.find((m) => m.id === record.mood);
  const meritCount = record.merits.length;
  const demeritCount = record.demerits.length;
  const netScore = meritCount - demeritCount;

  return (
    <>
      <style>{`
        @keyframes sr-fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sr-fade { animation: sr-fade-in 0.4s ease-out both; }
        @keyframes sr-item-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .sr-item { animation: sr-item-in 0.3s ease-out both; }
        .sr-scroll::-webkit-scrollbar { width: 5px; }
        .sr-scroll::-webkit-scrollbar-track { background: transparent; }
        .sr-scroll::-webkit-scrollbar-thumb { background: rgba(184,134,11,0.25); border-radius: 3px; }
        .sr-scroll { scrollbar-width: thin; scrollbar-color: rgba(184,134,11,0.25) transparent; }
      `}</style>

      <div
        className="animate-modal-in fixed inset-0 z-50 flex flex-col"
        style={{ background: "rgba(28,25,23,0.95)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <div className="flex h-full w-full flex-col" onClick={(e) => e.stopPropagation()}>
          {/* 顶部标题栏 */}
          <header
            className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8"
            style={{ borderBottom: "1px solid rgba(184,134,11,0.15)" }}
          >
            <div className="flex items-baseline gap-3">
              <h2 className="title-serif text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-gold)" }}>吾省</h2>
              <span className="title-serif text-xs tracking-widest sm:text-sm" style={{ color: "rgba(245,241,232,0.5)" }}>
                吾日三省吾身 · {dateLabel(today)}
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

          {/* 主体 */}
          <main className="sr-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-8">
            <div className="mx-auto w-full max-w-2xl space-y-6">
              {/* ===== 今日心情 ===== */}
              <section
                className="sr-fade rounded-lg p-5"
                style={{
                  background: "rgba(245,241,232,0.04)",
                  border: "1px solid rgba(214,207,192,0.12)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="title-serif text-base font-semibold" style={{ color: "var(--color-paper)" }}>今日心境</span>
                  {currentMood && (
                    <span className="title-serif text-sm" style={{ color: currentMood.color }}>
                      · {currentMood.label}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {MOODS.map((mood) => {
                    const isActive = record.mood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        onClick={() => setMood(mood.id)}
                        className="flex flex-col items-center gap-1.5 rounded-lg px-3 py-2.5 transition-all duration-300"
                        style={{
                          border: `1.5px solid ${isActive ? mood.color : "rgba(214,207,192,0.15)"}`,
                          background: isActive ? `${mood.color}1a` : "transparent",
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                          boxShadow: isActive ? `0 0 12px ${mood.color}33` : "none",
                        }}
                      >
                        <span
                          className="title-serif flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold"
                          style={{
                            color: isActive ? "#fff" : mood.color,
                            background: isActive ? mood.color : `${mood.color}1a`,
                            border: `1px solid ${mood.color}55`,
                          }}
                        >
                          {mood.icon}
                        </span>
                        <span
                          className="title-serif text-xs"
                          style={{ color: isActive ? mood.color : "rgba(245,241,232,0.5)" }}
                        >
                          {mood.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ===== 功过格 ===== */}
              <section className="sr-fade grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ animationDelay: "0.1s" }}>
                {/* 功 - 善事 */}
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "rgba(107,142,107,0.06)",
                    border: "1px solid rgba(107,142,107,0.2)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="title-serif flex h-8 w-8 items-center justify-center rounded text-lg font-bold"
                        style={{ background: "var(--color-jade)", color: "#fff" }}
                      >
                        功
                      </span>
                      <span className="title-serif text-sm" style={{ color: "var(--color-jade)" }}>善行录</span>
                    </div>
                    <span className="title-serif text-xs" style={{ color: "rgba(107,142,107,0.6)" }}>{meritCount} 件</span>
                  </div>

                  {/* 输入 */}
                  <div className="mb-3 flex gap-2">
                    <input
                      value={meritInput}
                      onChange={(e) => setMeritInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addMerit(); }}
                      placeholder="记一善…"
                      className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
                      style={{
                        background: "rgba(245,241,232,0.06)",
                        border: "1px solid rgba(107,142,107,0.2)",
                        color: "var(--color-paper)",
                      }}
                    />
                    <button
                      onClick={addMerit}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg transition-all hover:scale-105"
                      style={{ background: "var(--color-jade)", color: "#fff" }}
                      aria-label="添加善事"
                    >
                      +
                    </button>
                  </div>

                  {/* 列表 */}
                  <div className="sr-scroll max-h-[200px] space-y-2 overflow-y-auto">
                    {record.merits.length === 0 && (
                      <p className="py-3 text-center text-xs" style={{ color: "rgba(245,241,232,0.3)" }}>尚无善行记录</p>
                    )}
                    {record.merits.map((item) => (
                      <div
                        key={item.id}
                        className="sr-item flex items-start gap-2 rounded-md px-3 py-2 text-sm"
                        style={{ background: "rgba(107,142,107,0.08)" }}
                      >
                        <span className="mt-0.5 text-xs" style={{ color: "var(--color-jade)" }}>○</span>
                        <span className="flex-1" style={{ color: "rgba(245,241,232,0.8)" }}>{item.text}</span>
                        <button
                          onClick={() => removeMerit(item.id)}
                          className="shrink-0 text-xs opacity-40 transition-opacity hover:opacity-80"
                          style={{ color: "var(--color-vermillion)" }}
                          aria-label="删除"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 过 - 恶事 */}
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "rgba(196,69,54,0.05)",
                    border: "1px solid rgba(196,69,54,0.2)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="title-serif flex h-8 w-8 items-center justify-center rounded text-lg font-bold"
                        style={{ background: "var(--color-vermillion)", color: "#fff" }}
                      >
                        过
                      </span>
                      <span className="title-serif text-sm" style={{ color: "var(--color-vermillion)" }}>过失录</span>
                    </div>
                    <span className="title-serif text-xs" style={{ color: "rgba(196,69,54,0.6)" }}>{demeritCount} 件</span>
                  </div>

                  {/* 输入 */}
                  <div className="mb-3 flex gap-2">
                    <input
                      value={demeritInput}
                      onChange={(e) => setDemeritInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addDemerit(); }}
                      placeholder="记一过…"
                      className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
                      style={{
                        background: "rgba(245,241,232,0.06)",
                        border: "1px solid rgba(196,69,54,0.2)",
                        color: "var(--color-paper)",
                      }}
                    />
                    <button
                      onClick={addDemerit}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg transition-all hover:scale-105"
                      style={{ background: "var(--color-vermillion)", color: "#fff" }}
                      aria-label="添加过失"
                    >
                      +
                    </button>
                  </div>

                  {/* 列表 */}
                  <div className="sr-scroll max-h-[200px] space-y-2 overflow-y-auto">
                    {record.demerits.length === 0 && (
                      <p className="py-3 text-center text-xs" style={{ color: "rgba(245,241,232,0.3)" }}>尚无过失记录</p>
                    )}
                    {record.demerits.map((item) => (
                      <div
                        key={item.id}
                        className="sr-item flex items-start gap-2 rounded-md px-3 py-2 text-sm"
                        style={{ background: "rgba(196,69,54,0.08)" }}
                      >
                        <span className="mt-0.5 text-xs" style={{ color: "var(--color-vermillion)" }}>×</span>
                        <span className="flex-1" style={{ color: "rgba(245,241,232,0.8)" }}>{item.text}</span>
                        <button
                          onClick={() => removeDemerit(item.id)}
                          className="shrink-0 text-xs opacity-40 transition-opacity hover:opacity-80"
                          style={{ color: "var(--color-vermillion)" }}
                          aria-label="删除"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ===== 功过总计 ===== */}
              <section
                className="sr-fade flex items-center justify-center gap-6 rounded-lg px-5 py-4"
                style={{
                  background: "rgba(184,134,11,0.06)",
                  border: "1px solid rgba(184,134,11,0.15)",
                  animationDelay: "0.2s",
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="title-serif text-2xl font-bold" style={{ color: "var(--color-jade)" }}>{meritCount}</span>
                  <span className="text-xs" style={{ color: "rgba(245,241,232,0.4)" }}>善</span>
                </div>
                <span className="title-serif text-xl" style={{ color: "rgba(245,241,232,0.3)" }}>−</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="title-serif text-2xl font-bold" style={{ color: "var(--color-vermillion)" }}>{demeritCount}</span>
                  <span className="text-xs" style={{ color: "rgba(245,241,232,0.4)" }}>过</span>
                </div>
                <span className="title-serif text-xl" style={{ color: "rgba(245,241,232,0.3)" }}>=</span>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="title-serif text-2xl font-bold"
                    style={{
                      color: netScore > 0 ? "var(--color-gold)" : netScore < 0 ? "var(--color-vermillion)" : "rgba(245,241,232,0.5)",
                    }}
                  >
                    {netScore > 0 ? `+${netScore}` : netScore}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(245,241,232,0.4)" }}>净</span>
                </div>
              </section>

              {/* 功过格寄语 */}
              <p className="sr-fade pb-4 text-center text-xs leading-relaxed" style={{ color: "rgba(245,241,232,0.35)", animationDelay: "0.3s" }}>
                {netScore > 0
                  ? "善行多于过失，积善之家必有余庆。"
                  : netScore < 0
                    ? "今日过失偏多，当自省改之，过而能改善莫大焉。"
                    : "功过相抵，明日当勉力向善。"}
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
