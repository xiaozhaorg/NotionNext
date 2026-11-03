import type { APIRoute } from "astro";
import { SITE } from "@/config";

/**
 * 构建期生成 /robots.txt，域名与 sitemap 地址统一取自 src/config.ts，
 * 避免在静态文件里再维护一份域名。
 */
export const GET: APIRoute = () => {
  const host = new URL(SITE.url).host;
  const body = `User-agent: *
Allow: /
Disallow: /pagefind/
Disallow: /*?v=
Disallow: /*?cachebust=

# AI 搜索引用爬虫：放行，这是被 AI 引用的前提
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# AI 训练爬虫：按需管控。禁掉不影响 AI 搜索引用本站
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

# 百度专属优化（提升抓取效率，降低误伤）
User-agent: Baiduspider
Allow: /
Disallow: /pagefind/
Disallow: /*?v=
Disallow: /*?cachebust=
Crawl-delay: 1

User-agent: Bytespider
Allow: /
Disallow: /pagefind/
Disallow: /*?v=
Disallow: /*?cachebust=
Crawl-delay: 1

User-agent: Yisouspider
Allow: /
Disallow: /pagefind/
Disallow: /*?v=
Disallow: /*?cachebust=
Crawl-delay: 1

User-agent: Sogou web spider
Allow: /
Disallow: /pagefind/
Disallow: /*?v=
Disallow: /*?cachebust=

# Host 指令（百度/Bing 专用，明确主域名）
Host: ${host}

# 多格式 sitemap，兼容不同蜘蛛抓取
Sitemap: ${SITE.url}/sitemap-index.xml
Sitemap: ${SITE.url}/sitemap-0.xml
Sitemap: ${SITE.url}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
