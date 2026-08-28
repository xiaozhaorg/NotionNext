---
title: "Vercel vs Cloudflare Pages: Ultimate Static Site Hosting Comparison (2026)"
pubDatetime: "2026-07-21T00:00:00.000Z"
description: "Deep comparison of Vercel and Cloudflare Pages: deployment experience, performance, pricing, free tiers. Which is the best static site hosting platform in 2026?"
author: "Xiaozha"
tags: ["Tutorial", "Free Tools", "Cloudflare", "Vercel"]
featured: false
draft: false
ogImage: "/images/vercel-vs-cloudflare-real.jpg"
coverAlt: "Cloud computing deployment concept with clouds and server room"
zhSlug: "vercel-vs-cloudflare"
---

If you have ever deployed a static site in the last few years, you have almost certainly stared at a choice between two platforms: **Vercel** and **Cloudflare Pages**. Both are free for personal projects, both connect to your Git repository and redeploy on every push, and both promise global edge delivery with automatic HTTPS. So which one should you actually use in 2026?

The honest answer is: **it depends on your project**. Vercel is the natural home for Next.js and React-heavy applications, while Cloudflare Pages is the bandwidth-unlimited, Workers-powered workhorse that shines for content-heavy and traffic-spiky sites. This guide breaks down both platforms feature by feature — deployment experience, performance, pricing, functions, databases, domains — and ends with a clear decision framework.

---

## What Are Vercel and Cloudflare Pages?

**Vercel** is the company behind the Next.js framework. It offers a full platform for building and deploying web applications: static sites, serverless functions, edge functions, preview deployments, and a rich ecosystem of first-party integrations (KV, Postgres, Blob, Analytics). Its Hobby plan is free forever and is famously generous enough to run a small side project without paying a cent.

**Cloudflare Pages** is Cloudflare's static site hosting product, built on top of the Cloudflare Workers runtime. It started as a "Netlify for Cloudflare" and has grown into a full JAMstack platform with Pages Functions, direct access to the entire Workers ecosystem (D1, R2, KV, Durable Objects, Queues), and a pricing model that is almost absurdly friendly: **unlimited bandwidth on the free tier**.

Both platforms share the same core workflow:

1. Connect a Git repository (GitHub, GitLab, or Bitbucket).
2. Pick a framework preset and a build command.
3. Push to `main` and the platform builds, deploys, and gives you a `*.vercel.app` or `*.pages.dev` URL.
4. Open a pull request and you get an isolated **preview deployment** with its own URL.

The difference is in the details — and those details decide which platform fits your project.

---

## Deployment Experience: Git Integration, Build Speed, Previews

### Git Integration

| Capability | Vercel | Cloudflare Pages |
| --- | --- | --- |
| Git providers | GitHub, GitLab, Bitbucket | GitHub, GitLab |
| Monorepo support | Excellent (turborepo-aware, per-directory deploys) | Good (custom root directory per project) |
| Framework presets | ~100 (Next.js is the first-class citizen) | ~50+, including Astro, SvelteKit, Remix, Nuxt, Next.js |
| Preview deployments | Every push + PR gets a URL | Every push + PR gets a URL |
| Instant rollback | One-click from the dashboard | Yes, via production branch redeploy |

**Vercel** treats the Git workflow as a first-class product. When you import a repo it auto-detects the framework, reads your `package.json` scripts, and wires up environments (`production`, `preview`, `development`) automatically. Monorepos with Turborepo get special treatment, and the deployment history is clean and reversible. Vercel's own CLI (`vercel`) can also deploy without Git at all — useful for CI pipelines.

**Cloudflare Pages** has a slightly more minimal dashboard, but the core flow works identically. One notable difference: Cloudflare lets you deploy from **direct upload** (drag a `dist` folder) or via the **Wrangler CLI** (`npx wrangler pages deploy dist`), which is handy for projects that don't live in Git. On the flip side, Cloudflare's auto-detection is occasionally slower and less magic for unusual frameworks, and some Next.js edge cases still require the `@cloudflare/next-on-pages` adapter or the newer Cloudflare-native Next.js integration.

### Build Speed

Build speed depends more on your framework than the platform, but there are real differences:

- **Vercel** is optimized for Next.js. It uses Turbopack-aware caching, smart dependency caching, and parallel builds, so large Next.js projects build noticeably faster on Vercel than almost anywhere else. The Hobby plan includes **100 build hours per month**.
- **Cloudflare Pages** gives you **500 builds per month** on the free plan, which is more headroom for teams that push constantly. Builds run on Cloudflare's workers, and while they're usually quick for Astro/SvelteKit/plain static sites, very large Next.js builds can be slower and occasionally hit the 20-minute build limit.

For most personal blogs and marketing sites, both feel instant. Build speed starts to matter when you have a big monorepo or a heavy framework.

### Preview Deployments

Both platforms create a unique URL for every PR. This is the killer feature that killed the "deploy from your laptop" workflow — your reviewer opens a link, not a screenshot. Vercel's preview URLs (`my-site-git-branch-slug.vercel.app`) are easier to read; Cloudflare's (`hash.pages.dev`) are uglier but functionally identical. Both support **password protection** on previews for non-public projects.

---

## Performance: CDN Coverage, TTFB, Global Reach

This is where the two platforms diverge the most.

### Network Size

- **Cloudflare** operates one of the largest edge networks on earth: **330+ data centers across 120+ countries**. Static assets are served from a node near your visitor almost everywhere on the planet, and TTFB is consistently the best-in-class for static content.
- **Vercel** routes static files through its edge network (backed by AWS CloudFront and partner PoPs) with a footprint that, while large, is not Cloudflare-sized. More importantly, Vercel **serverless functions run in one of ~30 regions** you can select — so dynamic requests must travel from the edge to your function's region and back.

### TTFB (Time To First Byte)

For a **static site**, Cloudflare Pages usually wins on TTFB because the asset can be served from the closest of 330+ nodes. Vercel is rarely far behind for cached static files.

For **dynamic content** (serverless functions), the picture flips depending on configuration:

- Vercel lets you pick a function region (e.g., `iad1` in Virginia, `hkg1` in Hong Kong). If you choose the wrong one, every API call pays a round trip across the ocean.
- Cloudflare runs Workers at the **edge**, meaning your function executes in the same city that received the request. For dynamic workloads, Cloudflare's edge execution model almost always yields lower TTFB globally.

### Caching and Smart Routing

- Vercel honors `Cache-Control` headers and offers the `stale-while-revalidate` (SWR) pattern for incrementally static regeneration (ISR).
- Cloudflare has ultra-flexible caching rules, cache tiers, and — on paid plans — **Argo Smart Routing**, which picks the fastest path across the backbone. Its caching is battle-tested by years of serving the public web.

**Bottom line:** For a pure static site with global visitors, Cloudflare Pages has the performance edge. For a Next.js app with ISR and regional traffic, Vercel's tight integration is hard to beat.

---

## Pricing and Free Tiers

Let's get the numbers that matter most.

| Free tier | Vercel Hobby | Cloudflare Pages + Workers Free |
| --- | --- | --- |
| Price | $0 | $0 |
| Bandwidth | **100 GB / month** | **Unlimited** |
| Builds | 100 build hours / month | 500 builds / month |
| Static requests | Unlimited | Unlimited |
| Functions | 100 GB-hours serverless execution + edge invocations | 100,000 Worker requests / day |
| Projects | Unlimited | Unlimited |
| Custom domains | Unlimited | Up to 100 per project |
| Web Analytics | 2,500 events / month (free tier) | Unlimited, privacy-first |

### The Bandwidth Story

This is the single biggest practical difference. **Vercel caps Hobby at 100 GB of bandwidth per month** — once you exceed it you either upgrade to Pro ($20/user/month) or the site gets throttled. A site serving a popular PDF, a podcast feed, or a game demo can burn through 100 GB quickly.

**Cloudflare Pages charges nothing for bandwidth, ever.** Serving 500 GB or 5 TB of static files costs the same: $0. This makes Cloudflare Pages the obvious choice for anything bandwidth-hungry — downloadable assets, media, documentation sites, or anything that could go viral.

### When Free Plans Cost You

- Vercel's Hobby plan removed the "one project only" restriction a while ago, but heavy function usage still pushes you to Pro. If your site is heavily dynamic, the 100 GB-hours function budget can be hit sooner than you expect.
- Cloudflare's free Worker limit of **100,000 requests/day** is per account, shared across Workers, Pages Functions, and D1 reads. A busy API can hit that. Upgrading to the $5/month Workers Paid plan raises it to 10 million requests/day and is dramatically cheaper than Vercel Pro for heavy API traffic.

**Pricing verdict:** For static-heavy, traffic-spiky projects, Cloudflare is effectively free where Vercel would charge. For a typical developer portfolio or SaaS marketing site, both free tiers are plenty.

---

## Serverless Functions and Edge Compute

### Vercel Functions

Vercel offers two tiers of compute:

- **Serverless Functions** — Node.js, Python, Go, Ruby, or .NET, deployed as API routes (`/api/...`). Great for heavy compute, database access, or anything needing standard runtime libraries.
- **Edge Functions** — JavaScript/TypeScript running on Vercel's edge runtime with a tiny footprint (no Node APIs). For redirects, geolocation, and A/B splits.

In Next.js, a file in `app/api/` becomes a serverless function automatically, and `export const runtime = 'edge'` switches a route to the edge. The DX is genuinely excellent — you write framework code and Vercel figures out the rest.

### Cloudflare Workers + Pages Functions

Cloudflare uses the **Workers** runtime, an extremely fast V8-based execution model:

- **Pages Functions** — drop a `functions/` directory in your project and each file becomes an edge handler. They have the same API as Workers, so everything you learn transfers.
- **Workers** — the general-purpose serverless platform, with KV, R2, D1, Durable Objects, Queues, and more available natively.
- Workers run **at the edge** in all 330+ cities, with a startup time measured in microseconds (vs. tens of milliseconds for warm serverless functions).

The tradeoff: Workers are JavaScript/TypeScript/WASM only. There's no official Python or Go runtime (you can compile WASM from Rust/Go). If your backend logic is Node-ecosystem code, Vercel's flexible runtimes are more comfortable.

### Features: Rewrites, Redirects, A/B Testing

| Feature | Vercel | Cloudflare Pages |
| --- | --- | --- |
| Redirects / rewrites | `vercel.json` (`redirects`, `rewrites`, `headers`) | `_redirects` file or `wrangler.jsonc` / Pages config |
| Custom headers | `vercel.json` `headers` | `_headers` file |
| A/B testing | Built-in **Experiments** (Pro) | Manual — Workers routing or analytics flags |
| Middleware / edge logic | Next.js middleware, Edge Config | Workers middleware, `_middleware.ts` |
| Rate limiting | Vercel WAF (paid) | Cloudflare WAF + Rate Limiting (free tier included) |

Vercel's `vercel.json` is the friendliest way to manage redirects:

```json
{
  "redirects": [
    { "source": "/blog/old-post", "destination": "/blog/new-post", "permanent": true }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

Cloudflare Pages uses a simple `_redirects` file:

```
/blog/old-post   /blog/new-post   301
/assets/*        /assets/:splat   200
```

And a `_headers` file for cache control:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

**A/B testing** is the one area where Vercel is clearly ahead out of the box — its Experiments feature lets you split traffic between deployment variants with a toggle in the dashboard. On Cloudflare you can achieve the same with Workers (e.g., routing a cookie-based percentage to a variant) or the paid **Version Management / Gradual Deployments** feature, but there's no one-click equivalent on the free plan.

---

## Database and Storage Ecosystem

Both platforms have aggressively expanded from "hosting" into "backend":

### Vercel Ecosystem

- **Vercel KV** — a Redis-compatible store, great for caching, sessions, and rate limiting.
- **Vercel Postgres** — serverless Postgres (powered by Neon under the hood) with a slick dashboard.
- **Vercel Blob** — file upload/storage with CDN delivery (notably *not* zero-egress).
- **Edge Config** — globally-synced config for feature flags and A/B testing.
- **Vercel AI SDK** — first-party toolkit for streaming LLM responses from your functions.

### Cloudflare Ecosystem

- **D1** — serverless SQLite database with a free tier (5 GB on free, generous usage).
- **R2** — S3-compatible object storage with **zero egress fees** (free: 10 GB storage).
- **KV** — eventually-consistent key-value store for config, cache, and sessions.
- **Durable Objects** — stateful compute for real-time collaboration, WebSockets, presence.
- **Queues** — message queues for async work.
- **Hyperdrive** — a connection pooler that accelerates any external Postgres.
- **Workers AI / Vectorize** — inference and embeddings at the edge.

**The strategic difference:** Vercel's databases live in the Vercel cloud and bill per usage, and Blob has normal egress costs. Cloudflare's entire stack — especially **R2 with zero egress** — is designed so you can build a whole application backend and never pay a surprise bandwidth bill. If your app stores and serves user uploads, that zero-egress R2 story is a decisive advantage.

---

## Domains and HTTPS

- **Vercel** — add custom domains on the Hobby plan; each gets an automatic Let's Encrypt certificate, provisioned and renewed for you. Wildcard domains and apex domains work out of the box. DNS can be managed in the Vercel dashboard.
- **Cloudflare Pages** — up to 100 custom domains per project on the free plan, with Cloudflare's SSL/TLS handling certificates automatically. If your domain is already on Cloudflare DNS, the zone's full proxy (orange cloud) is free and adds DDoS protection, WAF rules, and faster routing with zero extra config.

If you already use Cloudflare for DNS (very common), deploying Pages to the same zone is trivially easy and gets you the full security suite for free. Vercel requires you to either point DNS at Vercel or set up a CNAME/ALIAS; either way, HTTPS is automatic.

---

## The Decision Framework: Which Should You Choose?

### Choose Vercel if...

- Your project is **Next.js** — especially with ISR, Server Components, middleware, or heavy use of the App Router.
- You want **flexible serverless runtimes** (Node.js, Python, Go, Ruby).
- You value **one-click A/B testing** (Experiments) and the tightest framework-level DX.
- You want the polished dashboard, the huge integration marketplace, and Turborepo monorepo support.
- Your traffic is modest and predictable — you'll stay under the 100 GB bandwidth cap.

### Choose Cloudflare Pages if...

- Your site is **bandwidth-heavy** — downloads, media, docs, or anything that could go viral. Unlimited bandwidth is a superpower.
- You want the **best global TTFB** and the largest edge network.
- You're building on the **Workers ecosystem**: R2 storage, D1 database, KV, Queues — all with a serious free tier.
- You value **privacy-first analytics** (Cloudflare Web Analytics is free and unlimited) and built-in DDoS/WAF protection.
- You're fine with JavaScript/TypeScript/WASM compute (Workers) and don't need Python/Go runtimes.

### Both Are Great for...

- **Static blogs** (Astro, Hugo, Jekyll, or plain HTML) — either platform is excellent and free.
- **Jamstack portfolios** and marketing sites with a sprinkle of API routes.
- **Docs sites** with search, versioning, and preview deployments.

---

## Side-by-Side Comparison Table

| Aspect | Vercel | Cloudflare Pages |
| --- | --- | --- |
| Created by | Vercel (Next.js) | Cloudflare |
| Best for | Next.js / React apps | Static content, Workers apps |
| Free bandwidth | 100 GB / month | **Unlimited** |
| Builds (free) | 100 build hours / month | 500 builds / month |
| Functions | Serverless (Node, Py, Go, Ruby) + Edge | Workers + Pages Functions (JS/TS/WASM) |
| Function location | ~30 selected regions | Edge (330+ cities) |
| CDN PoPs | Large edge network | 330+ data centers, 120+ countries |
| Databases | KV, Postgres, Blob, Edge Config | D1, R2 (zero egress), KV, DO, Queues |
| A/B testing | Experiments (built-in, Pro) | Manual via Workers |
| Image optimization | Built-in | Cloudflare Images (paid) |
| Analytics | Vercel Analytics (limited free) | Web Analytics (free, unlimited) |
| Web security | Vercel WAF (paid) | WAF, DDoS, Rate Limiting (free) |
| Git providers | GitHub, GitLab, Bitbucket | GitHub, GitLab |
| Preview deploys | Yes | Yes |
| Rollbacks | One-click | Yes |
| Custom domains | Unlimited (Hobby) | Up to 100 / project |
| Upgrade path | Pro $20/user/month | Workers Paid $5/month |

---

## Summary

Vercel and Cloudflare Pages are both superb platforms, and for most projects the "wrong" choice still works fine. But the 2026 reality is:

- **Vercel** wins when your project is built with Next.js, needs rich serverless runtimes, or benefits from one-click A/B testing and the tightest framework integration. Its bandwidth cap (100 GB free) is the main thing to watch.
- **Cloudflare Pages** wins on raw reach and cost: unlimited bandwidth, 330+ edge locations, edge-executed Workers, a zero-egress storage stack (R2 + D1), and a free security layer that Vercel charges for. It's the default choice for content-heavy sites and anyone who wants to run a backend without ever fearing a bandwidth bill.

My rule of thumb: **static and content-heavy → Cloudflare Pages. Next.js and React → Vercel.** Everything else is gravy.

If you're self-hosting instead, our guide on [self-hosted open source apps](/en/articles/self-host-apps) and the [Docker Compose tutorial](/en/articles/docker-compose-tutorial) are good places to start. And if you're already on Cloudflare, don't miss our [R2 storage guide](/en/articles/cloudflare-r2-storage) to get zero-egress object storage running today.
