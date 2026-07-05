import type { ReactNode } from "react";

interface InkCardProps {
  /** 卡片标题 */
  title: string;
  /** 卡片内容 */
  children: ReactNode;
  /** 可选图标 */
  icon?: string;
  /** 是否强调 */
  accent?: boolean;
  /** 额外类名 */
  className?: string;
}

/**
 * 水墨风格信息卡片
 */
export default function InkCard({
  title,
  children,
  icon,
  accent = false,
  className = "",
}: InkCardProps) {
  return (
    <section
      className={`paper-card overflow-hidden rounded-xl ink-border ink-shadow ${accent ? "border-l-[3px] border-l-accent" : ""} ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
        {icon && <span className="text-base text-muted" aria-hidden="true">{icon}</span>}
        <h2 className="title-serif text-base font-semibold tracking-wide text-ink">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
