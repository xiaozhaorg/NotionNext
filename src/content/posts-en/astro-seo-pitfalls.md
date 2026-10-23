---
title: "Astro Bilingual Site SEO: 5 Pitfalls You Only Catch With a Full Audit"
pubDatetime: "2026-10-23T00:00:00.000Z"
description: "Five SEO pitfalls I hit after migrating this blog from NotionNext to Astro 7 — hreflang trailing slashes, tag pages pointing at 404s, a noindex URL inside the sitemap, and a CRLF line ending that silently broke frontmatter parsing. Each with symptom, root cause, and fix."
author: "Xiaozha"
tags: ["Tutorial", "Blogging", "Development Tools"]
draft: false
ogImage: "/images/astro-seo-pitfalls-real.jpg"
coverAlt: "A MacBook screen filled with dense syntax-highlighted code"
zhSlug: "astro-seo-pitfalls"
---

This blog used to run on NotionNext. This year I rebuilt it on Astro 7. After the rebuild everything worked: `astro check` clean, 259 pages built, no errors anywhere.

Then I ran a full audit — pulling every hreflang link, every sitemap entry, and every noindex page out of the build output and reconciling them against each other. **It found 60 dead links and a pile of indexing problems.**

This post covers the five worst, roughly in order of severity. The point is not "how to configure Astro" — it is **why these slipped past normal checks**.

## Pitfall 1: hreflang trailing slashes, 137 pages affected

### Symptom

A Chinese article page declared its English counterpart like this:

```html
<link rel="alternate" hreflang="en" href="https://xiaozha.org/en/article/gemma-4-local-deploy">
```

No trailing slash. Meanwhile the same page's canonical:

```html
<link rel="canonical" href="https://xiaozha.org/article/gemma-4-local-deploy/">
```

With one.

Requesting the slash-less URL returns a **308 permanent redirect** to the slashed version.

### Root cause

Under `build.format: "directory"`, every URL Astro generates ends with a slash. But the article page passed a hand-built `altURL`:

```astro
altURL={post.data.enSlug ? `/en/article/${post.data.enSlug}` : null}
```

Missing one `/`. The reverse direction had the same bug, so English pages pointed at un-slashed Chinese URLs. All 137 article pages, both directions.

### Why it is hard to catch

Google requires hreflang targets to be canonical URLs with no redirects. An hreflang pointing at a 308 is simply discarded — **and nothing reports an error**. Search Console shows "Alternate page with proper canonical tag", which looks like a healthy state. Pages open fine, share cards render fine, nothing looks wrong.

### Fix

```astro
altURL={post.data.enSlug ? `/en/article/${post.data.enSlug}/` : null}
```

One character. But knowing to add it requires running the audit first.

## Pitfall 2: tag pages declaring hreflang to a 404

### Symptom

The Chinese tag page `/tags/教程/` declared in its head:

```html
<link rel="alternate" hreflang="en" href="https://xiaozha.org/en/tags/教程/">
```

Requesting it: **HTTP 404**.

### Root cause

Layout had a `getAltURL()` that did a pure path-prefix swap:

```ts
// /xxx → /en/xxx
if (targetLocale === "en") {
  return `/en${pathname}`;
}
```

For `/about/`, `/archive/`, `/tags/` this is exactly right, because those paths exist in both languages.

Tag detail pages are different. **The Chinese tag is 「教程」; the English tag is `Tutorial`.** The prefix swap produces `/en/tags/教程/`, which does not exist. All 20 Chinese tag pages were declaring a dead link.

### Why it is hard to catch

Same category as pitfall 1: no error, just silently ignored. And it only breaks on tag detail pages — the `/tags/` aggregate page is correct, so a spot check can easily land on the one that works.

### Fix

Handle the two cases separately. Keep the cross-link on aggregate pages; on tag detail pages, do not declare an alternate at all:

```astro
const altURL = tag ? null : "/en/tags/";
```

`altURL={null}` makes Layout skip that hreflang direction entirely. **Not declaring an alternate when no counterpart exists** is explicitly endorsed by Google, and strictly better than declaring a broken one.

## Pitfall 3: a 404 page inside the sitemap

### Symptom

`sitemap-0.xml` contained:

```xml
<loc>https://xiaozha.org/en/404/</loc>
```

A `noindex,follow` error page, submitted to search engines as an indexable URL.

### Root cause

`src/pages/404.astro` sits at the root, so Astro treats it as the site 404 page and the sitemap integration excludes it automatically.

But `src/pages/en/404.astro` is a **nested route**, not at the root, so it is not excluded. Result: the English 404 page made it into the sitemap while the Chinese one did not — an asymmetry that is easy to miss at a glance.

### Why it is hard to catch

The sitemap had 258 URLs and nobody reads them one by one. The 404 page itself works perfectly — visiting a bad URL does return the 404 page. The problem exists only in "you told the search engine to index a page it should not", which surfaces as `Sitemap contains a URL marked "noindex"` in Search Console. You only find out if you look.

### Fix

```ts
sitemap({
  filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
  // ...
})
```

Note that **`includes("404")` would be wrong** — it would also drop `/article/bt-panel-404/`, a legitimate post. The pattern has to be anchored to the end of the path.

## Pitfall 4: noindex and sitemap must move in lockstep

### Symptom

After fixing pitfall 3, I went further and added `noindex` to tag pages carrying only one post. The site had 94 English tag pages, 66 of which held a single article — thin content taking up 44% of all sitemap entries.

I set the page meta correctly. But I **did not update the sitemap to match**.

### Root cause

This was my own blind spot. I assumed `noindex` was the page's business and the sitemap was indexing's business, and that the two were independent.

They are not. **A noindex URL appearing in the sitemap is itself a Search Console error.** I had just fixed pitfall 3 and immediately created a new instance of it.

### Fix

Both sides have to change together:

```astro
// page side
const thin = tag ? filtered.length < 2 : false;
<Layout noindex={thin} ...>
```

```ts
// sitemap side, using the same criterion
filter: (page) => {
  const p = new URL(page).pathname;
  if (/\/404\/?$/.test(p)) return false;
  const m = /^(\/en)?\/tags\/(.+)\/$/.exec(p);
  if (m && (tagCounts.get(`${m[1] ?? ""}/tags/${m[2]}`) ?? 0) < 2) return false;
  return true;
}
```

There is an implementation wrinkle: the sitemap `filter` only receives a URL string, with no access to content collections. So `astro.config.ts` has to read `src/content` itself, count posts per tag, and build a lookup table.

The result:

| Metric | Before | After |
|---|---|---|
| Total sitemap URLs | 257 | 191 |
| Of which tag pages | 114 | 46 |
| Noindex URLs in sitemap | several | **0** |
| Entries with `lastmod` | 0 | 137 |

While I was in there I added `lastmod` as well. The content schema had a `modDatetime` field all along that had never been wired into the sitemap — a wasted freshness signal.

## Pitfall 5: CRLF line endings silently broke frontmatter parsing

This one is the nastiest, so it goes last.

### Symptom

After fixing pitfall 4, the numbers did not reconcile:

- 111 tag detail pages: 65 noindex, 46 indexable
- 46 tag URLs in the sitemap — **looked exactly right**

Yet two pages were missing:

```
/tags/Docker/         ← page says index,follow, but absent from the sitemap
/tags/资源分享/        ← same
```

The page said "I am indexable"; the sitemap said "I am excluded". Contradiction.

### Root cause

I had hand-written frontmatter parsing in `astro.config.ts` to count posts per tag:

```ts
function frontmatterOf(file: string): string {
  return fs.readFileSync(file, "utf8").split("---")[1] ?? "";
}

function tagsIn(fm: string): string[] {
  const block = /^tags:\n((?:[ \t]*-[ \t]*.+\n?)+)/m.exec(fm);
  // ...
}
```

The regex expects `\n`. The markdown files use **CRLF** (`\r\n`).

So `^tags:\n` matched nothing — after `tags:` comes `\r`, not `\n`. **The entire tag count silently returned empty.** No error, just a quiet undercount.

Actual impact:

| Tag | I counted | Reality |
|---|---|---|
| Docker | 1 post | 2 posts |
| 资源分享 | 1 post | 4 posts |

Undercounting meant `Docker` was classified as thin (<2 posts) and dropped from the sitemap. `资源分享` too. Two pages that should have been indexed were taken offline.

### Why this is the hardest to catch

It is the only pure logic bug of the five; the others were configuration oversights. Its signature:

1. **No error** — a failed regex match just returns null and execution continues
2. **Plausible output** — fewer tags than reality, but still a batch of numbers
3. **Only a full reconciliation exposes it** — spot-check `/tags/AI/` (an LF file, by luck) and everything looks fine; spot-check `/tags/Docker/` (CRLF) and the problem appears

My first verification script had its own bug too: I wrote the page-classification regex as `/\/tags\/[^/]+\/$/`, which missed every Chinese tag page because a relative path like `tags/Docker/` has no leading slash. For a while that made me think the problem was English-only.

### Fix

One line:

```ts
function frontmatterOf(file: string): string {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("---")[1] ?? "";
}
```

**When hand-parsing frontmatter, normalize line endings first. Always.** The right answer is a mature library like `gray-matter`; I wrote my own to avoid a dependency and paid for it with double the debugging time.

## An environment pitfall worth noting

After upgrading to Astro 7.4.2 the build failed outright:

```
Node.js v22.22.2 is not supported by Astro!
Please upgrade Node.js to a supported version: ">=22.23.4"
```

Astro 7.4.x raised `engines.node` to 22.23.4 while the machine default was 22.22.2. Cases like this have a clear error message; the hard part is **not thinking to check Node at all** — it is only a patch release.

The fix was a `scripts/astro.mjs` wrapper: check `process.version`, and if it falls short, respawn through another Node on the machine (`D:\Tools\Node`, v24). Every astro-related npm script goes through it.

## Why sampling always misses

All five pitfalls share one property: **none of them affect page rendering.** Pages open, navigation works, search works, `astro check` is clean, all 259 pages build.

The only thing that catches them is full reconciliation:

```js
// Walk the build output, compare every hreflang link against the real page set
for (const p of pages) {
  const h = fs.readFileSync(p, "utf8");
  for (const m of h.matchAll(/<link rel="alternate" hreflang="[^"]+" href=".../g)) {
    if (!exists.has(m[1])) bad++;
  }
}
```

One line of output at the end: `hreflang dead links 60 → 0`. That beats any amount of "looks fine".

Three mistakes I made in the verification script itself, all of which cost real time:

1. **Normalize before comparing URLs to filesystem paths.** Tag names with spaces (`AI Coding`) produce directories with literal spaces but hreflang values with `%20`; a naive string comparison reported 58 phantom dead links. Apply `decodeURIComponent` / `encodeURI` on both sides.
2. **Page-classification regexes must handle relative paths.** `/tags/xxx/` fails to match `tags/xxx/` (no leading slash), which made every Chinese tag page invisible to the counter.
3. **Do not probe proxy availability with `curl -x`** — it returns 000 as if the connection succeeded when it did not. Use `(echo > /dev/tcp/127.0.0.1/6046)` for a real TCP check.

## Closing

The most dangerous mindset on a migration project is "the build passed, so we are done." A build only verifies **that pages can be generated**. It does not verify **that the relationships between pages are correct** — and SEO lives entirely in those relationships: what canonical points at, what hreflang cross-references, what the sitemap lists, what noindex excludes.

Half an hour writing a reconciliation script is far cheaper than months of fishing errors out of Search Console.
