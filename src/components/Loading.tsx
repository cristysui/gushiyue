/**
 * 加载状态组件：水墨风格
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-24">
      <div className="relative h-14 w-14">
        <div className="h-14 w-14 rounded-full border-2 border-border/50" />
        <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-t-2 border-accent" />
      </div>
      <p className="title-serif text-sm tracking-widest text-muted">墨研中…</p>
    </div>
  );
}
