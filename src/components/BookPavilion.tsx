"use client";

import { useState } from "react";
import { classicCategories, classicPoems, type ClassicPoem } from "@/data/classics";

interface BookPavilionProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 书阁 —— 古籍经典阅读模块
 * 全屏古风弹窗，桌面端左侧分类导航，移动端顶部横向菜单。
 */
export default function BookPavilion({ open, onClose }: BookPavilionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("tangshi");
  const [selectedPoem, setSelectedPoem] = useState<ClassicPoem | null>(null);

  if (!open) return null;

  const filteredPoems = classicPoems.filter((p) => p.category === activeCategory);
  const activeCat = classicCategories.find((c) => c.id === activeCategory);
  const previewLine = (content: string) => content.split("\n")[0];

  return (
    <div
      className="fixed inset-0 z-50 flex animate-modal-in flex-col"
      style={{
        background: "rgba(28, 25, 23, 0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <style>{bookPavilionStyles}</style>

      {/* 右上角关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-all duration-300 hover:scale-110 sm:right-6 sm:top-6"
        style={{
          borderColor: "rgba(184, 134, 11, 0.4)",
          color: "var(--color-paper)",
          background: "rgba(245, 241, 232, 0.06)",
        }}
        aria-label="关闭书阁"
      >
        ✕
      </button>

      <div className="flex h-full w-full flex-col overflow-hidden sm:flex-row">
        {/* ===== 桌面端：左侧分类导航 ===== */}
        <aside
          className="hidden shrink-0 flex-col border-r sm:flex"
          style={{
            width: "260px",
            borderColor: "rgba(184, 134, 11, 0.18)",
            background: "linear-gradient(180deg, rgba(28,25,23,0.6) 0%, rgba(20,18,16,0.8) 100%)",
          }}
        >
          {/* 标题 */}
          <div className="px-6 pb-4 pt-12 text-center">
            <h2 className="title-serif text-4xl font-bold tracking-[0.3em]" style={{ color: "var(--color-gold)" }}>
              书阁
            </h2>
            <div className="mx-auto mt-3 flex items-center justify-center gap-2" style={{ color: "rgba(245, 241, 232, 0.4)" }}>
              <span className="h-px w-8" style={{ background: "var(--color-gold)", opacity: 0.4 }} />
              <span className="text-xs tracking-widest">古籍经典</span>
              <span className="h-px w-8" style={{ background: "var(--color-gold)", opacity: 0.4 }} />
            </div>
          </div>

          {/* 分类标签 */}
          <nav className="bp-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {classicCategories.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSelectedPoem(null); }}
                  className="group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-all duration-300"
                  style={{
                    background: isActive ? "rgba(184, 134, 11, 0.14)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(184, 134, 11, 0.45)" : "transparent"}`,
                  }}
                >
                  <span
                    className="title-serif flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold transition-all duration-300"
                    style={{
                      color: isActive ? "var(--color-dark)" : "var(--color-gold)",
                      background: isActive ? "var(--color-gold)" : "rgba(184, 134, 11, 0.08)",
                      border: `1.5px solid ${isActive ? "var(--color-gold)" : "rgba(184, 134, 11, 0.35)"}`,
                      boxShadow: isActive ? "0 0 16px rgba(184, 134, 11, 0.35)" : "none",
                    }}
                  >
                    {cat.icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="title-serif text-lg font-semibold tracking-wider transition-colors duration-300" style={{ color: isActive ? "var(--color-paper)" : "rgba(245, 241, 232, 0.7)" }}>
                      {cat.name}
                    </span>
                    <span className="truncate text-xs transition-colors duration-300" style={{ color: isActive ? "rgba(245, 241, 232, 0.55)" : "rgba(245, 241, 232, 0.32)" }}>
                      {cat.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center justify-center pb-8 pt-2">
            <span className="rounded text-xs font-bold tracking-widest" style={{ padding: "4px 12px", color: "var(--color-card)", backgroundColor: "var(--color-vermillion)", opacity: 0.7 }}>
              古时月
            </span>
          </div>
        </aside>

        {/* ===== 移动端：顶部横向分类菜单 ===== */}
        <div
          className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 pb-3 pt-12 sm:hidden"
          style={{ borderColor: "rgba(184, 134, 11, 0.18)" }}
        >
          {/* 书阁标题 */}
          <h2 className="title-serif shrink-0 text-2xl font-bold tracking-[0.2em]" style={{ color: "var(--color-gold)" }}>
            书阁
          </h2>
          <span className="h-px w-3 shrink-0" style={{ background: "var(--color-gold)", opacity: 0.3 }} />
          {classicCategories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedPoem(null); }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300"
                style={{
                  background: isActive ? "rgba(184, 134, 11, 0.18)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(184, 134, 11, 0.5)" : "rgba(184, 134, 11, 0.2)"}`,
                }}
              >
                <span className="title-serif text-sm font-bold" style={{ color: isActive ? "var(--color-gold)" : "rgba(245, 241, 232, 0.5)" }}>
                  {cat.icon}
                </span>
                <span className="title-serif text-sm" style={{ color: isActive ? "var(--color-paper)" : "rgba(245, 241, 232, 0.55)" }}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== 右侧主内容区 ===== */}
        <main className="bp-scroll relative flex-1 overflow-y-auto">
          {selectedPoem ? (
            /* ===== 详读视图 ===== */
            <div key={selectedPoem.id} className="bp-view-in mx-auto max-w-2xl px-6 py-10 sm:px-10 sm:py-16">
              <button
                onClick={() => setSelectedPoem(null)}
                className="mb-10 flex items-center gap-2 text-sm transition-colors duration-300 hover:opacity-100"
                style={{ color: "rgba(245, 241, 232, 0.5)", opacity: 0.7 }}
              >
                <span>←</span>
                <span>返回{activeCat?.name}</span>
              </button>

              {/* 宣纸卷轴 */}
              <div
                className="relative mx-auto max-w-2xl"
                style={{ filter: "drop-shadow(0 6px 30px rgba(0,0,0,0.3))" }}
              >
                {/* 卷轴顶部滚轴 */}
                <div
                  className="flex h-7 items-center justify-center rounded-t-md"
                  style={{
                    background: "linear-gradient(180deg, #5c3d1e 0%, #3d2812 100%)",
                    boxShadow: "inset 0 1px 2px rgba(255,200,100,0.15)",
                    border: "1px solid rgba(184,134,11,0.3)",
                    borderBottom: "none",
                  }}
                >
                  <div className="h-1.5 w-16 rounded-full" style={{ background: "rgba(184,134,11,0.4)" }} />
                </div>

                {/* 卷轴正文 */}
                <div
                  className="px-8 py-12 text-center sm:px-12 sm:py-14"
                  style={{
                    background: `
                      repeating-linear-gradient(0deg, transparent, transparent 34px, rgba(139,105,20,0.04) 34px, rgba(139,105,20,0.04) 35px),
                      linear-gradient(180deg, #f7f2e6 0%, #f0e9d6 100%)
                    `,
                    borderLeft: "1px solid rgba(184,134,11,0.25)",
                    borderRight: "1px solid rgba(184,134,11,0.25)",
                    boxShadow: "inset 0 0 80px rgba(139,105,20,0.05)",
                  }}
                >
                  {/* 朱印标题装饰 */}
                  <div className="mb-2 flex justify-center">
                    <span
                      className="title-serif rounded text-[10px] font-bold tracking-widest"
                      style={{ padding: "2px 8px", background: "var(--color-vermillion)", color: "#fdfbf6", opacity: 0.85 }}
                    >
                      {selectedPoem.dynasty}
                    </span>
                  </div>

                  <h3 className="title-serif text-2xl font-bold tracking-[0.15em] sm:text-3xl" style={{ color: "var(--color-ink)" }}>
                    {selectedPoem.title}
                  </h3>
                  <p className="mt-2 title-serif text-sm" style={{ color: "var(--color-ink-light)" }}>
                    {selectedPoem.author}
                  </p>

                  <div className="mx-auto my-7 flex items-center justify-center gap-3">
                    <span className="h-px w-12" style={{ background: "var(--color-gold)", opacity: 0.3 }} />
                    <span className="text-[10px]" style={{ color: "var(--color-gold)", opacity: 0.5 }}>❖</span>
                    <span className="h-px w-12" style={{ background: "var(--color-gold)", opacity: 0.3 }} />
                  </div>

                  <p
                    className="title-serif mx-auto text-lg leading-loose sm:text-xl"
                    style={{ color: "var(--color-ink)", whiteSpace: "pre-line", letterSpacing: "0.1em", maxWidth: "440px", lineHeight: 2.4 }}
                  >
                    {selectedPoem.content}
                  </p>
                </div>

                {/* 卷轴底部滚轴 */}
                <div
                  className="flex h-7 items-center justify-center rounded-b-md"
                  style={{
                    background: "linear-gradient(180deg, #3d2812 0%, #5c3d1e 100%)",
                    boxShadow: "inset 0 -1px 2px rgba(255,200,100,0.15)",
                    border: "1px solid rgba(184,134,11,0.3)",
                    borderTop: "none",
                  }}
                >
                  <div className="h-1.5 w-16 rounded-full" style={{ background: "rgba(184,134,11,0.4)" }} />
                </div>
              </div>

              {selectedPoem.appreciation && (
                <div className="bp-fade-in mt-8" style={{ animationDelay: "0.15s" }}>
                  <div className="mb-3 flex items-center gap-3" style={{ color: "var(--color-gold)" }}>
                    <span className="title-serif text-sm font-semibold tracking-widest">赏析</span>
                    <span className="h-px flex-1" style={{ background: "rgba(184,134,11,0.25)" }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(245, 241, 232, 0.7)", letterSpacing: "0.04em", lineHeight: 1.9 }}>
                    {selectedPoem.appreciation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ===== 诗文列表视图 ===== */
            <div key={activeCategory} className="bp-view-in mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14">
              <div className="mb-8">
                <h3 className="title-serif text-xl font-bold tracking-widest sm:text-2xl" style={{ color: "var(--color-paper)" }}>
                  {activeCat?.name}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "rgba(245, 241, 232, 0.45)" }}>
                  {activeCat?.description} · 共 {filteredPoems.length} 篇
                </p>
                <span className="mt-4 block h-px w-full" style={{ background: "linear-gradient(90deg, var(--color-gold) 0%, transparent 100%)", opacity: 0.4 }} />
              </div>

              <div className="space-y-3 pb-12">
                {filteredPoems.map((poem, idx) => (
                  <button
                    key={poem.id}
                    onClick={() => setSelectedPoem(poem)}
                    className="bp-card-in group block w-full text-left transition-all duration-300 hover:-translate-y-0.5"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    {/* 竹简风格卡片 */}
                    <div
                      className="flex items-stretch overflow-hidden rounded-sm"
                      style={{
                        background: "linear-gradient(180deg, #f5f1e8 0%, #ede5d3 100%)",
                        border: "1px solid rgba(184,134,11,0.2)",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.15), inset 0 0 30px rgba(139,105,20,0.04)",
                      }}
                    >
                      {/* 左侧朱色书签条 */}
                      <div
                        className="flex shrink-0 flex-col items-center justify-center px-3 py-4"
                        style={{
                          background: "linear-gradient(180deg, rgba(196,69,54,0.85) 0%, rgba(180,55,45,0.9) 100%)",
                          minWidth: "44px",
                        }}
                      >
                        <span className="title-serif text-xs font-bold text-white/90" style={{ writingMode: "vertical-rl", letterSpacing: "0.2em" }}>
                          {poem.dynasty}
                        </span>
                      </div>

                      {/* 右侧内容 */}
                      <div className="flex-1 px-5 py-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="title-serif text-lg font-bold tracking-wider transition-colors duration-300 sm:text-xl" style={{ color: "var(--color-ink)" }}>
                            {poem.title}
                          </h4>
                          <span className="shrink-0 text-xs title-serif" style={{ color: "var(--color-ink-light)" }}>
                            {poem.author}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-ink-light)", letterSpacing: "0.06em", opacity: 0.8 }}>
                          {previewLine(poem.content)}
                          {poem.content.includes("\n") && " …"}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ color: "var(--color-gold)" }}>
                          <span>展卷阅读</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const bookPavilionStyles = `
  .bp-scroll::-webkit-scrollbar { width: 6px; }
  .bp-scroll::-webkit-scrollbar-track { background: transparent; }
  .bp-scroll::-webkit-scrollbar-thumb { background: rgba(184, 134, 11, 0.25); border-radius: 3px; }
  .bp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(184, 134, 11, 0.45); }

  @keyframes bp-view-fade { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
  .bp-view-in { animation: bp-view-fade 0.4s ease-out forwards; }

  @keyframes bp-card-fade { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
  .bp-card-in { opacity: 0; animation: bp-card-fade 0.4s ease-out forwards; }

  @keyframes bp-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
  .bp-fade-in { opacity: 0; animation: bp-fade 0.5s ease-out forwards; }
`;
