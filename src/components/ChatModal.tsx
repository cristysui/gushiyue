"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Ancient {
  id: string; name: string; dynasty: string; birthYear: string;
  title: string; personality: string; bio: string;
  famousWorks: string[]; speakingStyle: string; promptHint: string;
}
interface ChatMessage { role: "user" | "ancient"; content: string }

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  ancient: Ancient | null;
  currentShichenActivity?: string;
  /** 用户登录后的 access_token，用于持久化对话历史 */
  accessToken?: string | null;
}

/**
 * 古人对话弹窗
 * 点击庭院中的古人后弹出
 * 登录后自动加载历史对话并持久化新消息
 */
export default function ChatModal({
  open, onClose, ancient, currentShichenActivity, accessToken,
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!accessToken;

  /**
   * 从 Supabase 加载与该古人的历史对话
   */
  const loadHistory = useCallback(async (ancientId: string, token: string) => {
    try {
      const res = await fetch(`/api/history?ancient_id=${ancientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const history = json.data ?? [];
      if (Array.isArray(history) && history.length > 0) {
        // 将数据库记录转换为 ChatMessage 格式
        return history.map((record: { role: string; content: string }) => ({
          role: record.role === "user" ? "user" as const : "ancient" as const,
          content: record.content,
        }));
      }
    } catch {
      // 静默失败
    }
    return null;
  }, []);

  /**
   * 将一条消息保存到 Supabase
   */
  const saveMessage = useCallback(async (
    ancientId: string,
    role: "user" | "ancient",
    content: string,
    source: string,
    token: string
  ) => {
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ancientId, role, content, source }),
      });
    } catch {
      // 保存失败不影响对话体验
    }
  }, []);

  // 古人变化或弹窗打开时初始化对话
  useEffect(() => {
    if (!ancient || !open) return;

    // 已登录：尝试加载历史对话
    if (accessToken) {
      setHistoryLoaded(false);
      loadHistory(ancient.id, accessToken).then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // 无历史记录，使用问候语
          const greeting = currentShichenActivity
            ? `吾乃${ancient.dynasty}${ancient.name}。方才${currentShichenActivity}，见你来此，甚好。`
            : `吾乃${ancient.dynasty}${ancient.name}。${ancient.bio}`;
          setMessages([{ role: "ancient", content: greeting }]);
        }
        setHistoryLoaded(true);
      });
    } else {
      // 未登录：使用问候语，不持久化
      const greeting = currentShichenActivity
        ? `吾乃${ancient.dynasty}${ancient.name}。方才${currentShichenActivity}，见你来此，甚好。`
        : `吾乃${ancient.dynasty}${ancient.name}。${ancient.bio}`;
      setMessages([{ role: "ancient", content: greeting }]);
      setHistoryLoaded(true);
    }
  }, [ancient, open, currentShichenActivity, accessToken, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !ancient || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    // 已登录：保存用户消息
    if (accessToken) {
      saveMessage(ancient.id, "user", text, "user", accessToken);
    }

    try {
      const res = await fetch("/api/ancient/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ancientId: ancient.id,
          message: text,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      const replyData = json.data ?? json;
      const reply = replyData.reply ?? replyData.content ?? replyData.message ?? "……";
      const source = replyData.source ?? "ai";
      setMessages((prev) => [...prev, { role: "ancient", content: reply }]);

      // 已登录：保存古人回复
      if (accessToken) {
        saveMessage(ancient.id, "ancient", reply, source, accessToken);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ancient", content: "（叹息）此刻思绪难平，稍后再叙。" }]);
    } finally {
      setSending(false);
    }
  };

  if (!open || !ancient) return null;

  return (
    <div
      className="animate-modal-in fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(28, 25, 23, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-bubble flex h-[75vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl ink-border ink-shadow-deep sm:h-[70vh] sm:rounded-2xl"
        style={{ background: "var(--color-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 古人信息头 */}
        <div className="flex items-start justify-between border-b border-border/50 px-5 py-4"
          style={{ background: "linear-gradient(135deg, rgba(184,134,11,0.06) 0%, transparent 100%)" }}
        >
          <div className="flex items-start gap-3">
            {/* 古人头像占位 */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface title-serif text-xl font-bold text-accent"
              style={{ border: "2px solid var(--color-gold)" }}
            >
              {ancient.name[0]}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <h2 className="title-serif text-xl font-bold text-ink">{ancient.name}</h2>
                <span className="text-sm text-accent2">{ancient.dynasty}</span>
              </div>
              <p className="text-xs text-muted">{ancient.title} · {ancient.birthYear}</p>
              {ancient.famousWorks?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ancient.famousWorks.slice(0, 3).map((w, i) => (
                    <span key={`${w}-${i}`} className="rounded border border-border/40 bg-surface/40 px-1.5 py-0.5 text-[10px] text-muted">
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
              aria-label="关闭"
            >
              ✕
            </button>
            {/* 登录状态指示 */}
            <span className={`text-[10px] ${isLoggedIn ? "text-jade" : "text-muted/60"}`}>
              {isLoggedIn ? "● 对话已记录" : "○ 游客模式"}
            </span>
          </div>
        </div>

        {/* 对话区 */}
        <div className="ink-scroll flex-1 space-y-3 overflow-y-auto p-4"
          style={{ background: "linear-gradient(180deg, rgba(245,241,232,0.3) 0%, transparent 100%)" }}
        >
          {!historyLoaded && (
            <div className="flex justify-center py-4">
              <span className="text-xs text-muted">加载历史对话…</span>
            </div>
          )}
          {historyLoaded && messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-br-md bg-ink text-paper"
                    : "rounded-bl-md border border-border/40 bg-card text-ink"
                }`}
              >
                {msg.role === "ancient" && (
                  <p className="title-serif mb-0.5 text-[11px] text-accent2">{ancient.name}</p>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border/40 bg-card px-4 py-3">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 未登录提示 */}
        {historyLoaded && !isLoggedIn && (
          <div className="border-t border-border/30 bg-vermillion/3 px-4 py-1.5 text-center text-[11px] text-muted">
            登入后可保存对话记录，换设备也能继续
          </div>
        )}

        {/* 输入栏 */}
        <div className="border-t border-border/50 bg-surface/20 p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex shrink-0 items-center justify-center rounded-xl border border-border/50 bg-card p-2.5 text-muted hover:text-ink"
              aria-label="发送照片"
              title="发送照片"
            >
              📷
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder={`向${ancient.name}请教…`}
              className="flex-1 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-30"
              style={{ background: "var(--color-ink)" }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
