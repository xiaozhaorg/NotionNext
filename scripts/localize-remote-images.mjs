/**
 * 本地化正文中的 unsplash 外链图片：
 *   - 按 photoId 去重下载到 public/images/remote/{photoId}.webp（1080w, webp）
 *   - 替换所有文章的引用为本地路径；下载失败保留原链接并报告
 * 用法：node scripts/localize-remote-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIRS = ["src/content/posts", "src/content/posts-en"];
const OUT_DIR = path.join(ROOT, "public/images/remote");
const CONCURRENCY = 6;
const TIMEOUT = 30000;

const URL_RE = /https:\/\/images\.unsplash\.com\/photo-([a-zA-Z0-9-]+)[^)\s]*/g;

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), TIMEOUT);
      const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } });
      clearTimeout(tm);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function main() {
  // 1. 收集所有引用
  const refs = new Map(); // photoId → Set<file>
  for (const dir of DIRS) {
    const files = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(ROOT, dir, file), "utf-8");
      for (const m of raw.matchAll(URL_RE)) {
        const id = m[1];
        if (!refs.has(id)) refs.set(id, new Set());
        refs.get(id).add(path.join(ROOT, dir, file));
      }
    }
  }
  const ids = [...refs.keys()];
  console.log(`🎯 去重后 ${ids.length} 张 unsplash 图片（引用 ${[...refs.values()].reduce((a, s) => a + s.size, 0)} 处）\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 2. 下载（并发，跳过已存在）
  const failed = [];
  let downloaded = 0;
  const queue = [...ids];
  const workers = Array.from({ length: Math.min(CONCURRENCY, ids.length) }, async () => {
    while (queue.length) {
      const id = queue.shift();
      const fp = path.join(OUT_DIR, `${id}.webp`);
      if (fs.existsSync(fp) && fs.statSync(fp).size > 0) continue;
      try {
        const buf = await fetchWithRetry(`https://images.unsplash.com/photo-${id}?w=1080&q=50&fmt=webp&fm=webp`);
        fs.writeFileSync(fp, buf);
        downloaded++;
        process.stdout.write(`  ✅ ${id}.webp (${(buf.length / 1024).toFixed(0)}KB)\n`);
      } catch (e) {
        failed.push(id);
        console.warn(`  ⚠ 下载失败：${id}（${e.message}）`);
      }
    }
  });
  await Promise.all(workers);

  // 3. 替换引用（仅替换下载成功的；失败保留原外链）
  const okIds = new Set(ids.filter((id) => !failed.includes(id)));
  let replaced = 0;
  for (const [id, files] of refs) {
    if (!okIds.has(id)) continue;
    const local = `/images/remote/${id}.webp`;
    for (const file of files) {
      const raw = fs.readFileSync(file, "utf-8");
      const out = raw.replace(URL_RE, (full, pid) => (pid === id ? local : full));
      if (out !== raw) {
        fs.writeFileSync(file, out, "utf-8");
        replaced++;
      }
    }
  }

  console.log(`\n✅ 下载 ${downloaded} 张，替换引用 ${replaced} 处`);
  if (failed.length) {
    console.warn(`\n⚠ 失败 ${failed.length} 张（保留原外链）：${failed.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("🎉 全部本地化成功");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
