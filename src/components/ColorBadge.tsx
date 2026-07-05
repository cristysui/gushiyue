interface ColorBadgeProps {
  /** 传统色名称 */
  name: string;
  /** 色块十六进制值 */
  hex: string;
}

/**
 * 颜色标签组件：展示传统色名称与对应色块
 */
export default function ColorBadge({ name, hex }: ColorBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 py-1.5">
      <span
        className="h-5 w-5 rounded border border-black/10 shadow-sm"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <div className="flex flex-col leading-tight">
        <span className="title-serif text-sm text-ink">{name}</span>
        <span className="text-[10px] text-muted">{hex}</span>
      </div>
    </div>
  );
}
