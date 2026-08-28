---
title: "Blog Migrated to Astro + Cloudflare Pages"
pubDatetime: "2026-05-09T10:53:56.073Z"
description: "Goodbye NotionNext — this blog has been rebuilt on Astro and deployed to Cloudflare Pages. This is the first post after the migration."
author: "Xiaozha"
tags: ["Announcement", "Blogging"]
featured: true
ogImage: "/images/hello-astro-real.jpg"
coverAlt: "Blog writing scene on a MacBook laptop with a coffee cup beside it"
zhSlug: "hello-astro"
---

## Why I Migrated

This blog used to run on NotionNext (Next.js + Notion CMS). It was feature-rich, but it came with a few problems:

- **Heavy dependence on Notion**: content lived on a third-party service, so any API changes or rate limiting from Notion could affect access.
- **Configuration explosion**: 19 config files made it a pain to maintain.
- **Optimized for Vercel**: moving it to Cloudflare meant running into quite a few pitfalls.
- **Too heavy**: the full Next.js runtime is overkill for a personal blog.

## The New Tech Stack

After the migration, I switched to a cleaner, purely static setup:

| Layer | Technology |
|---|---|
| Framework | Astro (zero-JS-first) |
| Styling | Tailwind CSS |
| Content | Markdown files + Git |
| Search | Pagefind (coming soon) |
| Comments | Giscus (powered by GitHub Discussions) |
| Analytics | 51la + Cloudflare Web Analytics |
| Deployment | Cloudflare Pages |

## Article URLs Stay the Same

To protect existing SEO, every article URL still keeps the `/article/[slug]` structure, so no old links need a 301 redirect.

## What's Next

- Gradually migrate historical articles
- Add Pagefind full-text search
- Finish configuring Giscus comments
- Recreate the visual details of the heo theme

This is a new beginning.
