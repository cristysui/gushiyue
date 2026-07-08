"use client";

import { useState, useEffect } from "react";
import studyLayoutData from "@/data/study-layout.json";

const LANDSCAPE_W = (studyLayoutData as { refW: number }).refW;
const LANDSCAPE_H = (studyLayoutData as { refH: number }).refH;
const PORTRAIT_W = (studyLayoutData as { portrait?: { refW?: number } }).portrait?.refW ?? LANDSCAPE_H;
const PORTRAIT_H = (studyLayoutData as { portrait?: { refH?: number } }).portrait?.refH ?? LANDSCAPE_W;

export interface SceneScale {
  /** 等比缩放比例（scaleX = scaleY） */
  scale: number;
  /** 画布在容器中的水平偏移（用于居中 letterbox） */
  offsetX: number;
  /** 画布在容器中的垂直偏移 */
  offsetY: number;
  /** 参考分辨率 */
  refW: number;
  refH: number;
  /** 当前是否竖屏 */
  isPortrait: boolean;
}

/**
 * 计算场景等比缩放比例。
 *
 * 核心思路：根据容器宽高比自动检测横屏/竖屏，
 * 横屏使用 1920x1080，竖屏使用 1080x1920 参考分辨率，
 * 通过 transform: scale() 等比缩放到容器大小，
 * 所有图层作为整体一起缩放，相对位置永远不变。
 */
export function useSceneScale(
  containerRef: React.RefObject<HTMLDivElement | null>
): SceneScale {
  const [state, setState] = useState<SceneScale>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    refW: LANDSCAPE_W,
    refH: LANDSCAPE_H,
    isPortrait: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const isPortrait = w < h;
      const refW = isPortrait ? PORTRAIT_W : LANDSCAPE_W;
      const refH = isPortrait ? PORTRAIT_H : LANDSCAPE_H;
      const scale = Math.min(w / refW, h / refH);
      setState({
        scale,
        offsetX: (w - refW * scale) / 2,
        offsetY: (h - refH * scale) / 2,
        refW,
        refH,
        isPortrait,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return state;
}
