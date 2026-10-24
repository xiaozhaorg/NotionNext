---
title: 零成本建站！用 Cloudflare Workers 免费搭建个人博客完整教程
pubDatetime: "2026-07-20T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 手把手教你用 Cloudflare Workers 免费搭建个人博客：选型对比、Wrangler 配置、Hono 框架、KV 存储文章、缓存优化、自定义域名，以及一个重要的诚实建议——大多数情况你该用 Pages。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-workers-blog"
ogImage: "/images/cloudflare-workers-blog-real.jpg"
coverAlt: "云端服务器机房的蓝色存储阵列灯光"
enSlug: "cloudflare-workers-blog"
---

Cloudflare 被网友亲切地称为「赛博活佛」，因为它的 Free 账号提供了大量实用功能。今天我们就来用 Cloudflare Workers 搭建一个完全免费的个人博客，无需购买服务器，享受全球 CDN 加速。

先说明一点：**这篇会带你完整走一遍 Workers 方案，但最后我会告诉你为什么大多数人的博客应该用 Pages 而不是 Workers。** 看完再决定，别急着 `wrangler deploy`。

## 为什么选 Cloudflare Workers

传统建站通常需要：购买服务器（年费几百到几千）+ 配置环境 + 维护安全。而 Cloudflare Workers 让你跳过所有这些步骤：

- **完全免费**：每天 10 万次请求额度，个人博客绰绰有余
- **全球 CDN**：Cloudflare 在全球 300+ 城市有节点，访问速度极快
- **无需服务器**：代码运行在边缘节点，不用管运维
- **自定义域名**：支持绑定自己的域名，还自动配 HTTPS
- **自动扩缩容**：流量暴增也不用担心

## 先选型：Workers Sites vs Pages vs Workers + KV

Cloudflare 上有三种跑博客的方式，选错会白费很多功夫：

| 方案 | 内容存哪 | 适合 |
|---|---|---|
| **Workers Sites** | 静态文件打包进 Worker | 纯静态、内容不常变 |
| **Cloudflare Pages** | Git 仓库，构建后分发 | **大多数博客** |
| **Workers + KV** | KV 键值存储 | 需要运行时动态读内容 |

- **纯静态博客**（Markdown 编译成 HTML）：用 **Pages**，Git 推送即部署，最省事
- **想做个能后台发文章的博客**：用 **Workers + KV**，文章存 KV，Worker 运行时读取渲染
- **Workers Sites**：Cloudflare 已不推荐新项目使用，被 Pages 取代了

这篇讲 **Workers + KV** 方案，因为它最能体现 Workers 的能力。但先说清楚：**如果你只是想把 Markdown 博客挂上去，直接跳到文末看 Pages 方案，那才是你的答案。**

## 前置准备

- 一个 Cloudflare 账号（免费注册）
- 安装 Node.js（建议 18+）
- 安装 Wrangler CLI
- （可选）一个自己的域名

### 安装 Wrangler

```bash
npm install -g wrangler
```

登录 Cloudflare 账号：

```bash
wrangler login
```

浏览器会自动打开授权页面，点允许。

## 创建项目

用 Hono 框架——专为边缘计算设计的轻量 Web 框架，在 Workers 上跑得极快。

```bash
npm create hono@latest my-blog -- --template cloudflare-workers
cd my-blog
npm install
```

## 编写 Worker 代码

创建 `src/index.ts`：

```typescript
import { Hono } from 'hono'

const app = new Hono()

// 首页
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8">
      <title>我的博客</title>
    </head>
    <body>
      <h1>欢迎来到我的博客！</h1>
      <p>这是用 Cloudflare Workers 搭建的免费博客。</p>
    </body>
    </html>
  `)
})

// 文章列表：从 KV 读
app.get('/posts', async (c) => {
  const list = await c.env.BLOG_POSTS.list()
  return c.json(list.keys)
})

// 单篇文章：从 KV 读
app.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  const post = await c.env.BLOG_POSTS.get(slug)
  if (!post) return c.notFound()
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh">
    <head><meta charset="UTF-8"><title>${slug}</title></head>
    <body><article>${post}</article></body>
    </html>
  `)
})

export default app
```

## 配置 Wrangler

`wrangler.toml`：

```toml
name = "my-blog"
main = "src/index.ts"
compatibility_date = "2026-01-01"

# 静态资源（CSS、图片等）交给 Workers 静态资源托管
[assets]
directory = "./assets"
binding = "ASSETS"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "BLOG_POSTS"
id = "<your-kv-id>"
```

`compatibility_date` 决定用哪个版本的 Workers 运行时，设新一点能用到更多特性，但别设成未来日期。

## 用 KV 存储文章

### 1. 创建命名空间

```bash
wrangler kv:namespace create "BLOG_POSTS"
```

会输出一个 `id`，填进 `wrangler.toml` 的 `id = "..."`。

### 2. 灌入内容

```bash
# 写入第一篇文章（value 可以是 HTML，也可以存 Markdown 让 Worker 渲染）
wrangler kv:key put --binding=BLOG_POSTS "hello-world" "$(cat posts/hello-world.html)"
```

批量写入用脚本：

```bash
for f in posts/*.html; do
  slug=$(basename "$f" .html)
  wrangler kv:key put --binding=BLOG_POSTS "$slug" "$(cat "$f")"
done
```

**KV 的写入额度要注意**：免费版每天 1000 次写、10 万次读。写操作用来发文章绰绰有余，但**别在每次请求时写 KV**（比如做访问计数），那很快就会超。

### 3. 从代码里验证

```bash
wrangler kv:key get --binding=BLOG_POSTS "hello-world"
```

能输出内容就对了。

## 本地预览与部署

### 本地跑

```bash
npm run dev
```

浏览器开 `http://localhost:8787`。Wrangler 会用 `miniflare` 在本地模拟 Workers + KV 环境，**KV 数据也会本地模拟一份**，不用连线上就能调试。

### 部署

```bash
npm run deploy
# 或直接
wrangler deploy
```

成功后会得到 `https://my-blog.<你的子域>.workers.dev`。博客上线了。

### 绑定自定义域名

域名在 Cloudflare 的话，两种方式：

**方式 A：Dashboard**

Workers & Pages → 你的项目 → Settings → Triggers → Custom Domains → 添加域名。DNS 和 SSL 自动配好。

**方式 B：Wrangler**

```bash
wrangler deploy --routes '["blog.example.com/*"]'
```

## 缓存与性能优化

Workers 默认不缓存 HTML 响应。给动态内容加缓存能大幅降低 KV 读取和提升速度：

```typescript
app.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  const cache = caches.default
  const cacheKey = new Request(`https://cache.local/posts/${slug}`)

  // 1. 先查缓存
  let res = await cache.match(cacheKey)
  if (res) {
    res = new Response(res.body, res)
    res.headers.set('X-Cache', 'HIT')
    return c.newResponse(res.body, res)
  }

  // 2. 缓存没有，读 KV
  const post = await c.env.BLOG_POSTS.get(slug)
  if (!post) return c.notFound()

  res = c.html(renderPost(slug, post))
  res.headers.set('Cache-Control', 'public, max-age=3600')

  // 3. 写进缓存，等下次命中
  c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()))

  return res
})
```

三个关键点：

- **`caches.default`** 是 Workers 内置的 Cache API，按数据中心缓存，不需要额外配置
- **`waitUntil`**：缓存写入放到后台做，不阻塞响应返回
- **Cache-Control**：同时控制浏览器缓存和 Cloudflare 边缘缓存

发新文章后想立即生效，用 Cache API 的 purge，或者简单点——把文章 key 加个版本号（`hello-world-v2`），旧的自然就失效了。

## 免费额度限制

| 项目 | 免费额度 | 注意 |
|---|---|---|
| 请求数 | 10 万次/天 | 个人博客很难超 |
| CPU 时间 | **单请求 10ms** | 纯文本处理够，重计算不行 |
| KV 读 | 10 万次/天 | 加了缓存基本用不完 |
| KV 写 | 1000 次/天 | 只用来发文章 |
| 子请求 | 50 次/请求 | 别在 Worker 里循环调外部 API |
| 脚本大小 | 1 MB（免费） | Hono 打包后几百 KB，够 |

**10ms CPU 限制是最容易撞的一条。** 它只算 CPU 时间，不算等待（等 KV、等外部 API 的时间不计数），所以大部分场景没问题。但如果你要在 Worker 里做图片缩放、大 JSON 解析，会超。

## 重要：默认你该用 Pages

说了这么多 Workers，现在说结论。

**如果你只是想把博客内容挂上去供人阅读，用 Cloudflare Pages，不要用 Workers。**

理由：

| | Workers + KV | Cloudflare Pages |
|---|---|---|
| 内容管理 | 要自己写灌数据的脚本 | Git 推送，平台构建 |
| 部署方式 | `wrangler deploy` | push 即部署 |
| 缓存 | 自己写 Cache API | 平台自动 |
| 预览环境 | 无（要自己搭） | 每个 PR 一个预览 URL |
| 构建集成 | 自己接 | 原生支持 Astro/Hugo/Next 等 |
| 适合 | 需要运行时动态逻辑 | 内容展示 |

Pages 把"构建 + 分发 + 缓存 + 预览"全包了，而 Workers 方案这些都要自己拼。本站自己就是从 Workers 方案迁到 Pages + Astro 的，工作量降了一个数量级。

**什么时候才该用 Workers + KV？**

- 文章要能在线编辑、保存，不想重新构建部署
- 要做多用户、评论、权限这类运行时逻辑
- 要按请求参数动态生成内容

这些需求 Pages 做不到，才值得上 Workers。

## 成本分析

| 项目 | 传统建站 | Cloudflare Workers |
|---|---|---|
| 服务器 | ¥300-3000/年 | **免费** |
| CDN 加速 | ¥100-500/年 | **免费** |
| SSL 证书 | ¥0-800/年 | **免费** |
| 域名 | ¥50/年 | ¥50/年（可选） |
| **总成本** | **¥450-4350/年** | **¥0-50/年** |

## 小结

Workers 的能力是真的强——10ms 冷启动、全球 300+ 节点、免费额度慷慨到离谱。但**能力强不等于适合**。

给你的决策路径：

1. **Markdown / 静态博客 → 直接上 Cloudflare Pages**，配 Astro 或 Hugo，Git 推送即部署。本站就是这个方案，构建和部署见《Vercel vs Cloudflare Pages》的对比
2. **要在线编辑、动态逻辑 → Workers + KV**，用这篇的方案
3. **需要数据库 → 加 D1**，见《Cloudflare 数据层三件套》
4. **要存图片/文件 → 加 R2**，见《Cloudflare R2 对象存储完全指南》

零成本建站这件事，Workers 和 Pages 都能做到。选对方案，比选对框架更重要。
