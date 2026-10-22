// @ts-check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";
import type { SitemapItem } from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { SITE } from "./src/config";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "src", "content");

/** 取 frontmatter 段（--- 之间的内容）；统一归一化 CRLF，避免正则按 \n 写时漏匹配 */
function frontmatterOf(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("---")[1] ?? "";
}

/** 兼容 YAML block（tags:\n  - x）与 flow（tags: [a, b]）两种写法 */
function tagsIn(fm: string): string[] {
  const block = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(fm);
  if (block) {
    return block[1]
      .split("\n")
      .filter(Boolean)
      .map((l) => l.replace(/^\s*-\s*/, "").trim())
      .filter(Boolean);
  }
  const flow = /^tags:\s*\[([^\]]*)\]/m.exec(fm);
  if (flow) {
    return flow[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return [];
}

function dateIn(fm: string, key: string): Date | null {
  const m = new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, "m").exec(fm);
  if (!m) return null;
  const d = new Date(m[1].trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * 从内容源统计两类数据（sitemap 的 filter/serialize 只能拿到 URL，拿不到集合）：
 *  - tagCounts: 标签页路径 → 文章数，用于排除只有 1 篇的薄标签页
 *  - lastmods:  文章路径 → 最后更新时间，用于输出 sitemap lastmod
 */
const tagCounts = new Map();
const lastmods = new Map();
for (const [dir, prefix] of [
  ["posts", ""],
  ["posts-en", "/en"],
]) {
  const base = path.join(SRC, dir);
  if (!fs.existsSync(base)) continue;
  for (const f of fs.readdirSync(base)) {
    if (!f.endsWith(".md")) continue;
    const fm = frontmatterOf(path.join(base, f));
    const mod = dateIn(fm, "modDatetime") ?? dateIn(fm, "pubDatetime");
    if (mod) lastmods.set(`${prefix}/article/${f.replace(/\.md$/, "")}`, mod);
    for (const t of tagsIn(fm)) {
      const key = `${prefix}/tags/${encodeURIComponent(t)}`;
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
}

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // 排除两类页面：
      //  1) 错误页——根级 404.astro 会被 Astro 自动排除，但 /en/404/ 是嵌套路由不会
      //  2) 只有 1 篇文章的薄标签页——页面自身已设 noindex，sitemap 必须同步排除，
      //     否则会制造「sitemap 收录 noindex URL」这类 Search Console 报错
      filter: (page) => {
        const p = new URL(page).pathname;
        if (/\/404\/?$/.test(p)) return false;
        const m = /^(\/en)?\/tags\/(.+)\/$/.exec(p);
        if (m && (tagCounts.get(`${m[1] ?? ""}/tags/${m[2]}`) ?? 0) < 2) return false;
        return true;
      },
      // 按页面类型分配合适的权重与更新频率，避免搜索引擎抓错重点
      serialize(item): SitemapItem {
        const p = new URL(item.url).pathname;
        const cf = (
          p === "/" || p === ""
            ? "daily"
            : /^\/(about|archive|tags)\/?$/.test(p)
              ? "daily"
              : p.startsWith("/article/")
                ? "weekly"
                : p.startsWith("/tags/")
                  ? "monthly"
                  : "weekly"
        ) as ChangeFreqEnum;
        const pr =
          p === "/" || p === ""
            ? 1.0
            : /^\/(about|archive|tags)\/?$/.test(p)
              ? 0.8
              : p.startsWith("/article/")
                ? 0.85
                : p.startsWith("/tags/")
                  ? 0.35
                  : 0.7;
        // lastmod 取 modDatetime，缺省回退 pubDatetime；非文章页没有日期则省略
        const lm = lastmods.get(p.replace(/\/$/, ""));
        return { ...item, changefreq: cf, priority: pr, ...(lm ? { lastmod: lm.toISOString() } : {}) };
      },
    }),
    pagefind(),
    // 轻量自定义集成：
    //  1) 构建后把 sitemap-index.xml 复制一份为 sitemap.xml
    //     解决部分搜索引擎（百度、老站入口）只认识 /sitemap.xml 的问题
    //  2) 在 sitemap-*.xml 开头插入 <?xml-stylesheet ...?>，访客查看 sitemap 更直观
    //  3) 给 RSS.xml 也补 stylesheet 引用（RSS 通过 @astrojs/rss 生成，需要后处理）
    {
      name: "sitemap-xml-alias",
      hooks: {
        "astro:build:done"({ dir }) {
          // dir 是 file URL，Windows 下 dir.pathname 会带前缀导致 E:\E:\... 拼错，统一转成本地路径
          const root = fileURLToPath(dir);

          // 1) sitemap.xml 别名
          const indexXml = path.join(root, "sitemap-index.xml");
          const aliasXml = path.join(root, "sitemap.xml");
          if (fs.existsSync(indexXml) && !fs.existsSync(aliasXml)) {
            fs.copyFileSync(indexXml, aliasXml);
            console.log("[seo] Created /sitemap.xml alias");
          }

          // 2) 为所有 sitemap-*.xml / sitemap.xml 注入 XSL
          const sitemapFiles = fs
            .readdirSync(root)
            .filter((f) => /^sitemap(-\d+)?\.xml$|^sitemap-index\.xml$/.test(f));
          const xslHint = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
          for (const f of sitemapFiles) {
            const filePath = path.join(root, f);
            let content = fs.readFileSync(filePath, "utf8");
            if (!content.includes("xml-stylesheet")) {
              content = content.replace(/^<\?xml[^>]*\?>/, (m) => `${m}\n${xslHint}`);
              fs.writeFileSync(filePath, content, "utf8");
            }
          }
          if (sitemapFiles.length > 0) {
            console.log(`[seo] Injected sitemap.xsl stylesheet into: ${sitemapFiles.join(", ")}`);
          }

          // 3) 给 rss.xml 也注入 xsl 引用（@astrojs/rss 4.x 支持 stylesheet 参数，但保险起见后处理）
          const rssXml = path.join(root, "rss.xml");
          if (fs.existsSync(rssXml)) {
            let rss = fs.readFileSync(rssXml, "utf8");
            if (!rss.includes("xml-stylesheet")) {
              rss = rss.replace(
                /^<\?xml[^>]*\?>/,
                (m) => `${m}\n<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>`
              );
              fs.writeFileSync(rssXml, rss, "utf8");
              console.log("[seo] Injected rss.xsl stylesheet into /rss.xml");
            }
          }
        },
      },
    },
  ],
  // 输出到 out/ 以匹配 Cloudflare Pages 现有的 NotionNext 部署配置
  // （Cloudflare Pages Git 集成配置的 build output directory 为 out）
  outDir: "out",
  // 文章 URL 保持 /article/[slug]，与旧站一致以保 SEO
  build: {
    format: "directory",
  },
  prefetch: true,
});
