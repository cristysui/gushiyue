"use client";

import type { ReactNode } from "react";

interface ScrollModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 卷轴标题 */
  title: string;
  /** 卷轴副标题 */
  subtitle?: string;
  /** 内容 */
  children: ReactNode;
  /** 印章文字 */
  sealText?: string;
}

/**
 * 古式卷轴弹窗
 * 模拟竹简卷轴展开效果，顶部和底部有木质卷轴杆
 */
export default function ScrollModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  sealText,
}: ScrollModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-modal-in"
      style={{ background: "rgba(28, 25, 23, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="animate-scroll-open relative my-8 max-h-[88vh] w-[92%] max-w-lg overflow-hidden rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部卷轴杆 */}
        <div
          className="flex h-7 items-center justify-center rounded-t-lg"
          style={{
            background: "linear-gradient(180deg, #8b6914 0%, #6b4f0e 50%, #8b6914 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="h-2 w-16 rounded-full bg-black/20" />
        </div>

        {/* 卷轴主体 */}
        <div
          className="ink-scroll max-h-[calc(88vh-3.5rem)] overflow-y-auto px-8 py-6"
          style={{
            background: "linear-gradient(180deg, #f4ead4 0%, #f0e4cc 100%)",
            backgroundImage: `
              linear-gradient(180deg, rgba(244, 234, 212, 1) 0%, rgba(240, 228, 204, 1) 100%),
              repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139, 105, 20, 0.04) 28px, rgba(139, 105, 20, 0.04) 29px)
            `,
          }}
        >
          {/* 标题区 */}
          <div className="mb-5 text-center">
            <div className="mb-2 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-scroll-edge/30" />
              {sealText && <span className="seal">{sealText}</span>}
              <span className="h-px w-12 bg-scroll-edge/30" />
            </div>
            <h2 className="title-serif text-2xl font-bold tracking-widest text-ink">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            )}
          </div>

          {/* 内容区 */}
          <div className="space-y-4">{children}</div>

          {/* 底部装饰 */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-xs text-scroll-edge/40">❀</span>
          </div>
        </div>

        {/* 底部卷轴杆 */}
        <div
          className="flex h-7 items-center justify-center rounded-b-lg"
          style={{
            background: "linear-gradient(180deg, #8b6914 0%, #6b4f0e 50%, #8b6914 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div className="h-2 w-16 rounded-full bg-black/20" />
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted transition-colors hover:bg-card hover:text-ink"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
