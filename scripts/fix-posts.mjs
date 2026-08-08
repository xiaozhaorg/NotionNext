/**
 * 批量修正现有文章 frontmatter：
 *   1. 去掉 title 末尾的 " | 小吒博客"
 *   2. 从旧站抓取 tags 和真实发布日期，或从标题/分类推断
 *   3. 作者 "小吒博客" → "小吒"
 *   4. 清理正文中第一个 "### " 空标题 + Notion 锚点链接（[](#hash)正文开头拼接错误）
 *   5. 把 HTML 实体 &quot; &amp; &lt; 等换成正常字符
 *
 * 用法：node scripts/fix-posts.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");

const SITE_SUFFIX = " | 小吒博客";

// 基于标题/关键词 → 标签的启发式映射（因为抓取时 tags 全部空了）
const TAG_MAP = [
  { tags: ["Cloudflare", "CDN优化"], kws: ["cloudflare", "优选IP", "优选 ip", "cdn", "workers", "r2", "tunnel", "drop", "cloud-mail", "cloudmail", "pages"] },
  { tags: ["开源工具"], kws: ["dbx", "client", "客户端", "数据库"] },
  { tags: ["AI", "大模型"], kws: ["deepseek", "gemma", "claude", "chatgpt", "gpt", "gemini", "kimi", "ollama", "llm", "coding", "sonnet", "肖恩AI", "肖恩", "shawn"] },
  { tags: ["AI编程", "开发工具"], kws: ["vscode", "cursor", "trae", "monkeycode", "atomcode", "zed", "copilot", "code-intelligence", "ai sdk", "winget", "docker", "n8n", "raycast", "bitwarden", "vaultwarden"] },
  { tags: ["建站"], kws: ["博客", "建站", "nextchat", "部署", "vercel", "astro", "next.js", "nextjs", "panel", "宝塔", "404"] },
  { tags: ["教程"], kws: ["教程", "指南", "tutorial", "实战", "完全"] },
  { tags: ["开源应用", "自托管"], kws: ["自托管", "immich", "jellyfin", "mealie", "mineradio", "nas", "uptime", "kuma"] },
  { tags: ["腾讯云"], kws: ["腾讯云", "tencent", "marvis", "edgeone"] },
  { tags: ["硅基流动"], kws: ["siliconflow", "硅基流动"] },
  { tags: ["羊毛福利"], kws: ["学生包", "免费", "eucc", "薅羊毛", "优惠"] },
  { tags: ["Git", "GitHub"], kws: ["github", "git", "copilot", "actions", "mcp", "codebase"] },
  { tags: ["域名"], kws: ["域名", ".com", "gname"] },
  { tags: ["Linux", "服务器"], kws: ["ubuntu", "server", "linux", "终端"] },
  { tags: ["工具"], kws: ["idm", "下载工具", "激活"] },
];

function inferTags(title, desc = "") {
  const hay = (title + " " + desc).toLowerCase();
  const set = new Set();
  for (const r of TAG_MAP) {
    if (r.kws.some((k) => hay.includes(k.toLowerCase()))) {
      r.tags.forEach((t) => set.add(t));
    }
  }
  return [...set];
}

/**
 * 粗略根据标题判断日期：用今天往前推一个"合理"日期偏移，
 * 让文章有一定的时间分布，不会全是同一天。
 * 不精确，但比全是"今天"好。真实日期在脚本运行第 2 阶段从 <head> 元数据补。
 */
function fakeDate(idx, total) {
  // 从半年前 → 今天，均匀分布
  const first = new Date();
  first.setDate(first.getDate() - 180);
  const now = new Date();
  const t = total <= 1 ? 1 : idx / (total - 1);
  const ms = first.getTime() + (now.getTime() - first.getTime()) * t;
  return new Date(ms).toISOString();
}

/** 解析单篇 md 文件 frontmatter */
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { fm: {}, body: md };
  const lines = m[1].split("\n");
  const fm = {};
  let key = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    const listMatch = /^\s*-\s*(.*)$/.exec(line);
    if (listMatch && key) {
      const val = listMatch[1].trim();
      // 去掉首尾引号
      const strip = (s) => s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      fm[key].push(strip(val));
      continue;
    }
    const kv = /^([a-zA-Z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1];
      let v = kv[2].trim();
      if (v === "[]") {
        fm[key] = [];
      } else if (v === "true" || v === "false") {
        fm[key] = v === "true";
      } else if (v) {
        const strip = (s) => s.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
        fm[key] = strip(v);
      } else {
        fm[key] = []; // 后续 list 项填充
      }
    }
  }
  return { fm, body: md.slice(m[0].length) };
}

function stringifyFrontmatter(fm) {
  const esc = (s) => {
    if (typeof s !== "string") return s;
    return JSON.stringify(s);
  };
  const lines = ["---"];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      if (!v.length) {
        lines.push(`${k}: []`);
      } else {
        lines.push(`${k}:`);
        for (const it of v) lines.push(`  - ${esc(it)}`);
      }
    } else if (typeof v === "boolean") {
      lines.push(`${k}: ${v}`);
    } else if (k === "pubDatetime") {
      // pubDatetime 保留 ISO 8601 原样，不加引号
      lines.push(`${k}: ${v == null ? "" : String(v)}`);
    } else {
      lines.push(`${k}: ${esc(v == null ? "" : String(v))}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function cleanBody(body) {
  // 移除文章开头紧接着的空 "### \n\n[](#anchor)标题正文..." 拼接问题
  body = body.replace(/^###\s*\n+\[?\]\(#[\w-]+\)?/g, "");
  // 修正所有 [](#notion-anchor)文字 这类拼接错误：删空锚点，保留紧跟的文字
  body = body.replace(/\[?\]\(#[\w-]+\)?/g, "");
  // 标题前面残留："####标题文字" 中间有换行就加空格，"#### 选择标准测速完成后..."
  body = body.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
  // HTML 实体解码（安全范围内）
  body = body
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // 去掉图片 src 中的 amp; 参数残留（&amp; → &）
  body = body.replace(/\((https?:\/\/[^)]+)\)/g, (_, u) => `(${u.replace(/&amp;/g, "&")})`);
  // 清理多余空行
  body = body.replace(/\n{4,}/g, "\n\n");
  return body.trim() + "\n";
}

async function main() {
  const files = (await fs.readdir(POSTS_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`🎯 共 ${files.length} 篇文章待处理\n`);

  // 先尝试从旧站文章页 head 抓真实发布时间 + 关键词
  console.log("🌐 第 1 阶段：爬取真实日期 & OG 标签关键词（10 篇/批，1s/篇）");
  const dates = new Map(); // slug → iso date
  const extraKeywords = new Map(); // slug → keywords 字符串

  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    await Promise.all(
      batch.map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        try {
          const url = `https://xiaozha.org/article/${slug}`;
          const ctrl = new AbortController();
          const tm = setTimeout(() => ctrl.abort(), 8000);
          const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } });
          clearTimeout(tm);
          if (!r.ok) return;
          const html = await r.text();
          const pub = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/)
            || html.match(/<meta\s+name="pubdate"\s+content="([^"]+)"/)
            || html.match(/<time[^>]*datetime="([^"]+)"/)
            || html.match(/"datePublished":\s*"([^"]+)"/);
          if (pub) dates.set(slug, pub[1]);
          const kw = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/);
          if (kw) extraKeywords.set(slug, kw[1]);
        } catch {
          /* 忽略 */
        }
      })
    );
    console.log(`   已抓取 ${Math.min(i + 10, files.length)}/${files.length}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`   抓到真实日期 ${dates.size} 篇，关键词 ${extraKeywords.size} 篇\n`);

  let fixed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const slug = file.replace(/\.md$/, "");
    const fp = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(fp, "utf-8");
    const { fm, body } = parseFrontmatter(raw);

    // 1. 标题去后缀
    if (typeof fm.title === "string" && fm.title.endsWith(SITE_SUFFIX)) {
      fm.title = fm.title.slice(0, -SITE_SUFFIX.length);
    }

    // 2. 真实日期 or 推算日期
    if (dates.has(slug)) {
      fm.pubDatetime = dates.get(slug);
    } else if (fm.pubDatetime && typeof fm.pubDatetime === "string") {
      // 已是今天：用推算日期
      fm.pubDatetime = fakeDate(i, files.length);
    }

    // 3. 作者
    if (fm.author === "小吒博客") fm.author = "小吒";

    // 4. 标签：优先 head 关键词 → 再启发式
    if (!fm.tags || fm.tags.length === 0) {
      let tags = [];
      if (extraKeywords.has(slug)) {
        tags = extraKeywords
          .get(slug)
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!tags.length) tags = inferTags(fm.title || "", fm.description || "");
      fm.tags = tags;
    }

    // 5. 修正 ogImage URL 里的 amp;
    if (typeof fm.ogImage === "string") {
      fm.ogImage = fm.ogImage.replace(/&amp;/g, "&");
    }

    const newBody = cleanBody(body);
    const out = stringifyFrontmatter(fm) + "\n\n" + newBody;
    await fs.writeFile(fp, out, "utf-8");
    fixed++;
  }

  console.log(`✅ 处理完成：${fixed} 篇`);
  console.log(`下一步：npm run build 验证`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
