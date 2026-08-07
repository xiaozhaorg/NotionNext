/**
 * 从文章正文提取第一张 Unsplash 图片作为封面
 * 下载图片到 public/images/ 并更新 frontmatter 的 ogImage
 * 用法：node scripts/extract-cover-images.mjs
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");
const IMAGES_DIR = join(process.cwd(), "public", "images");
const CONCURRENCY = 8;

await mkdir(IMAGES_DIR, { recursive: true });

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
console.log(`[extract] 发现 ${files.length} 篇文章`);

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
  return buffer.length;
}

async function processFile(file) {
  const slug = file.replace(/\.md$/, "");
  const filePath = join(POSTS_DIR, file);

  // 读取文件
  const content = await readFile(filePath, "utf8");

  // 匹配文章正文中的第一张 Unsplash 图片（跳过文末相关推荐区域）
  // 查找第一个 ![...](https://images.unsplash.com/...) 或直接 http 链接的图片
  const imgRegex = /!\[.*?\]\((https?:\/\/[^)]+\.(?:unsplash\.com|pexels\.com|pixabay\.com|picsum\.photos)[^)]+)\)/;
  const match = content.match(imgRegex);

  if (!match) {
    return { slug, ok: false, reason: "no image found in body" };
  }

  const imageUrl = match[1];
  const extMatch = imageUrl.match(/\.(jpg|jpeg|png|webp)/i);
  const ext = extMatch ? extMatch[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
  const localFileName = `${slug}-real.${ext}`;
  const localPath = join(IMAGES_DIR, localFileName);
  const publicPath = `/images/${localFileName}`;

  try {
    // 下载图片
    const size = await downloadImage(imageUrl, localPath);
    console.log(`  Downloaded ${slug}: ${(size / 1024).toFixed(1)}KB -> ${localFileName}`);

    // 更新 frontmatter 中的 ogImage
    const newContent = content.replace(
      /^ogImage:\s*.+$/m,
      `ogImage: "${publicPath}"`
    );

    if (newContent === content) {
      return { slug, ok: false, reason: "ogImage not updated" };
    }

    await writeFile(filePath, newContent, "utf8");
    return { slug, ok: true, imageUrl, publicPath };
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

console.log(`\n[extract] 成功 ${ok.length}，失败 ${fail.length}`);
ok.forEach((r) => console.log(`✅ ${r.slug} -> ${r.publicPath}`));
if (fail.length > 0) {
  console.log("\n❌ 失败列表：");
  fail.forEach((r) => console.log(`   ${r.slug}: ${r.reason}`));
}
