/**
 * 新建文章脚本
 * 用法：npm run new-post
 * 交互式输入标题 → 自动生成 slug 与 frontmatter → 落盘 src/content/posts/{slug}.md
 */
import { createInterface } from "node:readline";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "src", "content", "posts");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

/** 标题 → slug：保留字母数字与中文，其余转连字符；中文标题要求附带英文 slug */
function toSlug(input) {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || null;
}

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const title = (await ask("文章标题: ")).trim();
  if (!title) {
    console.error("❌ 标题不能为空");
    process.exit(1);
  }

  let slug = toSlug(title);
  if (!slug || /[\u4e00-\u9fa5]/.test(slug)) {
    // 含中文 → 要求手动指定英文 slug（URL 友好）
    const manual = (await ask("标题含中文，请输入英文 slug（如 docker-mirror-2026）: ")).trim();
    slug = toSlug(manual);
    if (!slug) {
      console.error("❌ slug 不能为空");
      process.exit(1);
    }
  }

  const description = (await ask("文章描述（description，SEO 用）: ")).trim();
  const tagsRaw = (await ask("标签（逗号分隔，可留空）: ")).trim();
  const tags = tagsRaw
    ? tagsRaw.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
    : [];

  // 检查 slug 冲突
  const existing = await readdir(POSTS_DIR);
  if (existing.some((f) => f === `${slug}.md`)) {
    console.error(`❌ ${slug}.md 已存在，请换一个 slug`);
    process.exit(1);
  }

  const frontmatter = [
    "---",
    `title: ${title}`,
    `pubDatetime: "${nowIso()}"`,
    `description: ${description}`,
    "author: 小吒",
    "tags:",
    ...(tags.length ? tags.map((t) => `  - ${t}`) : ["  []"]),
    "featured: false",
    "draft: false",
    "---",
    "",
    "在这里开始写作…",
    "",
  ].join("\n");

  const file = path.join(POSTS_DIR, `${slug}.md`);
  await writeFile(file, frontmatter, "utf8");
  console.log(`✅ 已创建: ${file}`);
  console.log("   补充正文后运行 npm run typecheck 校验 frontmatter 是否合法。");
}

main().finally(() => rl.close());
