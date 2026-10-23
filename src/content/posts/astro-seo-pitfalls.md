---
title: Astro 双语站 SEO 踩坑记：5 个不跑全量校验就发现不了的问题
pubDatetime: "2026-10-23T00:00:00.000Z"
description: 把博客从 NotionNext 迁到 Astro 7 之后，我在 hreflang、sitemap、noindex 上踩的 5 个坑。每个都附症状、根因和修法，重点是这个坑为什么抽样检查发现不了——以及一个让 frontmatter 解析静默失效的 CRLF 陷阱。
author: 小吒
tags:
  - 教程
  - 建站
  - AI 编程
draft: false
ogImage: "/images/astro-seo-pitfalls-real.jpg"
coverAlt: "MacBook 屏幕上显示着密密麻麻的代码与语法高亮"
enSlug: "astro-seo-pitfalls"
---

这个博客最早跑在 NotionNext 上，今年重构到了 Astro 7。重构完功能都正常，`astro check` 零错误，构建 259 页全出，看着挺健康。

然后我做了一次全量校验——把构建产物里每一条 hreflang 链接、每一个 sitemap 条目、每一个 noindex 页面拉出来对账——**查出 60 条死链和一堆收录问题**。

这篇按严重程度倒序记录这 5 个坑。重点不是"怎么配 Astro"，而是**为什么它们能绕过常规检查**。

## 坑一：hreflang 尾斜杠，137 个页面集体中招

### 症状

中文文章页声明英文版长这样：

```html
<link rel="alternate" hreflang="en" href="https://xiaozha.org/en/article/gemma-4-local-deploy">
```

注意**没有尾斜杠**。而同一个页面的 canonical 是：

```html
<link rel="canonical" href="https://xiaozha.org/article/gemma-4-local-deploy/">
```

带尾斜杠。

实测访问那个不带斜杠的地址，返回 **308 永久重定向**到带斜杠版本。

### 根因

`build.format: "directory"` 下，Astro 生成的 URL 都带尾斜杠。但文章页传给 Layout 的 `altURL` 是手写拼的：

```astro
altURL={post.data.enSlug ? `/en/article/${post.data.enSlug}` : null}
```

少了一个 `/`。反向同理，英文页指向中文版也没斜杠。两个方向全错，137 个文章页无一幸免。

### 为什么难发现

Google 对 hreflang 的要求是**目标必须是规范 URL，不能有跳转**。带 308 的 hreflang 会被判定为无效，然后——**它不报错**。Search Console 里只会显示"Alternate page with proper canonical tag"，看起来像正常状态。页面能打开，分享卡片正常，肉眼完全看不出问题。

### 修法

```astro
altURL={post.data.enSlug ? `/en/article/${post.data.enSlug}/` : null}
```

一个字符。但要知道该加这一个字符，得先去做全量校验。

## 坑二：标签页 hreflang 指向 404

### 症状

中文标签页 `/tags/教程/` 的 head 里声明：

```html
<link rel="alternate" hreflang="en" href="https://xiaozha.org/en/tags/教程/">
```

访问它：**HTTP 404**。

### 根因

Layout 里有个 `getAltURL()`，逻辑是纯路径前缀变换：

```ts
// /xxx → /en/xxx
if (targetLocale === "en") {
  return `/en${pathname}`;
}
```

对 `/about/`、`/archive/`、`/tags/` 这类页面完全正确——因为它们中英双语都存在同名路径。

但具体标签页不是。**中文标签叫「教程」，英文标签叫 `Tutorial`**，路径前缀变换推出来的 `/en/tags/教程/` 根本不存在。

20 个中文标签页全部在向搜索引擎声明一个死链。

### 为什么难发现

和坑一同一类问题：不报错，只是静默无效。而且它只在"有具体标签"的页面上出错，`/tags/` 聚合页是对的——抽样检查很容易刚好抽到那个对的。

### 修法

分情况处理。聚合页保留互指，单标签页没有对应语言版本就不声明：

```astro
const altURL = tag ? null : "/en/tags/";
```

`altURL={null}` 会让 Layout 彻底跳过这一方向的 hreflang 输出。**没有对应版本就不声明**，这是 Google 明确认可的做法——比声明一个错链接好得多。

## 坑三：404 页面被写进 sitemap

### 症状

`sitemap-0.xml` 里躺着一条：

```xml
<loc>https://xiaozha.org/en/404/</loc>
```

一个 `noindex,follow` 的错误页，被当成可收录 URL 提交给了搜索引擎。

### 根因

`src/pages/404.astro` 在根级，Astro 把它当站点 404 页，sitemap 集成自动排除。

但 `src/pages/en/404.astro` 是**嵌套路由**，不在根级，不被排除。于是英文 404 页进了 sitemap，中文 404 页没进——不对称，很难第一眼注意到。

### 为什么难发现

`sitemap.xml` 有 258 条 URL，没人会逐条看。而且 404 页本身工作完全正常——访问不存在 URL 确实返回 404 页面。问题只存在于"你主动告诉搜索引擎去收录一个不该收录的页面"这件事上。

Search Console 会报 `Sitemap contains a URL marked "noindex"`，但你不去看就不会知道。

### 修法

```ts
sitemap({
  filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
  // ...
})
```

注意**不能写 `includes("404")`**——那会误杀 `/article/bt-panel-404/` 这篇正常文章。必须锚定路径结尾。

## 坑四：noindex 和 sitemap 必须成对

### 症状

修完坑三，我顺手做了一件事：给只有 1 篇文章的标签页加 `noindex`。站点有 94 个英文标签页，其中 66 个只挂 1 篇文章——薄内容，占 sitemap 44% 的条目。

页面 meta 改好了。但我一开始**没同步改 sitemap**。

### 根因

这是我最开始的理解盲区。我以为 `noindex` 是页面自己的事，sitemap 是收录的事，两边各管各。

实际上不是。**sitemap 里出现 noindex URL，本身就是一条 Search Console 报错**，等于我刚修掉坑三，又造了个新的。

### 修法

两边必须同步：

```astro
// 页面侧
const thin = tag ? filtered.length < 2 : false;
<Layout noindex={thin} ...>
```

```ts
// sitemap 侧，用同一套判定标准
filter: (page) => {
  const p = new URL(page).pathname;
  if (/\/404\/?$/.test(p)) return false;
  const m = /^(\/en)?\/tags\/(.+)\/$/.exec(p);
  if (m && (tagCounts.get(`${m[1] ?? ""}/tags/${m[2]}`) ?? 0) < 2) return false;
  return true;
}
```

这里有个实现难点：sitemap 的 `filter` 只拿到 URL 字符串，拿不到内容集合。所以得在 `astro.config.ts` 里自己读一遍 `src/content`，统计每个标签的文章数，建一张查找表。

改完的效果：

| 指标 | 改前 | 改后 |
|---|---|---|
| sitemap URL 总数 | 257 | 191 |
| 其中标签页 | 114 | 46 |
| sitemap 收录 noindex 页 | 若干 | **0** |
| 带 `lastmod` 的条目 | 0 | 137 |

顺手把 `lastmod` 也加了——内容源里 `modDatetime` 字段早就存在但从没接进 sitemap，白浪费一个 freshness 信号。

## 坑五：CRLF 让 frontmatter 解析静默失效

这个坑最阴，放在最后。

### 症状

改完坑四，我对账时发现数字对不上：

- 标签详情页共 111 个，其中 noindex 65 个、可收录 46 个
- 但 sitemap 里标签 URL 有 46 条——**看起来刚刚好**

然而另外两个页面被排除了：

```
/tags/Docker/         ← 页面显示 index,follow，却不在 sitemap
/tags/资源分享/        ← 同上
```

页面说"我可收录"，sitemap 说"我不收"。矛盾。

### 根因

我在 `astro.config.ts` 里手写了 frontmatter 解析，用来统计标签文章数：

```ts
function frontmatterOf(file: string): string {
  return fs.readFileSync(file, "utf8").split("---")[1] ?? "";
}

function tagsIn(fm: string): string[] {
  const block = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(fm);
  // ...
}
```

正则写的是 `\n`。但 md 文件是 **CRLF 行尾**（`\r\n`）。

于是 `^tags:\n` 匹配不到任何东西——`tags:` 后面跟的是 `\r` 不是 `\n`。**整个标签统计静默返回空**，不是报错，是安静地少算。

实际影响：

| 标签 | 我统计到 | 实际 |
|---|---|---|
| Docker | 1 篇 | 2 篇 |
| 资源分享 | 1 篇 | 4 篇 |

少算的直接后果：`Docker` 被判定为薄标签（<2 篇），从 sitemap 排除；`资源分享` 同样。两个本该收录的页面被错误下线。

### 为什么最难发现

这是唯一一个**纯逻辑 bug**，前面四个都是配置疏漏。它的特征是：

1. **不报错**——正则匹配失败只是返回 null，代码继续跑
2. **结果看起来合理**——统计出的标签数比实际少，但仍是"一批数字"
3. **只有全量对账能暴露**——你抽查 `/tags/AI/`（碰巧是 LF 行尾的文件）一切正常，抽查 `/tags/Docker/`（CRLF）才发现问题

而且我第一版校验脚本自己也有 bug：正则写成 `/\/tags\/[^/]+\/$/`，漏掉所有中文标签页（相对路径没有前导斜杠），一度让我以为问题只在英文侧。

### 修法

一行：

```ts
function frontmatterOf(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("---")[1] ?? "";
}
```

**手写 frontmatter 解析，第一步永远是行尾归一化。** 正解是用 `gray-matter` 这类成熟库，我当时为了少一个依赖自己写了——结果省下的依赖用一倍调试时间还了。

## 顺手记一个环境坑

升级 Astro 7.4.2 之后构建直接失败：

```
Node.js v22.22.2 is not supported by Astro!
Please upgrade Node.js to a supported version: ">=22.23.4"
```

Astro 7.4.x 把 `engines.node` 提到了 22.23.4，而机器默认 Node 是 22.22.2。这种"升了个补丁版结果跑不起来"的情况，报错信息其实说得很清楚，难的是**你根本想不到去升 Node**——毕竟只是个 patch 版本。

解法是写了个 `scripts/astro.mjs` 包装器：检测 `process.version`，不满足就自动切到本机另一个 Node（`D:\Tools\Node` 的 v24）。所有 astro 相关 npm script 都走它。

## 校验方法：为什么抽样一定漏

这 5 个坑有个共同点——**都不影响页面正常渲染**。你能打开、能跳转、能搜索、`astro check` 零错误、构建 259 页全出。

唯一能揪出它们的是全量对账：

```js
// 遍历构建产物，把每一条 hreflang 链接和真实页面集合比对
for (const p of pages) {
  const h = fs.readFileSync(p, "utf8");
  for (const m of h.matchAll(/<link rel="alternate" hreflang="[^"]+" href=".../g)) {
    if (!exists.has(m[1])) bad++;
  }
}
```

跑完一行输出：`hreflang 死链 60 → 0`。这比任何"看起来正常"都可靠。

顺带说三个我自己在校验脚本上犯的错，都是真实成本：

1. **URL 和文件路径比对前必须归一化**。含空格标签（`AI Coding`）的产物目录是字面空格，hreflang 里是 `%20`，直接字符串比会误报 58 条死链。两侧都要做 `decodeURIComponent` / `encodeURI`。
2. **判断页面类别的正则要考虑相对路径**。`/tags/xxx/` 的正则漏掉 `tags/xxx/`（无前导斜杠），导致中文标签页整体漏算。
3. **别用 `curl -x` 探测代理可用性**，它返回 000 像是通了其实没连上。判断端口存活要用 `(echo > /dev/tcp/127.0.0.1/6046)` 做真实 TCP 连接。

## 收尾

迁移类项目最危险的心态是"构建通过了就是好了"。构建只验证**页面能生成**，不验证**页面之间的关系是对的**——而 SEO 全在关系里：canonical 指向谁、hreflang 互指谁、sitemap 收录谁、noindex 排除了谁。

花半小时写个对账脚本，比之后几个月在 Search Console 里一点点捞错误便宜得多。
