---
title: 让 AI 引用你的网站：llms.txt 与 GEO 实战（附本站真实配置）
pubDatetime: "2026-10-25T00:00:00.000Z"
description: 越来越多人直接问 ChatGPT、DeepSeek、Perplexity 而不是搜索。这篇讲个人博客怎么被 AI 引用：robots.txt 里两类 AI 爬虫的区别、llms.txt 规范写法、llms-full.txt 生成、各 AI 平台的信源偏好，以及拿本站 xiaozha.org 做的真实整改。
author: 小吒
tags:
  - 教程
  - 建站
  - 免费工具
draft: false
ogImage: "/images/geo-llms-txt-real.jpg"
coverAlt: "一个人形机器人坐在窗边的木质长椅上低头阅读手中的平板设备"
enSlug: "geo-llms-txt"
---

越来越多人遇到问题的第一反应，已经不是打开 Google 或百度，而是直接问 ChatGPT、DeepSeek、Perplexity。

这对个人博客是个新问题：传统 SEO 折腾的是搜索结果列表里的排名，而 AI 问答里的"答案位"是另一套逻辑。你写的文章就算在 Google 排第一，AI 回答时也可能引用别人的内容——因为它压根没"读"你的站，或者读了但没读懂你是干什么的。

这篇文章讲个人博客怎么被 AI 引用。不是那种卖 GEO 服务的企业软文，是拿我自己的站（xiaozha.org）做的真实配置和整改。文末有完整清单。

## 先澄清一个概念：GEO 不是新 SEO

GEO（Generative Engine Optimization，生成式引擎优化）这词 2026 年被炒得很热，各种服务商张口就是"抢占 AI 答案位""构建 GEO 壁垒"。

剥掉话术，它其实就三件事：**让 AI 爬虫进得来、让 AI 读得懂、让 AI 愿意引用你**。

前两件是纯技术配置，一小时能搞定。第三件靠内容质量，没有捷径。本文只讲前两件——它们是放大器，能把好内容放大，但不能把差内容变好。如果你的文章本身没有信息增量，配了 llms.txt 也白搭。

## 第一件事：robots.txt 里藏着两个陷阱

大多数站的 robots.txt 是 `User-agent: * / Allow: /` 一把梭，看着没问题，其实漏掉了 AI 时代的关键区分。

### 陷阱一：两类 AI 爬虫被混为一谈

AI 爬虫分两种角色，目的完全不同：

| 角色 | 干什么 | 代表 |
|---|---|---|
| **搜索引用爬虫** | AI 回答问题时实时抓网页、给答案标来源 | `OAI-SearchBot`、`Claude-SearchBot`、`PerplexityBot` |
| **训练爬虫** | 抓内容喂给模型训练，与你的站能否被引用无关 | `GPTBot`、`ClaudeBot`、`Google-Extended`、`Bytespider` |

关键认知：**拦掉训练爬虫，不影响 AI 搜索引用你**。

很多人怕内容被白嫖训练，一气之下把 `GPTBot`、`ClaudeBot` 全禁了。这个决定本身没问题，但要知道——禁 `GPTBot` 不等于 ChatGPT 搜索看不到你的站，只要 `OAI-SearchBot` 还放行。反过来，如果连 `OAI-SearchBot` 一起禁了，那你的站就彻底从 AI 答案里消失了。

### 陷阱二：`User-agent: *` 不等于覆盖一切

有些 AI 爬虫不遵守通配符规则，或者遵守但优先级处理不同。最稳妥的做法是显式声明。下面是我给本站配的规则：

```text
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
```

三个要点：

1. **引用爬虫一律放行**。你的博客如果担心被训练，禁训练爬虫就够了，引用爬虫放行没有任何损失——它只在你内容被引用时才来抓。
2. **国内入口别忘**。DeepSeek、Kimi、豆包这些的爬虫没有统一公开的 UA 规范，`Bytespider`（字节）是少数公开的。建议国内站对国内爬虫保持默认放行，先把入口占上。
3. **`Sitemap:` 指令要写**。robots.txt 末尾补一行 `Sitemap: https://你的域名/sitemap.xml`，不依赖爬虫自己发现。

## 第二件事：llms.txt 是给 AI 的站点导读

sitemap.xml 是"通讯录"——罗列所有页面 URL。llms.txt 是"接待手册"——用结构化语言告诉 AI：这个站是干什么的、哪些内容最重要、先看哪篇。

规范在 [llmstxt.org](https://llmstxt.org/)，格式是 Markdown，机器可读，人也能看懂。结构很简单：

```markdown
# 你的站名

> 一句话概括这个站是做什么的、核心内容是什么。

## 站点信息

- 网址: https://example.com
- 语言: 中文
- 作者: 你的名字

## 关键页面

- 首页: https://example.com/
- 标签索引: https://example.com/tags/
- 关于: https://example.com/about/

## 精选内容（优先索引）

- 某篇核心文章: https://example.com/article/xxx
- 另一篇核心文章: https://example.com/article/yyy
```

写法上有四条规矩，多数人第一条就栽了：

**只列高价值页面，别堆全站 URL。** llms.txt 不是第二个 sitemap。全站堆砌会让 AI 分不清重点，反而稀释权重。我的一般原则是：站内 5% 的最优质内容，加上导航类页面。

**链接顺序就是权重排序。** AI 会优先参考靠前的链接。把最想被引用的文章放最上面。

**描述必须和实际页面一致。** 这是企业 GEO 服务商最爱犯的错——llms.txt 里把自己吹成行业领导者，打开官网全是空话。AI 交叉核验时发现口径不一致，反而降低可信度。宁可写得平淡，别写虚。

**不放营销内容。** 促销、限时活动、引流话术都不要进 llms.txt。这个文件的可信度建立在"客观事实"上。

### 本站的 llms.txt 实例

下面是我站的完整配置，可以作为个人博客的模板：

```markdown
# llms.txt — Xiaozha Blog

> 面向 AI 搜索引擎与爬虫的站点发现文件
> 遵循 https://llmstxt.org/ 规范

## 站点信息

- **名称**: 小吒博客 (Xiaozha Blog)
- **语言**: 中文为主，部分英文翻译
- **网址**: https://xiaozha.org
- **描述**: 一个专注于 AI 工具、云计算、自托管与开源应用的个人技术博客。
- **作者**: 小吒 (@xiaozhaorg)
- **RSS**: https://xiaozha.org/rss.xml
- **Sitemap**: https://xiaozha.org/sitemap.xml

## 主要内容主题

1. **AI 工具与大模型**: LLM 评测、AI 编程助手、API 中转站、本地部署
2. **Cloudflare 生态**: Pages / Workers / R2 / Tunnel / Speed 实战教程
3. **自托管应用**: Jellyfin、Immich、n8n、Mealie、Vaultwarden 等
4. **开源开发工具**: Git、Docker、VS Code/Cursor/Zed 编辑器
5. **免费资源**: 域名优惠、GitHub Student Pack、免费 API 额度

## 关键页面

- 首页: https://xiaozha.org/
- 英文首页: https://xiaozha.org/en/
- 所有标签: https://xiaozha.org/tags/
- 归档: https://xiaozha.org/archive/
- 关于: https://xiaozha.org/about/

## 精选文章（推荐优先索引）

- Cloudflare 国内加速实战: https://xiaozha.org/article/cloudflare-ip-optimization
- Ollama 本地部署大模型: https://xiaozha.org/article/ollama-local-llm
- Vaultwarden 自托管密码管理器: https://xiaozha.org/article/bitwarden-self-host
- Cloudflare Tunnel 免费内网穿透: https://xiaozha.org/article/cloudflare-tunnel-tutorial
- Cline 实战教程: https://xiaozha.org/article/cline-tutorial
- DeepSeek V4 编程能力实测: https://xiaozha.org/article/deepseek-v4-coding
```

部署方式：静态站直接放 `public/llms.txt`，WordPress 放站点根目录，访问 `域名/llms.txt` 能打开就行。

## 第三件事：llms-full.txt，为长上下文模型准备的全文版

llms.txt 是导读，只放链接。配套还有个 `llms-full.txt`——把核心页面的**全文内容**整合成一个文件，给长上下文模型（Gemini 1M、Claude 200K）一次性读完。

适用场景：文档类、教程类、内容量中等的站点。如果你的站有一批高质量的、结构完整的文章，值得做。企业官网那种十几个营销页的就没必要。

生成方式不手写——写脚本从 sitemap 或内容目录自动抓取。用 Astro 的可以这样（Node 脚本，构建后运行）：

```javascript
import fs from "node:fs";
import path from "node:path";

const SITE = "https://xiaozha.org";
const POSTS_DIR = "src/content/posts";
const OUT = "public/llms-full.txt";

// 挑出重点文章：按 frontmatter 里标记或按篇幅排序
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const entries = files.map((f) => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8").replace(/\r\n/g, "\n");
  const fm = raw.split("---")[1] || "";
  const title = (/^title:\s*"?([^"\n]+)/m.exec(fm) || [])[1] || f;
  const slug = f.replace(/\.md$/, "");
  const body = raw.replace(/^---[\s\S]*?---/, "").trim();
  return { title, slug, url: `${SITE}/article/${slug}/`, w: body.length, body };
});

// 按篇幅取前 20 篇，避免文件无限膨胀
entries.sort((a, b) => b.w - a.w);
const picked = entries.slice(0, 20);

const lines = [
  `# ${SITE} — Full Content`,
  "",
  "> 本站核心文章全文，供 AI 一次性读取。",
  "",
];
for (const e of picked) {
  lines.push(`## ${e.title}`, `URL: ${e.url}`, "", e.body, "", "---", "");
}

fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`llms-full.txt 生成完成，收录 ${picked.length} 篇`);
```

两个注意点：

- **全文文件会很大**，控制在模型上下文能一次读完的范围（几十篇文章的量级合适）。全站 145 篇硬塞进去，Gemini 也读不完。
- **内容更新后要重新生成**。过期的全文文件比没有更糟——AI 引用的是你三个月前的旧观点。

## 第四件事：不同 AI 平台，信源偏好差得很远

这是最多人忽略的一层。同一个站，在 ChatGPT 和 Perplexity 里的引用概率完全不同，因为它们的检索系统用的是不同底层数据：

| AI 平台 | 检索/信源特点 | 你该做什么 |
|---|---|---|
| **ChatGPT** | 检索独立于 Google，主要依赖 Bing 索引 | 必做：Bing Webmaster Tools 提交站点 |
| **Perplexity** | 约四成引用来自 Reddit 等社区的真实讨论 | 在相关社区参与真实讨论，不是发广告 |
| **Claude** | 引用品牌自有网站的比例最高 | 把官网/博客内容做扎实，结构清晰 |
| **Google AI 概览** | 对 YouTube、Reddit、LinkedIn 多源交叉印证权重高 | 有视频内容的站占优 |
| **DeepSeek / Kimi / 豆包** | 国内入口，信源以公开网页为主 | 保证页面可被国内爬虫访问 |

对个人博客最实际的一条：**去 Bing Webmaster Tools 提交站点**。五分钟的事，但 ChatGPT 的引用基本盘在 Bing。很多人 Google Search Console 配得齐齐的，Bing 那边空空如也。

## Schema 结构化数据：你可能已经有一半

如果你用 Astro、Next.js 这类现代框架，或者 WordPress 装了 SEO 插件，`BlogPosting`、`WebSite` 这类 Schema 大概率已经有了。本站的 Layout 里就带了 `WebSite` + `BlogPosting` 的 JSON-LD。

AI 时代值得补的是这两类：

**BreadcrumbList（面包屑）**：让 AI 理解页面层级。"首页 > 教程 > 某篇文章"这个路径，能帮 AI 判断你的站在某个主题下的内容深度。

**FAQPage（常见问题）**：教程类文章结尾的 Q&A 如果标了 FAQPage，AI 抽出来直接当答案素材的概率高很多。注意 Google 2023 年后限制了 FAQ 富媒体展示，但 Schema 数据本身对 AI 理解内容仍然有效。

检查方法：Google 的 [富媒体结果测试工具](https://search.google.com/test/rich-results) 贴 URL 进去，能解析出类型就说明没问题。

## 本站的真实整改记录

写这篇文章时我把自己站跑了一遍，发现两个实际缺口：

**缺口一：robots.txt 完全没有 AI 爬虫规则。** 原来的 robots.txt 只有传统搜索引擎和百度的优化，`OAI-SearchBot`、`Claude-SearchBot` 一个都没显式声明。已按上面的模板补上。

**缺口二：没有 llms-full.txt。** llms.txt 有，但全文版没有。长上下文模型来读的时候只能拿到链接列表。已补上生成脚本。

这两个缺口很典型——大多数个人博客都卡在这。配置本身半小时的事，但没人告诉你该配。

## 验证清单：配完这样查

```bash
# 1. llms.txt 能访问且返回 200
curl -sI https://你的域名/llms.txt | head -1

# 2. llms-full.txt 能访问
curl -sI https://你的域名/llms-full.txt | head -1

# 3. robots.txt 里 AI 爬虫规则生效
curl -s https://你的域名/robots.txt

# 4. sitemap 可访问，且 lastmod 是真实时间
curl -s https://你的域名/sitemap.xml | grep lastmod | head -3
```

然后做一次"AI 视角自测"：打开 ChatGPT 或 Perplexity，问它"你是从哪知道 XXX（你的站名/主题）的"，或者直接问一个你站内有完整答案的问题，看它引不引用你。没被提到就是 GEO 还没起步，被提到了说明配置开始生效。

## 预期管理：这是基建，不是开关

最后说句实话，免得你配完失望：

llms.txt 和 robots.txt 的**识别周期约 2-4 周**——AI 爬虫有自己的抓取频率，不是你今天配好明天就见效。全域语义权重稳固要 1-2 个月，随模型迭代逐步提升。

它也不能雪中送炭。AI 引用的底层逻辑是"多源交叉核验下你的内容更可信"，llms.txt 只是让 AI 更容易找到并读你这个信源。内容不行，配了也白配；内容够硬，这是性价比最高的一小时。

---

**相关阅读**：这篇是本站 SEO 系列的延伸，传统搜索优化踩的坑见 [Astro 双语站 SEO 踩坑记](/article/astro-seo-pitfalls/)。想让站本身跑在免费额度上，看 [用 Cloudflare Pages 搭建导航站](/article/cloudflare-navigation-site/)；国内访问加速看 [Cloudflare 国内加速实战](/article/cloudflare-ip-optimization/)。
