#!/usr/bin/env node
/**
 * 布局同步脚本
 *
 * 监听 ~/Downloads/study-layout-export.json 文件变化，
 * 自动同步到项目的 src/data/study-layout.json
 *
 * 用法: node scripts/sync-layout.mjs
 *
 * 在 Debug 模式下点"保存到文件"会触发文件下载到 Downloads 目录，
 * 本脚本自动捕获并写入项目文件，实现实时修改布局配置。
 */
import fs from "fs";
import path from "path";
import os from "os";

const WATCH_FILE = path.join(os.homedir(), "Downloads", "study-layout-export.json");
const TARGET_FILE = path.resolve(process.argv[2] || "./src/data/study-layout.json");

console.log("布局同步守护进程");
console.log(`  监听: ${WATCH_FILE}`);
console.log(`  目标: ${TARGET_FILE}`);
console.log("  在 Debug 模式点「保存到文件」即可自动同步\n");

let lastMtime = 0;

function sync() {
  try {
    const stat = fs.statSync(WATCH_FILE);
    if (stat.mtimeMs === lastMtime) return;
    lastMtime = stat.mtimeMs;

    const content = fs.readFileSync(WATCH_FILE, "utf-8");
    const data = JSON.parse(content);

    // 验证格式
    if (!data.assets || !Array.isArray(data.assets)) {
      console.error("  ✗ 格式错误: 缺少 assets 数组");
      return;
    }

    // 写入目标文件
    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  ✓ 已同步 ${data.assets.length} 个素材 → ${path.basename(TARGET_FILE)}  [${new Date().toLocaleTimeString("zh-CN")}]`);
  } catch (e) {
    if (e.code !== "ENOENT") {
      console.error("  ✗ 同步失败:", e.message);
    }
  }
}

// 初次尝试
sync();

// 轮询监听（fs.watch 在 macOS 下载目录不稳定）
setInterval(sync, 1000);

console.log("  等待中...\n");
