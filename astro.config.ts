// @ts-check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";
import type { SitemapItem } from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { SITE } from "./src/config";

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
      // 按页面类型分配合适的权重与更新频率，避免搜索引擎抓错重点
      serialize(item): SitemapItem {
        const p = new URL(item.url).pathname;
        const cf: ChangeFreqEnum =
          p === "/" || p === ""
            ? "daily"
            : /^\/(about|archive|tags)\/?$/.test(p)
              ? "daily"
              : p.startsWith("/article/")
                ? "weekly"
                : p.startsWith("/tags/")
                  ? "monthly"
                  : "weekly";
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
        return { ...item, changefreq: cf, priority: pr };
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
