/**
 * 正文精修：修复 HTML → Markdown 转换残留
 *   1. 标题文字和正文粘连 → 插入换行："前言Cloudflare..." → "前言\n\nCloudflare"
 *   2. 内容文字结尾直接接 "#### 标题" → 正确换行
 *   3. 前置文字/段落 + 列表粘连："条件- a - b" → 换行分开
 *   4. Notion 块结尾的 "###""###"" 残留 #### 级标题
 *   5. 代码块缩进：`- ` 前缀被吃掉时修正列表结构
 *
 * 用法：node scripts/refine-posts-body.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");

/**
 * 修复粘连
 * 核心思路：用正则在"非标题中文字/中文标点结尾"后紧跟"下一段可能开头的字符"之间插入换行。
 */
function refineBody(body) {
  // 0. 去掉 \r
  body = body.replace(/\r/g, "");

  // 1. 修复形如 "选择标准测速完成后，选择以下..." 这种
  //    实际是 Notion 的 h4 "选择标准" 紧跟下一段开头，因为
  //    h4 被 htmlToMarkdown 替换为 "#### $1"，但前一个段落结尾没有换行：
  //    典型模式：<content>\n####<space><title><content>
  //    另一种："<content>####<space><title>"
  body = body.replace(/([^\n#])####\s+/g, "$1\n\n#### ");
  body = body.replace(/([^\n#])###\s+/g, "$1\n\n### ");
  body = body.replace(/([^\n#])##\s+/g, "$1\n\n## ");
  body = body.replace(/([^\n#])#\s+/g, "$1\n\n# ");

  // 2. 清理 "###\n" 残留（空三级标题）
  body = body.replace(/\n###\s*\n/g, "\n");

  // 3. 列表粘连：前面不是行首的 "- " 开头 → 前插换行
  //    例："前提条件- 域名已在 Cloudflare 托管- 已获取优选 IP####"
  //    → 先在不是空白/行首/开头处给 "- " 前插换行
  body = body.replace(/([^\n\s])-(\s+)/g, "$1\n-$2");

  // 4. 中文和下一段开头（常见是英文/数字/中文）之间没有换行时，插入空行
  //    注意：只在 结尾是"前言/总结/方案对比/核心步骤..."这类短句后紧跟
  //    实际上，修复规则简单：遇到 "？" "。" "！" "：" 或中文结尾后直接跟一个大段字符
  //    （下一行不是 markdown 块也不是空行）就加换行。
  //
  //    这里选更安全的规则：在句子结束标点（。！？：）之后，如果紧跟英文字母/中文且不是换行，就拆两行。
  body = body.replace(/([。！？：])\s*([\u4e00-\u9fa5A-Za-z])/g, (m, punc, nextChar, offset, str) => {
    // 前面已经是 \n\n 了就不改
    const prev = str.slice(Math.max(0, offset - 5), offset);
    if (/\n{2}$/.test(prev) || /^(\n|#)/.test(String(nextChar))) return m;
    // 下一个字符如果只是标点也不改
    if (/^[，,、\.；;“”'"’‘）)】》>\-—]$/.test(String(nextChar))) return m;
    return `${punc}\n\n${nextChar}`;
  });

  // 5. 粘连的中英混合标题+正文：
  //    例："方案对比作为网站管理员..." 前面其实是段落标题，
  //    这里不强行拆中文复合词，交给 4 规则覆盖大部分。
  //    对像 "第一步：获取优选 IP在配置之前..." 这种 冒号结尾 4 规则会拆。
  //    对 "第二步：配置 DNS 解析（核心步骤）这是..."  →  (结尾）+中文 也在 4 规则里

  // 6. 去掉 "本文" 前面的不规范：连续换行可能太多 → 最多 2
  body = body.replace(/\n{3,}/g, "\n\n");

  return body.trim() + "\n";
}

/** 仅修改 body，保留 frontmatter 原样 */
function splitFm(md) {
  const idx = md.indexOf("\n---\n", 4);
  if (!md.startsWith("---\n") || idx === -1) return { fm: "", body: md };
  return {
    fm: md.slice(0, idx + 5),
    body: md.slice(idx + 5),
  };
}

async function main() {
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
  let changed = 0;
  for (const file of files) {
    const fp = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(fp, "utf-8");
    const { fm, body } = splitFm(raw);
    const newBody = refineBody(body);
    if (newBody !== body + (body.endsWith("\n") ? "" : "\n")) {
      // 计算更精确：比较原始 body 与 refine 后的
      if (newBody.trim() !== body.trim()) {
        await fs.writeFile(fp, fm + "\n" + newBody, "utf-8");
        changed++;
      }
    }
  }
  console.log(`✅ 精修完成：${changed}/${files.length} 篇有修改`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
