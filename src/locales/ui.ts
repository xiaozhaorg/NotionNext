/**
 * UI 翻译字典
 * locale: "zh" | "en"
 */
export type Locale = "zh" | "en";

export const locales: Locale[] = ["zh", "en"];

export const defaultLocale: Locale = "zh";

const zh = {
  // Site
  siteTitle: "小吒博客",
  siteDescription: "一个专注于 AI 工具、云计算、自托管与开源应用的个人技术博客。",
  siteKeywords: "技术博客,AI工具,云计算,自托管,开源应用,Cloudflare,个人博客",

  // Nav
  nav_home: "首页",
  nav_tags: "标签",
  nav_archive: "归档",
  nav_about: "关于",

  // Home
  home_featured: "⭐ 置顶推荐",
  home_latest: "📝 最新文章",

  // Card
  card_reading_time: "约 {min} 分钟",

  // Tags page
  tags_all: "🏷️ 所有标签",
  tags_count: "共 {count} 个标签 · {total} 篇文章",
  tag_posts: "共 {count} 篇文章",
  tags_back: "← 所有标签",

  // Archive
  archive_title: "🗂️ 归档",
  archive_total: "共 {total} 篇文章",
  archive_year: "{year} 年",

  // About
  about_title: "👋 关于我",
  about_who: "🧑‍💻 我是谁",
  about_who_desc: "你好，我是 {author}，一名热爱折腾技术的开发者。这个博客记录我在 AI 工具、云计算、自托管与开源应用上的实践与踩坑，希望能给同样在折腾路上的你一些参考。",
  about_focus: "📌 站点定位",
  about_focus_1: "🤖 AI 工具与大模型：最新模型的使用教程与深度评测",
  about_focus_2: "☁️ 云计算与 Cloudflare 生态：Pages、Workers、R2、Tunnel 实战",
  about_focus_3: "🏠 自托管应用：Jellyfin、Immich、n8n、Mealie 等开源应用自建指南",
  about_focus_4: "🎁 免费资源：域名优惠、GitHub 学生包、免费 API 额度等羊毛信息",
  about_contact: "📮 联系我",
  about_email: "邮箱",
  about_rss: "订阅本站",
  about_license: "📜 版权声明",
  about_license_desc: "本站文章默认采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。",

  // 404
  error_404_title: "页面走丢了",
  error_404_desc: "你访问的页面不存在或已被移动。",
  error_404_search_placeholder: "搜索文章...",
  error_404_back_home: "返回首页",
  error_404_hot: "🔥 热门文章",

  // Sidebar
  sidebar_hot: "热门文章",
  sidebar_tags: "标签云",
  sidebar_all_tags: "全部 →",

  // Footer
  footer_nav: "导航",
  footer_resources: "资源",
  footer_links: "友链",
  footer_rss: "RSS 订阅",
  footer_sitemap: "站点地图",
  footer_github: "GitHub 源码",

  // Language switcher
  lang_switch_to_en: "EN",
  lang_switch_to_zh: "中文",

  // RSS
  rss_title: "小吒博客",
  rss_description: "一个专注于 AI 工具、云计算、自托管与开源应用的个人技术博客。",
} as const;

const en = {
  // Site
  siteTitle: "Xiaozha Blog",
  siteDescription: "A personal tech blog focused on AI tools, cloud computing, self-hosting, and open-source applications.",
  siteKeywords: "tech blog,AI tools,cloud computing,self-hosting,open source,Cloudflare,developer blog",

  // Nav
  nav_home: "Home",
  nav_tags: "Tags",
  nav_archive: "Archive",
  nav_about: "About",

  // Home
  home_featured: "⭐ Featured",
  home_latest: "📝 Latest Posts",

  // Card
  card_reading_time: "{min} min read",

  // Tags page
  tags_all: "🏷️ All Tags",
  tags_count: "{count} tags · {total} posts",
  tag_posts: "{count} posts",
  tags_back: "← All tags",

  // Archive
  archive_title: "🗂️ Archive",
  archive_total: "{total} posts",
  archive_year: "{year}",

  // About
  about_title: "👋 About Me",
  about_who: "🧑‍💻 Who am I",
  about_who_desc: "Hi, I'm {author}, a developer who loves tinkering with tech. This blog documents my practices and lessons learned in AI tools, cloud computing, self-hosting, and open-source applications. Hope it helps you on your own journey.",
  about_focus: "📌 What I Write About",
  about_focus_1: "🤖 AI Tools & LLMs: Tutorials and reviews of the latest models",
  about_focus_2: "☁️ Cloud & Cloudflare Ecosystem: Pages, Workers, R2, Tunnel hands-on",
  about_focus_3: "🏠 Self-Hosting: Jellyfin, Immich, n8n, Mealie and more open-source guides",
  about_focus_4: "🎁 Free Resources: Domain deals, GitHub Student Pack, free API credits",
  about_contact: "📮 Contact",
  about_email: "Email",
  about_rss: "Subscribe",
  about_license: "📜 License",
  about_license_desc: "Articles on this site are licensed under CC BY-NC-SA 4.0 unless otherwise stated.",

  // 404
  error_404_title: "Page Not Found",
  error_404_desc: "The page you're looking for doesn't exist or has been moved.",
  error_404_search_placeholder: "Search posts...",
  error_404_back_home: "Back to Home",
  error_404_hot: "🔥 Popular Posts",

  // Sidebar
  sidebar_hot: "Popular Posts",
  sidebar_tags: "Tag Cloud",
  sidebar_all_tags: "All →",

  // Footer
  footer_nav: "Navigation",
  footer_resources: "Resources",
  footer_links: "Links",
  footer_rss: "RSS Feed",
  footer_sitemap: "Sitemap",
  footer_github: "GitHub Source",

  // Language switcher
  lang_switch_to_en: "EN",
  lang_switch_to_zh: "中文",

  // RSS
  rss_title: "Xiaozha Blog",
  rss_description: "A personal tech blog focused on AI tools, cloud computing, self-hosting, and open-source applications.",
} as const;

export const ui = { zh, en } as const;

export type UIKeys = keyof typeof zh;

/** 翻译函数 */
export function t(locale: Locale, key: UIKeys): string {
  return ui[locale][key] ?? ui.zh[key] ?? key;
}

/** 获取当前 locale 的完整 HTML lang 属性 */
export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

/** 获取 OG locale */
export function ogLocale(locale: Locale): string {
  return locale === "en" ? "en_US" : "zh_CN";
}

/** 根据当前路径推断 locale */
export function localeFromPath(pathname: string): Locale {
  return pathname.startsWith("/en/") || pathname === "/en" ? "en" : "zh";
}

/** 获取当前页面的对应语言 URL */
export function getAltURL(pathname: string, targetLocale: Locale): string {
  // /en/xxx → /xxx (to zh)
  // /xxx → /en/xxx (to en)
  if (targetLocale === "en") {
    if (pathname === "/" || pathname === "") return "/en/";
    return `/en${pathname}`;
  }
  // to zh: strip /en prefix
  if (pathname.startsWith("/en/") || pathname === "/en" || pathname === "/en/") {
    return pathname.replace(/^\/en/, "") || "/";
  }
  return pathname;
}
