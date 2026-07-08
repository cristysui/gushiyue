#!/usr/bin/env python3
"""
一键抠图工具 v2 —— 优化版
- 使用 isnet-anime 模型（更适合卡通/Q版风格）
- 关闭 alpha matting 避免内部空洞
- 自动填充内部小空洞
- 去除边缘白边残留
用法:
  python3 remove_bg2.py <图片或文件夹路径>
"""

import sys
import os
from pathlib import Path
from rembg import remove, new_session
from PIL import Image, ImageFilter, ImageMorph
import io
import numpy as np

SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

def has_alpha(img: Image.Image) -> bool:
    return img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)

def is_mostly_transparent(img: Image.Image) -> bool:
    if not has_alpha(img):
        return False
    rgba = img.convert("RGBA")
    alpha = rgba.split()[3]
    total = rgba.width * rgba.height
    transparent = total - sum(alpha.histogram()[255:])
    return transparent / total > 0.3

def fill_internal_holes(img: Image.Image) -> Image.Image:
    """填充 alpha 通道内部的小空洞（防止衣服褶皱等被误删）"""
    rgba = img.convert("RGBA")
    alpha = rgba.split()[3]

    # 将 alpha 转为二值图
    binary = alpha.point(lambda p: 255 if p > 30 else 0)

    # 用形态学闭运算填充内部空洞
    # 先膨胀再腐蚀
    kernel_size = 7
    dilated = binary.filter(ImageFilter.MaxFilter(kernel_size))
    filled = dilated.filter(ImageFilter.MinFilter(kernel_size))

    # 合并：原 alpha 中透明的位置，如果 filled 中是不透明的，说明是内部空洞，填充
    original_arr = np.array(alpha)
    filled_arr = np.array(filled)

    # 内部空洞 = 原透明但填充后不透明
    internal_holes = (original_arr < 128) & (filled_arr >= 128)
    new_alpha = original_arr.copy()
    new_alpha[internal_holes] = 255  # 填充为不透明

    # 重建图像
    result = Image.new("RGBA", rgba.size)
    result.paste(rgba, (0, 0))
    result.putalpha(Image.fromarray(new_alpha, mode="L"))
    return result

def remove_white_edges(img: Image.Image) -> Image.Image:
    """去除边缘白边残留（将半透明像素的颜色降低白色成分）"""
    rgba = img.convert("RGBA")
    arr = np.array(rgba).astype(np.float32)

    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

    # 对边缘半透明像素（alpha 30-250），减少白色影响
    edge_mask = (a > 30) & (a < 250)
    # 计算亮度
    brightness = (r + g + b) / 3
    # 如果边缘像素偏白（亮度 > 200），降低其不透明度
    white_edge = edge_mask & (brightness > 200)
    a[white_edge] = a[white_edge] * 0.3

    # 对不透明像素，如果接近白色且在边缘附近，也适当降低
    # 但保留主体内部的白色（如衣服）
    arr[:,:,3] = a

    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")

def process_image(input_path: str, session=None) -> bool:
    input_path = Path(input_path)
    ext = input_path.suffix.lower()

    if ext not in SUPPORTED_EXT:
        print(f"  ⏭️  跳过: {input_path.name}")
        return False

    output_path = input_path.with_suffix(".png")

    # 跳过已处理的
    if output_path.exists():
        try:
            existing = Image.open(output_path)
            if is_mostly_transparent(existing):
                print(f"  ⏭️  已处理，跳过: {output_path.name}")
                return False
        except Exception:
            pass

    try:
        input_img = Image.open(input_path)
    except Exception as e:
        print(f"  ❌ 读取失败: {input_path.name} — {e}")
        return False

    if ext == ".png" and is_mostly_transparent(input_img):
        print(f"  ⏭️  已是透明图: {input_path.name}")
        return False

    print(f"  🔄 处理中: {input_path.name} ...", end=" ", flush=True)

    try:
        # rembg 处理 - 不使用 alpha matting（避免内部空洞）
        img_bytes = io.BytesIO()
        input_img.convert("RGB").save(img_bytes, format="PNG")
        img_bytes.seek(0)

        kwargs = {}
        if session:
            kwargs["session"] = session

        output_bytes = remove(img_bytes.read(), **kwargs)
        result = Image.open(io.BytesIO(output_bytes))

        # 后处理：填充内部空洞
        result = fill_internal_holes(result)

        # 后处理：去除边缘白边
        result = remove_white_edges(result)

        # 保存
        result.save(output_path, "PNG")

        rgba = result.convert("RGBA")
        alpha = rgba.split()[3]
        transparent_count = sum(alpha.histogram()[:255])
        total = rgba.width * rgba.height
        pct = transparent_count / total * 100
        print(f"✅ 透明度 {pct:.0f}% → {output_path.name}")

        return True

    except Exception as e:
        print(f"❌ 失败: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("用法: python3 remove_bg2.py <图片或文件夹路径>")
        sys.exit(1)

    target = sys.argv[1]
    target_path = Path(target)

    if not target_path.exists():
        print(f"❌ 路径不存在: {target}")
        sys.exit(1)

    files = []
    if target_path.is_file():
        files = [str(target_path)]
    else:
        for f in sorted(target_path.iterdir()):
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXT:
                files.append(str(f))

    if not files:
        print("⚠️  没有找到可处理的图片文件")
        sys.exit(0)

    print(f"📋 找到 {len(files)} 张图片\n")

    print("⏳ 加载 AI 模型 (isnet-anime，适合卡通/Q版风格)...\n")
    session = new_session("isnet-anime")

    success = 0
    for f in files:
        if process_image(f, session):
            success += 1

    print(f"\n✨ 完成！共处理 {success} 张图片")

if __name__ == "__main__":
    main()
