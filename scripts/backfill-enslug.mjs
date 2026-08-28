/**
 * 补齐中英文文章的互指 frontmatter：
 *   1. 中文文章全部补 enSlug（与英文文章同名，hi-welcome → hello-world 特殊映射）
 *   2. 修正英文 hello-world 的 zhSlug（原指向不存在的 hello-world，应为 hi-welcome）
 * 用法：node scripts/backfill-enslug.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ZH_DIR = path.join(ROOT, "src/content/posts");
const EN_DIR = path.join(ROOT, "src/content/posts-en");

// zh slug → en slug 特殊映射（slug 不同名的情况）
const SPECIAL = { "hi-welcome": "hello-world" };

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  return { fmRaw: m[1], head: md.slice(0, m[0].length), body: md.slice(m[0].length) };
}

async function injectKey(file, key, value) {
  const raw = await fs.readFile(file, "utf-8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    console.warn(`  ⚠ 无 frontmatter，跳过：${path.basename(file)}`);
    return false;
  }
  if (new RegExp(`^${key}:`, "m").test(parsed.fmRaw)) {
    console.log(`  · 已有 ${key}，跳过：${path.basename(file)}`);
    return false;
  }
  const fm = parsed.fmRaw + `\n${key}: "${value}"`;
  const out = `---\n${fm}\n---\n${parsed.body}`;
  await fs.writeFile(file, out, "utf-8");
  console.log(`  ✅ ${path.basename(file)} → ${key}: "${value}"`);
  return true;
}

async function replaceKey(file, key, value) {
  const raw = await fs.readFile(file, "utf-8");
  const re = new RegExp(`^(${key}:\\s*")([^"]*)(")`, "m");
  if (!re.test(raw)) {
    console.warn(`  ⚠ ${path.basename(file)} 无 ${key} 字段`);
    return false;
  }
  const out = raw.replace(re, `$1${value}$3`);
  await fs.writeFile(file, out, "utf-8");
  console.log(`  ✅ ${path.basename(file)} ${key} → "${value}"`);
  return true;
}

async function main() {
  const zhFiles = (await fs.readdir(ZH_DIR)).filter((f) => f.endsWith(".md")).sort();
  const enSlugs = new Set(
    (await fs.readdir(EN_DIR)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
  );

  console.log(`🎯 中文文章 ${zhFiles.length} 篇，开始补 enSlug\n`);
  let ok = 0;
  for (const file of zhFiles) {
    const slug = file.replace(/\.md$/, "");
    const enSlug = SPECIAL[slug] ?? slug;
    if (!enSlugs.has(enSlug)) {
      console.warn(`  ⚠ 无对应英文文章（${enSlug}），跳过：${file}`);
      continue;
    }
    if (await injectKey(path.join(ZH_DIR, file), "enSlug", enSlug)) ok++;
  }

  console.log(`\n✅ 中文文章补 enSlug：${ok} 篇`);
  console.log(`\n🎯 修正英文 hello-world 的 zhSlug\n`);
  await replaceKey(path.join(EN_DIR, "hello-world.md"), "zhSlug", "hi-welcome");
  console.log("\n完成。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
