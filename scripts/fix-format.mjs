/**
 * 自动修复 Notion 迁移造成的排版问题
 * 处理两类确定性问题（低风险）：
 *   1. 删除空的 #### 行（/^#{2,6}\s*$/）
 *   2. 给中文序号标题（一、二、三、第一步 等）加 ## 前缀
 * 用法：node scripts/fix-format.mjs [--dry-run]
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");

const BASES = [
  join(process.cwd(), "src", "content", "posts"),
  join(process.cwd(), "src", "content", "posts-en"),
];

// 中文序号标题（独占一行，标题本身 ≤ 20 字符，不跟正文挤）
const CN_ORDERED_HEADING = /^(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十)、[^\n]{2,20}$/;

// 中文明确带冒号的步骤标题
const CN_STEP_HEADING = /^第[一二三四五六七八九十]+步[：:][^\n]{1,20}$/;

// 英文序号标题
const EN_STEP_HEADING = /^Step\s+\d+[:\.]\s*.{0,30}$/;

function isCnHeadingLine(line) {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 40) return false;
  if (/^#{1,6}\s/.test(trimmed)) return false;
  if (/^[-*]\s/.test(trimmed)) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  if (/^```/.test(trimmed)) return false;
  if (/^[|>]/.test(trimmed)) return false;
  return CN_ORDERED_HEADING.test(trimmed) || CN_STEP_HEADING.test(trimmed);
}

function isEnHeadingLine(line) {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 40) return false;
  if (/^#{1,6}\s/.test(trimmed)) return false;
  if (/^[-*]\s/.test(trimmed)) return false;
  if (/^```/.test(trimmed)) return false;
  return EN_STEP_HEADING.test(trimmed);
}

let total = 0;
let changed = 0;
const changes = [];

for (const base of BASES) {
  const locale = base.endsWith("posts-en") ? "en" : "zh";
  const files = (await readdir(base)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const path = join(base, file);
    const original = await readFile(path, "utf8");
    total++;

    const lines = original.split("\n");
    let modified = false;

    // 跳过 frontmatter：找到第二行 --- 的行索引
    let fmEndLine = -1;
    for (let li = 0; li < lines.length; li++) {
      if (lines[li].trim() === "---") {
        if (fmEndLine === -1) { fmEndLine = li; continue; }
        fmEndLine = li;
        break;
      }
    }
    if (fmEndLine === -1) continue; // 无 frontmatter，跳过
    const head = lines.slice(0, fmEndLine + 1);
    const body = lines.slice(fmEndLine + 1);

    const newBody = [];
    for (let i = 0; i < body.length; i++) {
      const line = body[i];
      const trimmed = line.trim();

      // 规则 1: 删除空的 #### 行
      if (/^#{2,6}\s*$/.test(trimmed)) {
        modified = true;
        changes.push(`[${locale}] ${slug}: 删除空标题 L${i + 1}`);
        continue;
      }

    // 规则 2: 给中文/英文序号标题加 ##（已暂时禁用，避免误报）
    // TODO: 后续人工逐篇检查后手动加
    // if (locale === "zh" && isCnHeadingLine(trimmed)) {
    //   ...
    // }
    // if (locale === "en" && isEnHeadingLine(trimmed)) {
    //   ...
    // }

      newBody.push(line);
    }

    if (modified) {
      changed++;
      const newContent = [...head, ...newBody].join("\n");
      if (!DRY_RUN) {
        await writeFile(path, newContent, "utf8");
      }
    }
  }
}

console.log(`\n📄 扫描 ${total} 篇文章`);
console.log(`✏️ 需要修改 ${changed} 篇`);
if (DRY_RUN) console.log(`(DRY-RUN 模式，未实际写入)`);
console.log(`\n修改详情：`);
changes.forEach((c) => console.log(`  ${c}`));
