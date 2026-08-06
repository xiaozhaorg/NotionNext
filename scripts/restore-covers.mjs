/**
 * 从线上站点 xiaozha.org 恢复每篇文章的原 og:image（AI 生成的主题封面图）
 * 用法：node scripts/restore-covers.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");
const SITE = "https://xiaozha.org";
const CONCURRENCY = 8;

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
console.log(`[restore] 发现 ${files.length} 篇文章，开始从线上抓取 og:image`);

async function fetchOgImage(slug) {
  const url = `${SITE}/article/${slug}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // 匹配 og:image meta 标签（兼容多种属性顺序）
  const m =
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) ||
    html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/);
  return m ? m[1] : null;
}

async function processFile(file) {
  const slug = file.replace(/\.md$/, "");
  const filePath = join(POSTS_DIR, file);
  try {
    const ogImage = await fetchOgImage(slug);
    if (!ogImage) {
      return { slug, ok: false, reason: "no og:image meta" };
    }
    const content = await readFile(filePath, "utf8");
    const newContent = content.replace(
      /^ogImage:\s*.+$/m,
      `ogImage: "${ogImage}"`
    );
    if (newContent === content) {
      return { slug, ok: false, reason: "ogImage 字段未变" };
    }
    await writeFile(filePath, newContent, "utf8");
    return { slug, ok: true, ogImage };
  } catch (e) {
    return { slug, ok: false, reason: e.message };
  }
}

// 并发控制
async function runPool(items, worker, concurrency) {
  const results = [];
  let index = 0;
  const executing = [];
  async function next() {
    if (index >= items.length) return;
    const i = index++;
    const item = items[i];
    const p = Promise.resolve().then(() => worker(item, i));
    results[i] = p;
    const e = p.finally(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    });
    executing.push(e);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
    await next();
  }
  await next();
  return Promise.all(results);
}

const results = await runPool(files, processFile, CONCURRENCY);
const ok = results.filter((r) => r.ok);
const fail = results.filter((r) => !r.ok);

console.log(`\n[restore] 成功 ${ok.length}，失败 ${fail.length}`);
ok.forEach((r) => console.log(`✅ ${r.slug} -> ${r.ogImage}`));
fail.forEach((r) => console.log(`❌ ${r.slug}: ${r.reason}`));
