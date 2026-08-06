import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { SITE } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  integrations: [sitemap(), pagefind()],
  // 输出到 out/ 以匹配 Cloudflare Pages 现有的 NotionNext 部署配置
  // （Cloudflare Pages Git 集成配置的 build output directory 为 out）
  outDir: "out",
  // 文章 URL 保持 /article/[slug]，与旧站一致以保 SEO
  build: {
    format: "directory",
  },
  prefetch: true,
});
