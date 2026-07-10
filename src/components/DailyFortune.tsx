"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getDailyFortune,
  getZodiacFromBirthYear,
  getDayGanZhi,
  getColorHex,
  type DailyFortune as DailyFortuneData,
} from "@/lib/fortune";

const STORAGE_KEY = "gushiyue-birthdate";

interface Birthdate {
  year: number;
  month: number;
  day: number;
}

interface DailyFortuneProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 日签弹窗
 *
 * 首次打开需填写出生年月日，存于 localStorage（gushiyue-birthdate）；
 * 此后直接据生辰与当日地支关系展示运势。
 * 视觉为古式「签」纸：水墨纸黄底、朱印金线。
 */
export default function DailyFortune({ open, onClose }: DailyFortuneProps) {
  // 生辰：首渲染即从本地存储读取（SSR 时返回 null，避免水合不一致）
  const [birthdate, setBirthdate] = useState<Birthdate | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved) as Birthdate;
        if (p && p.year && p.month && p.day) return p;
      }
    } catch {
      /* 解析失败视为未填写 */
    }
    return null;
  });
  const [userEditing, setUserEditing] = useState(false);

  // 是否处于编辑态：无生辰或用户主动修改
  const editing = !birthdate || userEditing;

  // 运势由生辰推导，无需 effect
  const fortune = useMemo<DailyFortuneData | null>(
    () =>
      birthdate && !userEditing
        ? getDailyFortune(birthdate.year, birthdate.month, birthdate.day)
        : null,
    [birthdate, userEditing],
  );

  const handleClose = useCallback(() => {
    setUserEditing(false);
    onClose();
  }, [onClose]);

  const handleSaved = useCallback((bd: Birthdate) => {
    setBirthdate(bd);
    setUserEditing(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bd));
    } catch {
      /* 存储失败忽略 */
    }
  }, []);

  // ESC 关闭（回调内 setState 不计入 effect 同步告警）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fortuneRise {
              0% { opacity: 0; transform: translateY(28px) scale(0.97); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            .fortune-slip { animation: fortuneRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

            @keyframes fortuneGlow {
              0%, 100% { text-shadow: 0 0 6px rgba(184,134,11,0.18); }
              50% { text-shadow: 0 0 22px rgba(184,134,11,0.40), 0 0 4px rgba(255,255,255,0.35); }
            }
            .fortune-glow { animation: fortuneGlow 2.8s ease-in-out infinite; }

            @keyframes fortuneSealPop {
              0% { opacity: 0; transform: scale(0.5); }
              70% { transform: scale(1.12); }
              100% { opacity: 1; transform: scale(1); }
            }
            .fortune-seal-anim { animation: fortuneSealPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; }

            @keyframes fortuneFadeUp {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .fortune-fade { animation: fortuneFadeUp 0.5s ease-out both; }

            .fortune-input {
              width: 56px; text-align: center;
              background: rgba(255,255,255,0.55);
              border: 1px solid var(--color-border);
              border-radius: 8px;
              padding: 9px 4px;
              font-family: var(--font-serif);
              font-size: 15px; color: var(--color-ink);
              outline: none;
              transition: border-color 0.2s, box-shadow 0.2s;
            }
            .fortune-input:focus {
              border-color: var(--color-gold);
              box-shadow: 0 0 0 3px rgba(184,134,11,0.14);
            }
            .fortune-btn {
              width: 100%; padding: 13px;
              border: none; border-radius: 10px;
              background: linear-gradient(180deg, #c9a227 0%, #b8860b 100%);
              color: #fdfbf6;
              font-family: var(--font-serif);
              font-size: 16px; letter-spacing: 0.3em; font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(184,134,11,0.35);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .fortune-btn:hover { transform: translateY(-2px); box-shadow: 0 7px 20px rgba(184,134,11,0.45); }
            .fortune-btn:active { transform: translateY(0); }
            .fortune-corner-btn {
              display:flex; align-items:center; justify-content:center;
              height: 30px; padding: 0 10px; border-radius: 999px;
              background: rgba(253,251,246,0.7);
              border: 1px solid var(--color-border);
              color: var(--color-ink-light);
              font-size: 12px; cursor: pointer;
              transition: background 0.2s, color 0.2s;
              backdrop-filter: blur(4px);
            }
            .fortune-corner-btn:hover { background: var(--color-card); color: var(--color-ink); }
          `,
        }}
      />

      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-in"
        style={{ background: "rgba(28, 25, 23, 0.95)", backdropFilter: "blur(8px)" }}
        onClick={handleClose}
      >
        {/* 淡月装饰 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "9%",
            right: "13%",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,241,232,0.14) 0%, rgba(245,241,232,0.04) 45%, transparent 72%)",
            pointerEvents: "none",
          }}
        />

        {/* 签纸 */}
        <div
          className="fortune-slip"
          style={{
            position: "relative",
            width: "92%",
            maxWidth: "380px",
            borderRadius: "12px",
            border: "2px solid var(--color-gold)",
            boxShadow:
              "0 0 0 5px rgba(184,134,11,0.18), 0 24px 70px rgba(0,0,0,0.55)",
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(139,105,20,0.045) 32px, rgba(139,105,20,0.045) 33px), linear-gradient(180deg, #f7f2e6 0%, #f1ead7 100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 修改生辰（仅运势页显示） */}
          {!editing && birthdate && (
            <button
              type="button"
              className="fortune-corner-btn"
              style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}
              onClick={() => setUserEditing(true)}
              aria-label="修改生辰"
            >
              修改
            </button>
          )}
          {/* 关闭 */}
          <button
            type="button"
            className="fortune-corner-btn"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              width: 30,
              padding: 0,
            }}
            onClick={handleClose}
            aria-label="关闭"
          >
            ✕
          </button>

          {/* 内框 + 滚动区 */}
          <div
            className="ink-scroll"
            style={{
              margin: 8,
              border: "1px solid rgba(184,134,11,0.32)",
              borderRadius: "7px",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "34px 22px 24px" }}>
              {editing || !fortune ? (
                <BirthdateForm
                  initialBirthdate={birthdate}
                  onSaved={handleSaved}
                />
              ) : (
                <FortuneSlip fortune={fortune} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== 生辰表单（每次进入编辑态重新挂载，自然回填） ===== */

interface BirthdateFormProps {
  initialBirthdate: Birthdate | null;
  onSaved: (bd: Birthdate) => void;
}

function BirthdateForm({
  initialBirthdate,
  onSaved,
}: BirthdateFormProps) {
  const [year, setYear] = useState(
    initialBirthdate ? String(initialBirthdate.year) : "",
  );
  const [month, setMonth] = useState(
    initialBirthdate ? String(initialBirthdate.month) : "",
  );
  const [day, setDay] = useState(
    initialBirthdate ? String(initialBirthdate.day) : "",
  );
  const [error, setError] = useState("");

  const sanitize = (v: string) => v.replace(/[^0-9]/g, "");

  const previewZodiac =
    year && parseInt(year, 10) >= 1900
      ? getZodiacFromBirthYear(parseInt(year, 10))
      : "";

  const handleSubmit = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const now = new Date();

    if (!y || !m || !d) {
      setError("请填写完整的出生年月日");
      return;
    }
    if (y < 1900 || y > now.getFullYear()) {
      setError(`年份请介于 1900 至 ${now.getFullYear()}`);
      return;
    }
    if (m < 1 || m > 12) {
      setError("月份应在 1 ~ 12 之间");
      return;
    }
    if (d < 1 || d > 31) {
      setError("日期应在 1 ~ 31 之间");
      return;
    }

    setError("");
    onSaved({ year: y, month: m, day: d });
  };

  return (
    <div className="fortune-fade">
      {/* 标题 */}
      <div className="text-center">
        <p className="mb-1 text-[11px] tracking-[0.4em] text-muted">古 时 月</p>
        <h2 className="font-title text-3xl text-ink">请书生辰</h2>
        <p className="mt-1 text-xs text-ink-light">以卜今日运程</p>
      </div>

      <Divider />

      {/* 输入 */}
      <div className="mb-3 flex items-end justify-center gap-2">
        <input
          className="fortune-input"
          style={{ width: 74 }}
          inputMode="numeric"
          maxLength={4}
          placeholder="年"
          value={year}
          onChange={(e) => setYear(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <span className="pb-2 text-sm text-ink-light">年</span>
        <input
          className="fortune-input"
          inputMode="numeric"
          maxLength={2}
          placeholder="月"
          value={month}
          onChange={(e) => setMonth(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <span className="pb-2 text-sm text-ink-light">月</span>
        <input
          className="fortune-input"
          inputMode="numeric"
          maxLength={2}
          placeholder="日"
          value={day}
          onChange={(e) => setDay(sanitize(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <span className="pb-2 text-sm text-ink-light">日</span>
      </div>

      {/* 生肖预览 */}
      <div className="mb-2 h-5 text-center">
        {previewZodiac && (
          <span className="title-serif text-sm text-gold">
            属 {previewZodiac}
          </span>
        )}
      </div>

      {/* 错误提示 */}
      <div className="mb-3 h-4 text-center">
        {error && <span className="text-xs text-vermillion">{error}</span>}
      </div>

      {/* 提交 */}
      <button type="button" className="fortune-btn" onClick={handleSubmit}>
        起 签
      </button>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        生辰仅存于本机，用以推算本命生肖与日值关系
      </p>
    </div>
  );
}

/* ===== 签纸运势 ===== */

function FortuneSlip({ fortune }: { fortune: DailyFortuneData }) {
  // 当日干支，作古典点缀
  const ganZhi = useMemo(() => getDayGanZhi(new Date()), []);

  return (
    <div className="fortune-fade">
      {/* 头部：日期 + 生肖 */}
      <div className="text-center">
        <p className="mb-1 text-[11px] tracking-[0.4em] text-muted">
          古 时 月 · 日 签
        </p>
        <p className="title-serif text-base text-ink">{fortune.date}</p>
        <p className="mt-1 text-xs text-ink-light">
          属 {fortune.zodiac} · 今日 {fortune.dayZodiac} 值日 · {ganZhi}
        </p>
      </div>

      <Divider />

      {/* 运势等级 */}
      <div className="my-1 text-center">
        <div
          className="fortune-glow font-title"
          style={{
            color: fortune.ratingColor,
            fontSize: fortune.rating.length === 1 ? "3.8rem" : "3.05rem",
            letterSpacing: "0.1em",
            lineHeight: 1,
            fontWeight: 700,
          }}
        >
          {fortune.rating}
        </div>
        <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-relaxed text-ink-light">
          {fortune.relationship}
        </p>
      </div>

      <Divider />

      {/* 幸运色 / 幸运数 */}
      <div className="my-3 grid grid-cols-2 gap-2">
        <div className="text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-muted">幸 色</p>
          <div className="flex items-center justify-center gap-3">
            {fortune.luckyColors.map((c) => (
              <div key={c} className="flex flex-col items-center gap-1">
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: getColorHex(c),
                    border: "1px solid rgba(45,42,38,0.18)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.14)",
                  }}
                />
                <span className="text-[10px] text-ink-light">{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-muted">幸 数</p>
          <div className="flex items-center justify-center gap-2">
            {fortune.luckyNumbers.map((n) => (
              <span
                key={n}
                className="title-serif flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-ink"
                style={{
                  border: "1px solid var(--color-gold)",
                  background: "rgba(184,134,11,0.08)",
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      {/* 宜 */}
      <div className="mb-3 flex items-start gap-3">
        <span
          className="font-title mt-0.5 text-3xl leading-none"
          style={{ color: "var(--color-jade)" }}
        >
          宜
        </span>
        <div className="flex flex-1 flex-wrap gap-1.5 pt-1">
          {fortune.advice.map((a) => (
            <span
              key={a}
              className="rounded-md px-2.5 py-1 text-[12px]"
              style={{
                color: "var(--color-jade)",
                background: "rgba(107,142,107,0.1)",
                border: "1px solid rgba(107,142,107,0.32)",
              }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* 忌 */}
      <div className="mb-2 flex items-start gap-3">
        <span
          className="font-title mt-0.5 text-3xl leading-none"
          style={{ color: "var(--color-vermillion)" }}
        >
          忌
        </span>
        <div className="flex flex-1 flex-wrap gap-1.5 pt-1">
          {fortune.caution.map((c) => (
            <span
              key={c}
              className="rounded-md px-2.5 py-1 text-[12px]"
              style={{
                color: "var(--color-vermillion)",
                background: "rgba(196,69,54,0.08)",
                border: "1px solid rgba(196,69,54,0.3)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <Divider />

      {/* 古风寄语 */}
      <div className="my-3 text-center">
        <p
          className="font-title text-lg leading-loose text-ink"
          style={{ letterSpacing: "0.08em" }}
        >
          {fortune.message}
        </p>
      </div>

      {/* 朱印 */}
      <div className="mt-4 flex justify-center">
        <span
          className="fortune-seal-anim title-serif"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            borderRadius: "6px",
            background: "var(--color-vermillion)",
            color: "#fdfbf6",
            fontSize: "0.8rem",
            letterSpacing: "0.18em",
            fontWeight: 700,
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow: "0 2px 8px rgba(196,69,54,0.35)",
          }}
        >
          古时月
        </span>
      </div>
    </div>
  );
}

/* ===== 分隔线 ===== */

function Divider() {
  return (
    <div className="my-4 flex items-center gap-2">
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(184,134,11,0.5), transparent)",
        }}
      />
      <span className="text-[10px] text-gold" aria-hidden>
        ❀
      </span>
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(184,134,11,0.5), transparent)",
        }}
      />
    </div>
  );
}
