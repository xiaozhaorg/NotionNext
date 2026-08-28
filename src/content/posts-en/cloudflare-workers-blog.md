---
title: "Zero-Cost Blog Hosting with Cloudflare Workers: Complete Tutorial"
pubDatetime: "2026-07-20T00:00:00.000Z"
description: "Step-by-step guide to building a personal blog on Cloudflare Workers for free. No server needed, global CDN, custom domain support. Launch your website at zero cost."
author: "Xiaozha"
tags: ["Cloudflare", "Tutorial", "Free Tools", "Blogging"]
featured: false
draft: false
ogImage: "/images/cloudflare-workers-blog-real.jpg"
coverAlt: "Blue storage array lights in cloud server room"
zhSlug: "cloudflare-workers-blog"
---

A traditional blog setup reads like a shopping list: buy a VPS (a few hundred to a few thousand dollars a year), install a web server, configure PHP or Node, patch security updates forever, and pray you never get hacked. **Cloudflare Workers** removes every single one of those steps.

Workers is Cloudflare's serverless execution environment. Your code runs on Cloudflare's edge network — more than 300 cities worldwide — inside a tiny, fast JavaScript runtime. For a personal blog, it is a genuinely **zero-cost** hosting solution: free tier, global CDN acceleration, automatic HTTPS, and no server to maintain.

In this complete tutorial you will build a real blog on Cloudflare Workers: scaffold a project with Wrangler CLI, serve static assets from an `assets` directory, store articles in Cloudflare KV, add dynamic routes like `/article/:slug`, tune caching, bind a custom domain, and finally decide whether Workers or the simpler Cloudflare Pages is the better fit for you.

---

## Why Choose Cloudflare Workers for a Blog?

### 1. Completely free

The Workers free plan gives you **100,000 requests per day** — that is about 3 million requests a month. A personal blog is lucky to get a few thousand. You are nowhere near the limit.

### 2. Global CDN built in

Cloudflare runs over 300 edge locations. Every request hits the nearest data center, so readers in New York, London, and Singapore all get sub-100ms load times without you configuring a single cache rule.

### 3. No server, no ops

There is no machine to rent, no SSH to learn, no `apt upgrade` to babysit, no SSL renewal (Cloudflare handles certificates automatically), no disk to run out of. You write code, run one deploy command, and you are live.

### 4. Custom domains and HTTPS included

Workers supports binding your own domain. Cloudflare provisions the DNS record and the TLS certificate for you — no Let's Encrypt cron jobs.

### 5. Auto-scaling

If your post goes viral and traffic spikes 100×, Workers scales instantly. There is no server to provision, no Nginx config to tune, and no extra bill.

Traditional hosting keeps costing you every month whether you have visitors or not. Workers only charges (on the paid tier) for what you actually use. For a personal blog, the economics are unbeatable.

---

## Choosing the Right Approach: Workers Sites vs. Pages vs. Workers + KV

There are three common ways to "host a blog on Cloudflare", and they are often confused. Here is the honest comparison before you write any code.

| Approach | What it is | Best for | Static assets? | Dynamic logic? |
| --- | --- | --- | --- | --- |
| **Workers Sites** (legacy) | Old way to attach assets to a Worker via `wrangler publish --assets` | Legacy projects only | Yes | Yes |
| **Cloudflare Pages** | Full static hosting platform with git integration and serverless Functions | Static blogs, most users | Yes | Via Pages Functions |
| **Workers + Static Assets** | Modern Workers with a bundled `assets` directory + KV/D1 for content | This tutorial | Yes | Yes, full Workers runtime |

The short recommendation: **if you just want a blog, use Cloudflare Pages** (more on that at the end). The reason we go through Workers here is that it is the most flexible option — you get the entire Workers runtime, KV storage, caching, and custom routing in one deployable unit, with no extra platform to learn.

For this tutorial we use the modern **Workers Static Assets** approach: static files (CSS, JS, images) live in an `assets` folder, and a Worker script (`src/index.ts`) handles everything else — including dynamic routes backed by KV.

---

## Prerequisites

You need only three things:

1. **A Cloudflare account** — free signup at [dash.cloudflare.com](https://dash.cloudflare.com). You can deploy a blog without a domain (you get a free `*.workers.dev` subdomain).
2. **Node.js 18 or newer** — for Wrangler and the build tooling. Check with `node -v`.
3. **(Optional) A domain** hosted on Cloudflare, if you want a custom domain later.

### Install Wrangler CLI

Wrangler is Cloudflare's official command-line tool. Install it globally, or run it via `npx`:

```bash
npm install -g wrangler
wrangler --version
```

Then log in. This opens a browser window where you authorize Cloudflare:

```bash
wrangler login
```

Click **Allow** on the authorization page. Wrangler stores the token locally in `~/.wrangler/`.

---

## Scaffolding the Project

Start from the official template. We use the **Hono** framework — a tiny web framework designed specifically for edge runtimes, with first-class Cloudflare Workers bindings.

```bash
# Create the project (choose "Hello World" / Hono when prompted)
npm create cloudflare@latest my-blog

cd my-blog
npm install hono
```

The generated structure looks like this:

```
my-blog/
├── assets/            # static files served automatically
│   └── style.css
├── src/
│   └── index.ts       # Worker entrypoint
├── wrangler.toml      # configuration
├── package.json
└── tsconfig.json
```

> **Note:** If your template version predates the `assets` directory, create it yourself and reference it in `wrangler.toml` (see below).

---

## Writing the Worker Code

Replace `src/index.ts` with a Hono app that serves a homepage listing articles and a detail route. We will wire in KV storage in a moment — for now, start with the routing skeleton.

```ts
import { Hono } from "hono";

type Bindings = {
  BLOG_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Homepage: list all published articles from KV
app.get("/", async (c) => {
  const list = await c.env.BLOG_KV.list({ prefix: "article:" });

  const items = list.keys
    .map((k) => k.name.replace("article:", ""))
    .sort()
    .reverse()
    .map((slug) => `<li><a href="/article/${slug}">${slug}</a></li>`)
    .join("");

  return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My Workers Blog</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <h1>My Workers Blog</h1>
  <ul>${items || "<li>No articles yet.</li>"}</ul>
</body>
</html>`);
});

// Article detail: /article/:slug
app.get("/article/:slug", async (c) => {
  const slug = c.req.param("slug");
  const markdown = await c.env.BLOG_KV.get(`article:${slug}`);

  if (!markdown) {
    return c.text("Article not found", 404);
  }

  return c.html(`<pre>${markdown}</pre>`);
});

export default app;
```

This is intentionally simple. A real blog would render Markdown to HTML (Hono has a `hono/markdown` module or you can add a library like `marked`), but the routing pattern — `/` lists keys, `/article/:slug` fetches one key — is exactly how a KV-backed blog works.

---

## Configuring Wrangler

`wrangler.toml` is where you declare the project name, entrypoint, static assets, and KV bindings.

```toml
name = "my-blog"
main = "src/index.ts"
compatibility_date = "2026-07-01"

# Serve everything in ./assets at the root of the Worker
[assets]
directory = "./public"
binding = "ASSETS"

# KV namespace binding (see next section)
[[kv_namespaces]]
binding = "BLOG_KV"
id = "REPLACE_WITH_YOUR_NAMESPACE_ID"
preview_id = "REPLACE_WITH_YOUR_PREVIEW_NAMESPACE_ID"
```

Two details matter here:

- **`[assets]`** points at the folder Wrangler uploads as static files. The default is `./assets`; here we use `./public` to match a common convention. `not_found_handling` can be `"none"` (404) or `"single-page-application"` (fall back to `index.html` for SPA-style routing).
- **`[[kv_namespaces]]`** gives your Worker access to Cloudflare KV through a global named `BLOG_KV`. We create the namespace next.

---

## Storing Blog Content in Cloudflare KV

Cloudflare KV (Key-Value store) is a global, low-latency data store. Perfect for blog content: keys are `article:<slug>`, values are Markdown strings. Free plan allows **100,000 reads and 1,000 writes per day** — far more than a blog needs.

### 1. Create the namespace

```bash
wrangler kv namespace create BLOG_KV
```

The command prints an `id` and a `preview_id`. Paste them into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BLOG_KV"
id = "2f3f0e1a...your-id..."
preview_id = "2f3f0e1a...your-preview-id..."
```

### 2. Seed some content

Write a Markdown file locally, then push it into KV:

```bash
# write your first article
cat > hello.md <<'EOF'
# Hello World

Welcome to my blog running on Cloudflare Workers!

- Hosted on the edge
- Zero server cost
- Global CDN
EOF

wrangler kv key put --binding=BLOG_KV "article:hello" --path=./hello.md
```

You can also write directly with a string value:

```bash
wrangler kv key put --binding=BLOG_KV "article:about" "About me: I blog about Cloudflare and self-hosting."
```

### 3. Verify from code

Back in `src/index.ts`, the binding `c.env.BLOG_KV` is already typed and used:

```ts
const markdown = await c.env.BLOG_KV.get(`article:${slug}`);
```

That is the whole pattern — `BLOG_KV.get()` on the detail route, `BLOG_KV.list()` on the homepage.

---

## Local Preview and Deploy

### Run locally

```bash
npm run dev
```

Open `http://localhost:8787` and you should see your homepage. Because KV bindings work in local mode (backed by a local simulation), the `dev` server already reads the keys you uploaded.

### Deploy to Cloudflare

```bash
npm run deploy
# or directly:
wrangler deploy
```

Within seconds you get a URL like:

```
https://my-blog.your-subdomain.workers.dev
```

Your blog is now live on the global edge, at zero cost.

---

## Binding a Custom Domain

The `*.workers.dev` address works, but a custom domain looks professional and is better for SEO. If your domain is already hosted on Cloudflare, this takes about two minutes.

### Option A: Dashboard

1. Go to **Cloudflare Dashboard → Workers & Pages**.
2. Select your project (**my-blog**).
3. Open **Settings → Domains & Routes → Add → Custom Domain**.
4. Enter `blog.example.com` and save.
5. Cloudflare automatically creates the DNS record and issues an SSL certificate.

### Option B: Wrangler

```bash
wrangler domains add blog.example.com
```

Both options require the domain to be on Cloudflare's nameservers (or at least a CNAME record pointing at your zone). Once the status flips to active, `https://blog.example.com` serves your blog with automatic HTTPS.

---

## Caching and Performance Optimization

Workers sit behind Cloudflare's CDN, so static assets get cached almost for free if you send the right headers. But you can do better with the **Cache API**, which lets your Worker read from and write to the CDN cache programmatically.

```ts
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/article/:slug", async (c) => {
  const slug = c.req.param("slug");
  const cacheKey = new Request(c.req.url, { method: "GET" });
  const cache = caches.default;

  // 1. Try the cache first
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // 2. Miss — build the HTML
  const markdown = await c.env.BLOG_KV.get(`article:${slug}`);
  if (!markdown) {
    return c.text("Article not found", 404);
  }

  const html = `<pre>${markdown}</pre>`;
  response = new Response(html, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });

  // 3. Store in the edge cache, then serve
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

export default app;
```

Key points about this pattern:

- **`s-maxage`** tells Cloudflare's CDN how long to hold the copy; **`max-age`** is for the browser cache.
- **`c.executionCtx.waitUntil(...)`** lets the cache write finish without blocking the response.
- **`cache.match()` / `cache.put()`** use the Cache API, so repeat hits never touch KV — free plan KV reads stay near zero.

For a blog that changes rarely, a `Cache-Control: public, max-age=3600` on article pages gives a dramatic reduction in origin work and a snappier experience for readers.

---

## Free Plan Limits You Should Know

Workers is free, but "free" has boundaries. Knowing them prevents surprises:

| Resource | Free plan limit |
| --- | --- |
| Requests | 100,000 / day |
| CPU time | 10 ms per request |
| KV reads | 100,000 / day |
| KV writes | 1,000 / day |
| KV storage | 1 GB total |
| Static asset file size | 25 MB per file |
| Script size (compressed) | 1 MB (free), 3 MB (paid) |

For a personal blog none of these are realistic constraints — 10 ms of CPU is plenty to read a KV key and return HTML, and 100,000 requests/day dwarfs blog traffic. If you ever outgrow them, the paid plan starts at $5/month and raises most limits by 10× or more.

---

## The Better Default: Use Cloudflare Pages Instead

Here is the honest conclusion most readers need: **for a typical personal blog, Cloudflare Pages is the simpler, better choice than Workers.**

Pages gives you:

- **Git integration** — connect a GitHub/GitLab repo and every `git push` auto-deploys.
- **Static sites as first-class citizens** — built for Astro, Hugo, Jekyll, Next.js, and every major SSG.
- **Free unlimited bandwidth** and free custom domains, same global CDN.
- **Pages Functions** when you occasionally need serverless logic (forms, redirects, middleware).
- **Built-in preview deployments** for pull requests.

Workers only makes sense when you need the raw Worker runtime — dynamic edge logic, KV/D1, middleware, A/B testing, or an API alongside the site. A content blog rarely needs that.

If your goal is a blog *today*, spin up a Pages project with your favorite static site generator, point a repo at it, and be done in minutes. The Workers walkthrough above is best viewed as an educational exercise — it teaches you the edge platform fundamentals that Pages Functions build on.

---

## Summary

In this tutorial you learned how to:

1. **Understand why Workers is a zero-cost hosting option** — free tier, global CDN, no server.
2. **Choose the right approach** — Workers Sites vs. Pages vs. Workers + KV.
3. **Scaffold a project** with `npm create cloudflare` and the Hono framework.
4. **Serve static assets** from an `assets` directory in `wrangler.toml`.
5. **Store blog content in KV** with `wrangler kv key put` and read it via `BLOG_KV.get()` / `list()`.
6. **Add dynamic routes** like `/article/:slug`.
7. **Cache aggressively** with the Cache API and `Cache-Control`.
8. **Bind a custom domain** from the dashboard or with `wrangler domains add`.
9. **Stay within free limits** — 100k requests/day is plenty.
10. **Decide between Workers and Pages** — and pick Pages for most real blogs.

The fastest way to test your understanding is to deploy this exact project and push one article into KV. Then, if you want a more polished blog, explore our guides on [Cloudflare Tunnel for exposing local services](/en/articles/cloudflare-tunnel-tutorial), [Cloudflare R2 object storage](/en/articles/cloudflare-r2-storage), and [Docker Compose for self-hosted apps](/en/articles/docker-compose-tutorial). Happy publishing! 🚀
