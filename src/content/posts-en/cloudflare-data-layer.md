---
title: "The Cloudflare Data Layer Trio: D1, KV, and Queues in Practice"
pubDatetime: "2026-08-28T00:00:00.000Z"
description: "We covered building a free blog on Cloudflare Workers; this post fills in the data layer. Learn when to use D1 (SQLite-compatible relational DB), KV (global key-value store), and Queues (message queue), with config, code examples, and a selection cheat sheet for your Worker apps."
author: "Xiaozha"
tags: ["Cloudflare", "Tutorial", "Workers", "Database", "Free Tools"]
featured: false
draft: false
zhSlug: "cloudflare-data-layer"
ogImage: "/images/cloudflare-data-layer-cover.jpg"
---

Completing the Cloudflare series: I previously wrote about [building a free blog on Workers](/en/article/cloudflare-workers-blog) and [R2 object storage](/en/article/cloudflare-r2-storage). This post covers the data layer — D1, KV, and Queues, the three fundamentals for storing data in Worker apps: relational data, key-value data, and async tasks.

## Know the Three First

| Service | Type | Best For | Consistency |
|---|---|---|---|
| **D1** | Relational DB (SQLite-compatible) | Structured data, SQL queries, user data | Strong |
| **KV** | Global key-value store | Config, cache, sessions, read-heavy | Eventually consistent |
| **Queues** | Message queue | Async tasks, load shedding, decoupling | At-least-once delivery |

In one sentence: **need SQL? D1. Need lightning-fast config reads? KV. Need to queue work? Queues.**

## D1: The Relational Database

D1 is Cloudflare's globally distributed database built on SQLite — you write plain SQL right inside a Worker.

### Create and Bind

```bash
wrangler d1 create my-blog-db
```

Bind it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"          # variable name inside the Worker
database_name = "my-blog-db"
database_id = "<id generated at creation>"
```

### Schema and Queries

Create a local schema (`schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Query it from a Worker:

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

`prepare().bind().all()` is the standard D1 three-step; parameterized and injection-safe, just like any other SQLite usage.

## KV: The Key-Value Store

KV is a globally replicated key-value store with millisecond edge reads — perfect for config, cache, and other read-heavy, write-light data.

```bash
wrangler kv namespace create BLOG_KV
```

Bind:

```toml
[[kv_namespaces]]
binding = "BLOG_KV"
id = "<id generated at creation>"
```

Read and write from a Worker:

```js
// Read
const cached = await env.BLOG_KV.get("homepage:latest");
if (cached) return new Response(cached);

// Write (optional TTL in seconds)
await env.BLOG_KV.put("homepage:latest", html, { expirationTtl: 600 });
```

The classic KV pattern: check cache first, compute on miss, write back.

## Queues: The Message Queue

Queues lets Workers pass messages to each other asynchronously — great for pulling slow work out of the request path.

```toml
[[queues.producers]]
binding = "MY_QUEUE"   # producer binding
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10
```

Produce a message:

```js
// Generate a thumbnail after an image upload
await env.MY_QUEUE.send({ task: "resize", key: "photo-1.webp" });
return new Response("queued");
```

Consume it (in the same Worker file):

```js
export default {
  async queue(batch, env) {
    for (const msg of batch.messages) {
      const { task, key } = msg.body;
      // do the slow work here: thumbnails, emails, sync...
      console.log(`processing ${task}: ${key}`);
    }
  },
};
```

The request returns "queued" immediately while the real work happens in the queue — that's load shedding.

## A Typical Combination

A full-stack Cloudflare blog/app can be assembled like this:

- **D1**: posts, comments, user data
- **KV**: homepage HTML cache, site config, session tokens
- **R2**: images and static files (see the [R2 guide](/en/article/cloudflare-r2-storage))
- **Queues**: thumbnail generation and notifications after R2 uploads

## Pricing

All three come with generous free tiers (D1: storage and reads/writes; KV: operations; Queues: messages) — more than enough for personal projects. Beyond that, usage-based pricing applies; see the [Cloudflare pricing page](https://www.cloudflare.com/plans/developer-platform/) for current numbers.

## Summary

D1, KV, and Queues complete the "store" side of Worker apps: relational, key-value, and queueing, each covering its own lane — free-tier start, serverless, and globally distributed. Combined with the existing Workers + R2 + [Tunnel](/en/article/cloudflare-tunnel) guides, a full-stack app can run on Cloudflare at zero cost.
