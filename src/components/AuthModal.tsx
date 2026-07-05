"use client";

import { useState } from "react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: string | null }>;
}

/**
 * 登录/注册弹窗
 * 与古时月国风视觉风格统一
 */
export default function AuthModal({ open, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("请输入邮箱和密码");
      return;
    }
    setLoading(true);
    setError(null);

    const result = mode === "signin"
      ? await onSignIn(email.trim(), password)
      : await onSignUp(email.trim(), password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // 登录成功或注册成功后关闭弹窗
      setEmail("");
      setPassword("");
      setError(null);
      onClose();
    }
  };

  return (
    <div
      className="animate-modal-in fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(28, 25, 23, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-bubble w-full max-w-sm overflow-hidden rounded-2xl ink-border ink-shadow-deep"
        style={{ background: "var(--color-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50"
          style={{ background: "linear-gradient(135deg, rgba(184,134,11,0.06) 0%, transparent 100%)" }}
        >
          <h2 className="title-serif text-xl font-bold text-ink">
            {mode === "signin" ? "登入古時月" : "結緣古時月"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label className="title-serif mb-1.5 block text-xs font-semibold text-muted">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-border/50 bg-surface/30 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/50"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="title-serif mb-1.5 block text-xs font-semibold text-muted">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="w-full rounded-xl border border-border/50 bg-surface/30 px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/50"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-vermillion/20 bg-vermillion/5 px-3 py-2 text-xs text-accent2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-50"
            style={{ background: "var(--color-ink)" }}
          >
            {loading ? "處理中…" : mode === "signin" ? "登入" : "注冊"}
          </button>

          {/* 切换模式 */}
          <div className="text-center text-xs text-muted">
            {mode === "signin" ? (
              <>
                還無帳號？
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="ml-1 title-serif text-accent hover:underline"
                >
                  注冊新帳號
                </button>
              </>
            ) : (
              <>
                已有帳號？
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="ml-1 title-serif text-accent hover:underline"
                >
                  返回登入
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
