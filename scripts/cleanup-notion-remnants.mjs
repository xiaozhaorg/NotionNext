/**
 * 清理中文文章中的 Notion 迁移残留：
 *   1. [上一篇...](/article/x)[下一篇...](/article/y) 导航块（含多行形态）
 *   2. NotionNext 尾部声明块（- **作者:** / - **链接:** / - **声明:**）
 *   3. "相关文章" 块
 *   4. 正文开头的 ![image](/images/xxx.jpg?t=...) 封面冗余行
 *   5. /images/ 引用中的 ?t= 缓存参数
 * 用法：node scripts/cleanup-notion-remnants.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");

function cleanBody(body) {
  let stats = { prev: 0, next: 0, related: 0, author: 0, cover: 0, tparam: 0 };

  // 1. [上一篇/下一篇] 导航块（可能跨多行，循环删到没有）
  let m;
  while ((m = /\[上一篇[\s\S]*?\]\(\/article\/[^)\s]*\)/.exec(body))) {
    body = body.slice(0, m.index) + body.slice(m.index + m[0].length);
    stats.prev++;
  }
  while ((m = /\[下一篇[\s\S]*?\]\(\/article\/[^)\s]*\)/.exec(body))) {
    body = body.slice(0, m.index) + body.slice(m.index + m[0].length);
    stats.next++;
  }

  // 2. 尾部声明块（作者/链接/声明）
  body = body.replace(
    /\n?- \*\*作者:\*\*[^\n]*\n- \*\*链接:\*\*[^\n]*\n- \*\*声明:\*\*[^\n]*\n?/g,
    (x) => {
      stats.author++;
      return "\n";
    }
  );

  // 3. "相关文章" 块（标题 + 空行 + 链接）
  body = body.replace(
    /\n?相关文章\s*\n+\[[\s\S]*?\]\(\/article\/[^)\s]*\)\s*/g,
    (x) => {
      stats.related++;
      return "\n";
    }
  );

  // 4. 正文封面冗余行 ![image](/images/xxx.jpg?t=...)
  body = body.replace(/^!\[image\]\(\/images\/[^)]*\)\s*$/gm, (x) => {
    stats.cover++;
    return "";
  });

  // 5. /images/ 引用去掉 ?t= 缓存参数
  body = body.replace(/(\/images\/[^)?\s]+)\?t=[0-9a-fA-F-]+/g, (_, p) => {
    stats.tparam++;
    return p;
  });

  // 6. 收尾：多余空行、首尾空白
  body = body.replace(/\n{3,}/g, "\n\n").trim() + "\n";
  return { body, stats };
}

async function main() {
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith(".md")).sort();
  let total = { prev: 0, next: 0, related: 0, author: 0, cover: 0, tparam: 0 };
  let changed = 0;

  for (const file of files) {
    const fp = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(fp, "utf-8");
    const { body, stats } = cleanBody(raw);
    const sum = Object.values(stats).reduce((a, b) => a + b, 0);
    if (sum === 0) continue;
    await fs.writeFile(fp, body, "utf-8");
    changed++;
    for (const [k, v] of Object.entries(stats)) total[k] += v;
    console.log(
      `✅ ${file}: 上一篇×${stats.prev} 下一篇×${stats.next} 相关文章×${stats.related} 声明×${stats.author} 封面行×${stats.cover} ?t=×${stats.tparam}`
    );
  }

  console.log(`\n🎯 共清理 ${changed} 篇`);
  console.log(JSON.stringify(total));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
