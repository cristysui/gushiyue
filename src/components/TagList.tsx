interface TagListProps {
  /** 标签文本数组 */
  items: string[];
  /** 样式变体 */
  variant?: "default" | "yi" | "ji";
}

/**
 * 标签列表组件
 */
export default function TagList({ items, variant = "default" }: TagListProps) {
  const variantClass: Record<NonNullable<TagListProps["variant"]>, string> = {
    default: "border-border/60 bg-surface/40 text-ink",
    yi: "border-jade/30 bg-jade/5 text-jade",
    ji: "border-accent2/30 bg-accent2/5 text-accent2",
  };

  if (!items || items.length === 0) {
    return <p className="text-sm text-muted">暂无</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`rounded-md border px-2.5 py-1 text-sm ${variantClass[variant]}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
