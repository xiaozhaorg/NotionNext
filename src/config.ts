/**
 * 站点全局配置
 * 由 NotionNext 的 blog.config.js + 19 份 conf 文件收敛而来
 */
export const SITE = {
  /** 站点元数据 */
  title: "小吒博客",
  description: "一个专注于 AI 工具、云计算、自托管与开源应用的个人技术博客。",
  author: "小吒",
  since: 2026,
  url: "https://xiaozha.org",
  lang: "zh-CN",
  keywords: [
    "技术博客",
    "AI工具",
    "云计算",
    "自托管",
    "开源应用",
    "Cloudflare",
    "个人博客",
  ],

  /** 文章配置（保持与旧站一致） */
  post: {
    /** URL 前缀，生成 /article/[slug]，保 SEO */
    urlPrefix: "article",
    /** 每页文章数 */
    perPage: 12,
    /** 列表预览字数 */
    previewChars: 120,
  },

  /** 评论系统：Giscus（基于 GitHub Discussions，零后端） */
  giscus: {
    // 去 https://giscus.app/zh-CN 生成配置，留空则显示设置指引
    repo: "xiaozhaorg/Blog",
    repoId: "", // giscus 生成，形如 "R_kgDOxxxxxx"
    category: "Announcements",
    categoryId: "", // giscus 生成，形如 "DIC_kwDOxxxxxx"
    mapping: "pathname",
    reactionsEnabled: "1",
    inputPosition: "bottom",
    lang: "zh-CN",
  },

  /** 访问统计 */
  analytics: {
    // 51la 站点统计（沿用旧站 ID）
    laId: "L9MnrBxM4bJ6FrXt",
    laCk: "L9MnrBxM4bJ6FrXt",
    // Cloudflare Web Analytics token（在 CF 控制台开启后填入）
    cloudflareToken: "",
  },

  /** 社交链接 */
  social: {
    github: "https://github.com/xiaozhaorg",
    rss: "/rss.xml",
  },
} as const;

export type SiteConfig = typeof SITE;
