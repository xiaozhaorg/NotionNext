---
title: "Getting AI to Cite Your Website: llms.txt and GEO in Practice"
pubDatetime: "2026-10-25T00:00:00.000Z"
description: "More people now ask ChatGPT, DeepSeek, or Perplexity first instead of searching. This is how a personal blog gets cited by AI: the two kinds of AI crawlers in robots.txt, how to write llms.txt, generating llms-full.txt, per-platform source preferences, and a real audit of this site."
author: 小吒
tags:
  - Tutorial
  - Blogging
  - Free Tools
draft: false
ogImage: "/images/geo-llms-txt-real.jpg"
coverAlt: "A humanoid robot sitting on a wooden bench by a window, reading a tablet in its hands"
zhSlug: "geo-llms-txt"
---

When people hit a problem these days, the first move is increasingly not opening Google. It is asking ChatGPT, DeepSeek, or Perplexity.

That creates a new problem for personal blogs. Traditional SEO is about ranking in a list of search results. Being cited inside an AI answer follows a different logic. Your post can rank first on Google and still never get quoted by an AI — because the crawler never read your site, or read it and still could not tell what the site is about.

This article is about getting a personal blog cited. Not an agency pitch for GEO services — it is the actual configuration and audit of my own site, xiaozha.org. There is a full checklist at the end.

## First, a clarification: GEO is not "new SEO"

GEO (Generative Engine Optimization) got heavily marketed in 2026, with vendors talking about "occupying the AI answer slot" and "building GEO moats."

Strip the jargon and it is three things: **let the AI crawler in, let the AI understand you, and give it a reason to cite you.**

The first two are pure configuration — an hour of work. The third depends on content quality, and there is no shortcut. This article only covers the first two. They are an amplifier: they multiply good content but cannot fix bad content. If your posts carry no new information, llms.txt will not save them.

## Step one: two traps hiding in robots.txt

Most sites ship `User-agent: * / Allow: /` and call it done. That misses the distinction that matters in the AI era.

### Trap one: treating all AI crawlers as the same thing

AI crawlers play two entirely different roles:

| Role | What it does | Examples |
|---|---|---|
| **Search citation crawlers** | Fetch pages in real time when an AI answers a question, and become the cited source | `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot` |
| **Training crawlers** | Scrape content for model training; irrelevant to whether you get cited | `GPTBot`, `ClaudeBot`, `Google-Extended`, `Bytespider` |

The key fact: **blocking training crawlers does not stop AI search from citing you.**

Plenty of site owners, worried about their content training someone's model, ban `GPTBot` and `ClaudeBot` outright. That is a legitimate choice — but understand what it does and does not do. Banning `GPTBot` does not hide your site from ChatGPT search, as long as `OAI-SearchBot` is allowed. Ban both, and your site vanishes from AI answers entirely.

### Trap two: `User-agent: *` does not reliably cover everything

Some AI crawlers ignore wildcard rules, or apply them with different precedence. Explicit declarations are safer. Here is what this site now uses:

```text
# AI search citation crawlers: allow. This is the prerequisite for being cited.
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# AI training crawlers: optional. Blocking these does not affect citation.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```

Three practical notes:

1. **Always allow citation crawlers.** If you object to your blog being used for training, block the training crawlers only. Allowing citation crawlers costs nothing — they only fetch when your content is about to be cited.
2. **Do not forget the Chinese AI entry points.** DeepSeek, Kimi, and Doubao have no standardized public UA spec. `Bytespider` (ByteDance) is one of the few that is documented. For a Chinese-language site, keep domestic crawlers allowed by default and occupy the entry point early.
3. **Keep the `Sitemap:` directive.** Add `Sitemap: https://yourdomain.com/sitemap.xml` at the end of robots.txt instead of relying on crawlers to discover it.

## Step two: llms.txt is a site briefing for AI

sitemap.xml is a phone book — a list of every URL. llms.txt is a welcome manual — a structured statement of what the site is, which content matters most, and what to read first.

The spec lives at [llmstxt.org](https://llmstxt.org/). The format is Markdown: machine-readable, but still legible to humans. The structure is minimal:

```markdown
# Your Site Name

> One sentence on what this site does and what its core content is.

## Site Info

- URL: https://example.com
- Language: English
- Author: Your Name

## Key Pages

- Home: https://example.com/
- Tag index: https://example.com/tags/
- About: https://example.com/about/

## Featured Content (index first)

- A core article: https://example.com/article/xxx
- Another core article: https://example.com/article/yyy
```

Four rules of writing it. Most people break the first one immediately:

**List high-value pages only. Never dump the whole site.** llms.txt is not a second sitemap. Dumping every URL blurs the priorities and dilutes the weight. My rule of thumb: the top 5% of content, plus navigation pages.

**Link order is the weight ranking.** AI leans on earlier links first. Put the article you most want cited at the top.

**Descriptions must match the actual pages.** This is where GEO agencies slip most — llms.txt claims industry leadership while the homepage is empty boilerplate. When AI cross-checks and finds the claims inconsistent, credibility drops. Plain and accurate beats inflated every time.

**No marketing copy.** Promotions, limited-time offers, and funnel language stay out. The file's credibility rests on being a set of objective facts.

### This site's llms.txt

Below is the live configuration, usable as a template for a personal blog:

```markdown
# llms.txt — Xiaozha Blog

> Site discovery file for AI search engines and crawlers
> Follows https://llmstxt.org/

## Site Info

- **Name**: Xiaozha Blog
- **Language**: Chinese primary, partial English translations
- **URL**: https://xiaozha.org
- **Description**: A personal tech blog covering AI tools, cloud services, self-hosting, and open-source applications.
- **Author**: Xiaozha (@xiaozhaorg)
- **RSS**: https://xiaozha.org/rss.xml
- **Sitemap**: https://xiaozha.org/sitemap.xml

## Main Topics

1. **AI tools and LLMs**: reviews, AI coding assistants, API relays, local deployment
2. **Cloudflare ecosystem**: Pages / Workers / R2 / Tunnel / Speed walkthroughs
3. **Self-hosted apps**: Jellyfin, Immich, n8n, Mealie, Vaultwarden
4. **Open-source dev tools**: Git, Docker, VS Code/Cursor/Zed
5. **Free resources**: domain deals, GitHub Student Pack, free API quotas

## Key Pages

- Home: https://xiaozha.org/
- English home: https://xiaozha.org/en/
- All tags: https://xiaozha.org/tags/
- Archive: https://xiaozha.org/archive/
- About: https://xiaozha.org/about/

## Featured Posts (index first)

- Cloudflare China acceleration: https://xiaozha.org/article/cloudflare-ip-optimization
- Ollama local LLM deployment: https://xiaozha.org/article/ollama-local-llm
- Vaultwarden self-hosted password manager: https://xiaozha.org/article/bitwarden-self-host
- Cloudflare Tunnel free intranet access: https://xiaozha.org/article/cloudflare-tunnel-tutorial
- Cline walkthrough: https://xiaozha.org/article/cline-tutorial
- DeepSeek V4 coding benchmark: https://xiaozha.org/article/deepseek-v4-coding
```

Deployment: static sites drop it in `public/llms.txt`, WordPress puts it in the web root, and `yourdomain.com/llms.txt` should load.

## Step three: llms-full.txt, the full-text version for long-context models

llms.txt is a briefing with links only. The companion `llms-full.txt` merges the **full text** of your core pages into one file, so long-context models (Gemini 1M, Claude 200K) can read everything in a single pass.

It fits documentation, tutorial, and mid-sized content sites. If you have a body of well-structured articles, it is worth building. A corporate site with a dozen marketing pages gains nothing.

Generate it with a script rather than by hand — pull from your sitemap or content directory. For Astro, something like this (Node, run after build):

```javascript
import fs from "node:fs";
import path from "node:path";

const SITE = "https://xiaozha.org";
const POSTS_DIR = "src/content/posts";
const OUT = "public/llms-full.txt";

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const entries = files.map((f) => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8").replace(/\r\n/g, "\n");
  const fm = raw.split("---")[1] || "";
  const title = (/^title:\s*"?([^"\n]+)/m.exec(fm) || [])[1] || f;
  const slug = f.replace(/\.md$/, "");
  const body = raw.replace(/^---[\s\S]*?---/, "").trim();
  return { title, slug, url: `${SITE}/article/${slug}/`, w: body.length, body };
});

// Longest 20 posts first; keep the file bounded
entries.sort((a, b) => b.w - a.w);
const picked = entries.slice(0, 20);

const lines = [
  `# ${SITE} — Full Content`,
  "",
  "> Full text of this site's core articles for one-shot AI ingestion.",
  "",
];
for (const e of picked) {
  lines.push(`## ${e.title}`, `URL: ${e.url}`, "", e.body, "", "---", "");
}

fs.writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`llms-full.txt generated with ${picked.length} posts`);
```

Two caveats:

- **The full file gets large.** Keep it inside what a model can read in one pass — a few dozen articles is a sensible ceiling. Stuffing all 145 posts in means even Gemini truncates it.
- **Regenerate after content updates.** A stale full-text file is worse than none: the AI quotes your three-month-old position.

## Step four: source preferences differ wildly by platform

This is the layer most people miss. The same site has very different citation odds in ChatGPT versus Perplexity, because their retrieval systems sit on different underlying data:

| AI platform | Retrieval / source profile | What you should do |
|---|---|---|
| **ChatGPT** | Retrieval is independent of Google, largely relying on Bing's index | Required: submit the site in Bing Webmaster Tools |
| **Perplexity** | Roughly 40%+ of citations come from Reddit-style community discussion | Participate genuinely in relevant communities — not by dropping links |
| **Claude** | Cites the brand's own site more than any other source | Make the site itself solid and well-structured |
| **Google AI Overviews** | Weights cross-confirmed multi-source content (YouTube, Reddit, LinkedIn) | Sites with video content have an edge |
| **DeepSeek / Kimi / Doubao** | Domestic entry points, mostly public web pages | Ensure domestic crawlers can reach your pages |

The single most actionable item for a personal blog: **submit the site in Bing Webmaster Tools.** Five minutes of work, but ChatGPT's citation base is Bing. Plenty of people have Google Search Console fully configured and nothing in Bing.

## Schema structured data: you may already have half

If you run Astro, Next.js, or WordPress with an SEO plugin, `BlogPosting` and `WebSite` schemas are probably already there. This site's Layout ships JSON-LD for both.

Two types worth adding for the AI era:

**BreadcrumbList** — lets AI understand page hierarchy. The path "Home > Tutorial > Some post" helps AI judge how much depth your site has on a topic.

**FAQPage** — if the Q&A at the end of a tutorial is marked up, AI is far likelier to lift it as answer material. Google restricted FAQ rich results in 2023, but the Schema data itself still helps AI parse the content.

Verify with Google's [Rich Results Test](https://search.google.com/test/rich-results): paste a URL, and if the types resolve, you are fine.

## The real audit of this site

While writing this, I ran the checks against my own site and found two actual gaps:

**Gap one: robots.txt had no AI crawler rules at all.** The original file only covered traditional engines and Baidu optimizations — `OAI-SearchBot` and `Claude-SearchBot` were nowhere to be found. Fixed with the template above.

**Gap two: no llms-full.txt.** llms.txt existed, but the full-text version did not, so long-context models only ever got a list of links. Added the generator script.

Both gaps are typical. Most personal blogs stall exactly here. The configuration itself is half an hour of work, but nobody tells you it needs doing.

## Verification checklist

```bash
# 1. llms.txt resolves with 200
curl -sI https://yourdomain.com/llms.txt | head -1

# 2. llms-full.txt resolves
curl -sI https://yourdomain.com/llms-full.txt | head -1

# 3. AI crawler rules are live
curl -s https://yourdomain.com/robots.txt

# 4. Sitemap resolves, and lastmod is honest
curl -s https://yourdomain.com/sitemap.xml | grep lastmod | head -3
```

Then run the "AI perspective" test: open ChatGPT or Perplexity and ask how it knows about your site, or ask a question your content answers completely, and see whether you get cited. No mention means GEO has not started. A citation means the configuration is beginning to work.

## Expectation management: infrastructure, not a switch

One honest note so you are not disappointed after configuring:

llms.txt and robots.txt have a **recognition cycle of roughly 2-4 weeks** — AI crawlers run their own schedules, so nothing happens the day after you deploy. Stable semantic weight takes one to two months, improving gradually as models iterate.

Nor is it a rescue. The underlying logic of AI citation is "your content is more credible after cross-source verification." llms.txt only makes it easier for AI to find and read you as a source. Weak content stays weak no matter how it is configured; strong content gets the best return from this one hour of work.

---

**Related reading**: this extends the site's SEO series — see [Astro bilingual site SEO pitfalls](/en/article/astro-seo-pitfalls/) for traditional search optimization. To run the site itself on a free tier, see [building a navigation site on Cloudflare Pages](/en/article/cloudflare-navigation-site/), and for acceleration in China, [Cloudflare China acceleration](/en/article/cloudflare-ip-optimization/).
