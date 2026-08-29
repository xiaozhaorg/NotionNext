---
title: Cloudflare 数据层三件套：D1 / KV / Queues 实战，给 Worker 加上数据库
pubDatetime: "2026-08-28T00:00:00.000Z"
description: 之前写了用 Cloudflare Workers 免费建站，这篇补上数据层：D1 关系型数据库、KV 键值存储、Queues 消息队列的定位、配置与代码示例，附三选一选型表，让 Worker 应用真正能存数据。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - Workers
  - 数据库
  - 免费工具
featured: false
draft: false
enSlug: "cloudflare-data-layer"
ogImage: "/images/cloudflare-data-layer-real.jpg"
---

Cloudflare 系列补全：之前写了 [Workers 免费建站](/article/cloudflare-workers-blog) 和 [R2 对象存储](/article/cloudflare-r2-storage)，这篇讲数据层——D1、KV、Queues 是 Worker 应用存数据的三个基本盘，覆盖了"关系型数据、键值数据、异步任务"三大需求。

## 一、先搞清楚三者的定位

| 服务 | 类型 | 适合场景 | 一致性 |
|---|---|---|---|
| **D1** | 关系型数据库（SQLite 兼容） | 结构化数据、SQL 查询、用户数据 | 强一致 |
| **KV** | 全局键值存储 | 配置、缓存、会话、读多写少 | 最终一致 |
| **Queues** | 消息队列 | 异步任务、削峰、解耦 | 至少一次投递 |

一句话：**要 SQL 用 D1，要极速读配置用 KV，要排队干活用 Queues。**

## 二、D1：关系型数据库

D1 是 Cloudflare 基于 SQLite 构建的全球分布式数据库，Worker 里直接写 SQL。

### 创建与绑定

```bash
# 创建数据库
wrangler d1 create my-blog-db
```

在 `wrangler.toml` 里绑定：

```toml
[[d1_databases]]
binding = "DB"          # Worker 里的变量名
database_name = "my-blog-db"
database_id = "<创建时生成的ID>"
```

### 建表与查询

本地先建 schema（`schema.sql`）：

```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Worker 里查询：

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const postId = url.searchParams.get("post");

    const { results } = await env.DB.prepare(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC"
    ).bind(postId).all();

    return Response.json(results);
  },
};
```

`prepare().bind().all()` 是 D1 的标准三段式，防注入且参数化查询，跟其他 SQLite 用法几乎一致。

## 三、KV：键值存储

KV 是全球复制的键值存储，边缘读取毫秒级，适合配置、缓存这类读多写少的场景。

```bash
wrangler kv namespace create BLOG_KV
```

绑定：

```toml
[[kv_namespaces]]
binding = "BLOG_KV"
id = "<创建时生成的ID>"
```

Worker 里读写：

```js
// 读取
const cached = await env.BLOG_KV.get("homepage:latest");
if (cached) return new Response(cached);

// 写入（可带 TTL，单位秒）
await env.BLOG_KV.put("homepage:latest", html, { expirationTtl: 600 });
```

典型的 KV 用法就是"先查缓存，没有再算，算完回填"。

## 四、Queues：消息队列

Queues 让 Worker 之间异步传递消息，适合把耗时任务从请求链路里拆出去。

```toml
[[queues.producers]]
binding = "MY_QUEUE"   # 生产者绑定
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10
```

生产者发消息：

```js
// 图片上传后异步生成缩略图
await env.MY_QUEUE.send({ task: "resize", key: "photo-1.webp" });
return new Response("已入队");
```

消费者处理（同一个 Worker 文件里）：

```js
export default {
  async queue(batch, env) {
    for (const msg of batch.messages) {
      const { task, key } = msg.body;
      // 在这里做耗时操作：缩图、发信、同步……
      console.log(`processing ${task}: ${key}`);
    }
  },
};
```

请求立即返回"已入队"，真正的活儿在队列里慢慢干——这就是削峰。

## 五、实战组合建议

一个典型的 Cloudflare 全栈博客/应用可以这样搭：

- **D1**：文章、评论、用户等结构化数据
- **KV**：首页 HTML 缓存、站点配置、会话 token
- **R2**：图片等静态文件（见 [R2 实战](/article/cloudflare-r2-storage)）
- **Queues**：R2 上传后的缩略图生成、通知发送

## 六、成本

三者都有慷慨的免费额度（D1 有存储与读写额度、KV 有读写次数、Queues 有消息条数），个人项目基本用不完；超出后按官方定价计费，具体数字以 [Cloudflare 定价页](https://www.cloudflare.com/plans/developer-platform/) 为准。

## 小结

D1 / KV / Queues 补齐了 Worker 应用的"存"能力：关系型、键值、队列各管一摊，全部免费额度起步、无服务器、全球边缘。配上已有的 Workers + R2 + [Tunnel](/article/cloudflare-tunnel) 教程，一套全栈应用可以在 Cloudflare 上零成本跑起来。
