/**
 * 从旧站抓取文章 → Markdown
 *
 * 直接解析 xiaozha.org 的 HTML 页面，提取文章内容转成 Astro Markdown。
 * 绕过 Notion API 的网络问题。
 *
 * 用法：npm run migrate
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");

const SITE = "https://xiaozha.org";

// ===== 工具函数 =====

/** 从 HTML 字符串提取文本内容 */
function textOf(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** HTML → Markdown（简化版，针对 NotionNext 文章页） */
function htmlToMarkdown(html) {
  // 移除 script/style 标签
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");

  // 图片：替换为 Markdown 格式
  html = html.replace(
    /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/g,
    (_, src, alt) => `![${alt || "image"}](${src})`
  );

  // 标题
  html = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, "# $1");
  html = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, "## $1");
  html = html.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "### $1");
  html = html.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, "#### $1");

  // 链接
  html = html.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g,
    (_, href, text) => `[${textOf(text)}](${href})`
  );

  // 代码块
  html = html.replace(
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g,
    (_, code) => "```\n" + code + "\n```"
  );
  html = html.replace(
    /<code[^>]*>([\s\S]*?)<\/code>/g,
    (_, code) => "`" + code + "`"
  );

  // 列表
  html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, "- $1");

  // 引用
  html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, "> $1");

  // 粗体/斜体
  html = html.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, "**$1**");
  html = html.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, "*$1*");

  // 水平线
  html = html.replace(/<hr[^>]*>/g, "---");

  // 换行和空格清理
  html = html.replace(/<br\s*\/?>/g, "\n");
  html = html.replace(/<\/(p|div|section|article)>/g, "\n\n");
  html = html.replace(/<[^>]+>/g, "");
  html = html.replace(/\n{3,}/g, "\n\n");
  html = html.replace(/[ \t]+/g, " ");

  return html.trim();
}

/** 提取文章属性 */
function extractArticle(html, url) {
  const slug = url.split("/article/")[1]?.split("?")[0] || url.split("/").pop();

  // 标题：<meta property="og:title"> 或 <h1>
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/);
  const h1Title = html.match(/<h1[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  const title = ogTitle?.[1] || textOf(h1Title?.[1] || "") || slug;

  // 描述
  const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
  const description = descMatch?.[1] || "";

  // 作者
  const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]*)"/);
  const author = authorMatch?.[1] || "小吒";

  // 标签
  const tagMatches = [...html.matchAll(/<a[^>]*class="[^"]*tag[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
  const tags = tagMatches.map((m) => textOf(m[1])).filter((t) => t && !t.includes("分类"));

  // 日期
  const dateMatch = html.match(/<time[^>]*datetime="([^"]*)"/);
  const date = dateMatch?.[1] || new Date().toISOString();

  // 正文内容
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  const contentHtml = articleMatch?.[1] || html;
  const body = htmlToMarkdown(contentHtml);

  // OG 图片
  const ogImgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/);
  const ogImage = ogImgMatch?.[1] || undefined;

  return { title, description, author, tags, date, body, slug, ogImage };
}

// ===== 主流程 =====

async function migrate() {
  // 1. 获取 sitemap
  console.log("🔍 从旧站获取文章列表...");
  const sitemapRes = await fetch(`${SITE}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();

  // 解析 sitemap，提取 /article/* 的 URL
  const urlRegex = /<loc>(https:\/\/xiaozha\.org\/article\/[^<]+)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }
  // 去重
  const uniqueUrls = [...new Set(urls)];
  console.log(`   找到 ${uniqueUrls.length} 篇文章\n`);

  await fs.mkdir(POSTS_DIR, { recursive: true });

  let count = 0;
  let failed = 0;

  for (const url of uniqueUrls) {
    const slug = url.split("/article/")[1];
    // 跳过已抓取的文件
    const existing = path.join(POSTS_DIR, `${slug}.md`);
    try {
      await fs.access(existing);
      console.log(`   ⏭  ${slug} (已存在，跳过)`);
      count++;
      continue;
    } catch {
      // 文件不存在，继续抓取
    }
    try {
      // 加随机查询参数绕过 CDN 缓存，模拟真实访问
      const fetchUrl = `${url}?t=${Date.now()}`;
      console.log(`   📄 抓取 ${slug}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Upgrade-Insecure-Requests": "1",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`      ⚠️ HTTP ${res.status}，跳过`);
        failed++;
        continue;
      }

      const html = await res.text();
      const article = extractArticle(html, url);

      // 组装 frontmatter
      const frontmatter = [
        "---",
        `title: ${JSON.stringify(article.title)}`,
        `pubDatetime: ${article.date}`,
        `description: ${JSON.stringify(article.description || article.title)}`,
        `author: ${JSON.stringify(article.author)}`,
        `tags: ${article.tags.length ? "\n" + article.tags.map((t) => `  - ${JSON.stringify(t)}`).join("\n") : "[]"}`,
        `featured: false`,
        `draft: false`,
        `sourceUrl: ${JSON.stringify(url)}`,
        article.ogImage ? `ogImage: ${JSON.stringify(article.ogImage)}` : null,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      const filePath = path.join(POSTS_DIR, `${article.slug}.md`);
      await fs.writeFile(filePath, `${frontmatter}\n\n${article.body}\n`, "utf-8");
      count++;

      // 限速：每篇休息 3 秒，避免被 Cloudflare 拦截
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.warn(`      ⚠️  失败: ${e.message}`);
      failed++;
    }
  }

  console.log(
    `\n🎉 迁移完成：成功 ${count} 篇，失败 ${failed} 篇 → src/content/posts/`
  );
  console.log(`下一步：运行 npm run dev 预览，或 npm run build 构建`);
}

migrate().catch((err) => {
  console.error("\n❌ 迁移失败:", err.message);
  console.error(err.stack);
  process.exit(1);
});
