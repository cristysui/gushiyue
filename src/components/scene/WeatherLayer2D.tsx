"use client";

import { useMemo } from "react";

// ===== 天气类型 =====
export type WeatherType = "clear" | "petals" | "rain" | "snow";

interface WeatherLayer2DProps {
  type?: WeatherType;
  intensity?: number; // 0-1
}

/**
 * 2D 天气粒子层（纯 CSS 实现）
 * 花瓣 / 雨 / 雪，覆盖在场景上方
 * 动画定义在 globals.css 中
 */
export default function WeatherLayer2D({ type = "petals", intensity = 0.4 }: WeatherLayer2DProps) {
  const particles = useMemo(() => {
    if (type === "clear") return [];
    const count = Math.floor(intensity * (type === "rain" ? 60 : type === "snow" ? 40 : 20));
    return Array.from({ length: count }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = type === "rain" ? 0.6 + Math.random() * 0.4 : 4 + Math.random() * 6;
      const size = type === "rain" ? 1 + Math.random() * 2 : type === "snow" ? 3 + Math.random() * 4 : 6 + Math.random() * 6;
      const opacity = 0.4 + Math.random() * 0.5;
      const drift = (Math.random() - 0.5) * 100;
      return { id: i, left, delay, duration, size, opacity, drift };
    });
  }, [type, intensity]);

  if (type === "clear" || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: type === "rain" ? `${p.size * 8}px` : `${p.size}px`,
            opacity: p.opacity,
            animation: `${type}-fall ${p.duration}s linear ${p.delay}s infinite`,
            // @ts-expect-error custom CSS property
            "--drift": `${p.drift}px`,
            background:
              type === "rain"
                ? "linear-gradient(to bottom, transparent, rgba(155, 181, 192, 0.7))"
                : type === "snow"
                ? "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.3))"
                : "radial-gradient(ellipse, rgba(232, 160, 176, 0.8), rgba(232, 160, 176, 0.2))",
            borderRadius: type === "petals" ? "50% 0 50% 0" : "50%",
            transform: type === "petals" ? `rotate(${p.id * 30}deg)` : "none",
          }}
        />
      ))}
    </div>
  );
}
