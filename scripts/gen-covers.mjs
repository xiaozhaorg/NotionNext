/**
 * 封面图批量生成脚本
 * 为每篇文章生成 1280x720 的 JPG 封面图（含博客头像、标题、描述、标签，无 AI 水印）
 *
 * 用法：
 *   node scripts/gen-covers.mjs            # 生成所有缺失的封面图
 *   node scripts/gen-covers.mjs --force    # 强制重新生成全部
 *   node scripts/gen-covers.mjs --slug=xxx # 只生成指定 slug
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const POSTS_DIR = join(process.cwd(), "src", "content", "posts");
const IMAGES_DIR = join(process.cwd(), "public", "images");

const FORCE = process.argv.includes("--force");
const SLUG_ARG = process.argv.find((a) => a.startsWith("--slug="));
const ONLY_SLUG = SLUG_ARG ? SLUG_ARG.split("=")[1] : null;
// --only=slug1,slug2,slug3 仅生成指定 slug 列表（用于补生成失效的文章）
const ONLY_ARG = process.argv.find((a) => a.startsWith("--only="));
const ONLY_SET = ONLY_ARG ? new Set(ONLY_ARG.split("=")[1].split(",").map(s => s.trim()).filter(Boolean)) : null;

// ===== 12 套主题渐变（与 Card.astro 保持一致）=====
const GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
  ["#a8edea", "#fed6e3"],
  ["#ff9a9e", "#fecfef"],
  ["#ffecd2", "#fcb69f"],
  ["#5ee7df", "#b490ca"],
  ["#c471f5", "#fa71cd"],
  ["#48c6ef", "#6f86d6"],
];

// ===== 工具函数 =====
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function escapeXml(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}

const FONT_FAMILY =
  "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', system-ui, -apple-system, sans-serif";
const MONO_FAMILY = "'Cascadia Code', 'Consolas', ui-monospace, monospace";

/**
 * 按字符宽度换行（中文=1，英文/数字≈0.55）
 * @param {string} text
 * @param {number} maxUnits 每行最大宽度单位
 * @param {number} maxLines 最大行数
 */
function wrapText(text, maxUnits, maxLines) {
  const lines = [];
  let current = "";
  let width = 0;
  for (const ch of text) {
    const w = /[\u4e00-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ch) ? 1 : 0.55;
    if (width + w > maxUnits && current) {
      lines.push(current);
      current = ch;
      width = w;
      if (lines.length >= maxLines) break;
    } else {
      current += ch;
      width += w;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // 最后一行加省略号（如果被截断）
  if (lines.length === maxLines) {
    const origLen = text.length;
    const kept = lines.join("").length;
    if (kept < origLen) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…";
    }
  }
  return lines;
}

// ===== frontmatter 解析（正则，无需 gray-matter）=====
function parseFrontmatter(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return { frontmatter: {}, body: content, raw: "" };
  const raw = fmMatch[1];
  const body = content.slice(fmMatch[0].length);
  const fm = {};
  // 简单解析：title / description / ogImage（单行字符串）
  const titleM = raw.match(/^title:\s*(.+?)\s*$/m);
  if (titleM) fm.title = titleM[1].replace(/^["']|["']$/g, "");
  const descM = raw.match(/^description:\s*(.+?)\s*$/m);
  if (descM) fm.description = descM[1].replace(/^["']|["']$/g, "");
  const ogM = raw.match(/^ogImage:\s*(.+?)\s*$/m);
  if (ogM) fm.ogImage = ogM[1].replace(/^["']|["']$/g, "");
  const dateM = raw.match(/^pubDatetime:\s*["']?(.+?)["']?\s*$/m);
  if (dateM) fm.pubDatetime = dateM[1];
  // tags（YAML 列表）
  const tagsM = raw.match(/^tags:\s*\r?\n((?:\s*-\s*.+\r?\n?)+)/m);
  if (tagsM) {
    fm.tags = tagsM[1]
      .split("\n")
      .map((l) => l.match(/^\s*-\s*(.+?)\s*$/)?.[1])
      .filter(Boolean);
  }
  return { frontmatter: fm, body, raw };
}

function updateOgImage(content, newOgImage) {
  if (/^ogImage:\s*.+$/m.test(content)) {
    return content.replace(/^ogImage:\s*.+$/m, `ogImage: "${newOgImage}"`);
  }
  // 没有 ogImage 字段，在 frontmatter 末尾插入（--- 之前）
  return content.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (_, inner) => `---\n${inner}\nogImage: "${newOgImage}"\n---`);
}

// ===== SVG 生成 =====
function buildSvg({ title, description, tags, pubDatetime }) {
  const [c1, c2] = GRADIENTS[hashStr(title) % GRADIENTS.length];
  const titleLines = wrapText(title, 18, 3);
  const descLines = wrapText(description || "", 44, 2);
  const tagsList = (tags || []).slice(0, 4);

  // 标题区域 Y 起始
  const titleY = 250;
  const titleLineHeight = 72;
  const titleBlockHeight = titleLines.length * titleLineHeight;
  const descY = titleY + titleBlockHeight + 20;
  const descLineHeight = 34;

  // 标签胶囊布局
  let tagOffsetX = 0;
  const tagSpacing = 12;
  const tagElements = tagsList.map((tag) => {
    const label = `#${tag}`;
    // 估算宽度：中文 14px*字数 + 英文 8px*字数 + padding 24
    const cjkCount = (tag.match(/[\u4e00-\u9fff\uff00-\uffef]/g) || []).length;
    const otherCount = tag.length - cjkCount;
    const tagWidth = Math.max(70, cjkCount * 15 + otherCount * 8 + 32);
    const el = `<g transform="translate(${tagOffsetX},0)"><rect width="${tagWidth}" height="34" rx="17" fill="#ffffff" fill-opacity="0.16"/><text x="${tagWidth / 2}" y="23" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="14" font-weight="600" fill="#ffffff">${escapeXml(label)}</text></g>`;
    tagOffsetX += tagWidth + tagSpacing;
    return el;
  });

  // 日期格式化
  let dateStr = "";
  try {
    dateStr = new Date(pubDatetime).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (_) {}

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f6df5"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- 装饰圆 -->
  <circle cx="1150" cy="90" r="150" fill="#ffffff" opacity="0.08"/>
  <circle cx="1230" cy="640" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="90" cy="680" r="110" fill="#ffffff" opacity="0.07"/>
  <circle cx="640" cy="360" r="380" fill="#ffffff" opacity="0.03"/>

  <!-- 顶部：博客头像 + 站名 -->
  <g transform="translate(64, 52)">
    <circle cx="36" cy="36" r="36" fill="url(#avatarGrad)"/>
    <text x="36" y="50" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="38" font-weight="800" fill="#ffffff">吒</text>
    <text x="92" y="30" font-family="${FONT_FAMILY}" font-size="26" font-weight="800" fill="#ffffff">小吒博客</text>
    <text x="92" y="56" font-family="${MONO_FAMILY}" font-size="15" font-weight="500" fill="#ffffff" opacity="0.85">xiaozha.org</text>
  </g>

  <!-- 顶部装饰横线 -->
  <line x1="64" y1="168" x2="200" y2="168" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>

  <!-- 标题 -->
  <g transform="translate(64, ${titleY})">
    ${titleLines.map((line, i) => `<text x="0" y="${i * titleLineHeight}" font-family="${FONT_FAMILY}" font-size="58" font-weight="800" fill="#ffffff" filter="url(#cardShadow)">${escapeXml(line)}</text>`).join("\n    ")}
  </g>

  <!-- 描述 -->
  <g transform="translate(64, ${descY})">
    ${descLines.map((line, i) => `<text x="0" y="${i * descLineHeight}" font-family="${FONT_FAMILY}" font-size="24" font-weight="400" fill="#ffffff" opacity="0.88">${escapeXml(line)}</text>`).join("\n    ")}
  </g>

  <!-- 底部：标签 -->
  ${tagsList.length > 0 ? `<g transform="translate(64, 624)">${tagElements.join("")}</g>` : ""}

  <!-- 底部右侧：日期 + URL -->
  <text x="1216" y="640" text-anchor="end" font-family="${FONT_FAMILY}" font-size="16" font-weight="500" fill="#ffffff" opacity="0.75">${escapeXml(dateStr)}</text>
  <text x="1216" y="666" text-anchor="end" font-family="${MONO_FAMILY}" font-size="14" font-weight="500" fill="#ffffff" opacity="0.65">xiaozha.org</text>
</svg>`;
}

// ===== 主流程 =====
async function main() {
  await mkdir(IMAGES_DIR, { recursive: true });
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`[gen-covers] 发现 ${files.length} 篇文章`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    if (ONLY_SLUG && ONLY_SLUG !== slug) continue;
    if (ONLY_SET && !ONLY_SET.has(slug)) continue;

    const outPath = join(IMAGES_DIR, `${slug}-cover.jpg`);
    if (existsSync(outPath) && !FORCE) {
      skipped++;
      continue;
    }

    const filePath = join(POSTS_DIR, file);
    const content = await readFile(filePath, "utf8");
    const { frontmatter } = parseFrontmatter(content);
    const { title, description, tags, pubDatetime } = frontmatter;

    if (!title) {
      console.warn(`[gen-covers] ⚠️ ${slug}: 缺少 title，跳过`);
      failed++;
      continue;
    }

    try {
      const svg = buildSvg({ title, description, tags, pubDatetime });
      // 调试：保存 SVG 源文件
      const svgPath = join(IMAGES_DIR, `${slug}-cover.svg`);
      await writeFile(svgPath, svg, "utf8");
      await sharp(Buffer.from(svg, "utf8"), { density: 144 })
        .resize(1280, 720, { fit: "fill" })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(outPath);

      // 更新 frontmatter ogImage
      const newOgImage = `/images/${slug}-cover.jpg`;
      const newContent = updateOgImage(content, newOgImage);
      if (newContent !== content) {
        await writeFile(filePath, newContent, "utf8");
      }
      generated++;
      console.log(`[gen-covers] ✅ ${slug} -> ${newOgImage}`);
    } catch (err) {
      console.error(`[gen-covers] ❌ ${slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[gen-covers] 完成：生成 ${generated}，跳过 ${skipped}，失败 ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
