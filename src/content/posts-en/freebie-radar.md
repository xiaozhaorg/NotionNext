---
title: "Freebie Radar: 8,000 Deals on One Page, With the Resellers Kicked Out"
pubDatetime: "2026-11-27T00:00:00.000Z"
description: "Hunting for free credits, promo codes, and trial access used to mean digging through a dozen forums and Telegram groups — only to land on someone's 'selling a VPS' post. I pulled those sources into one page and added block rules plus an AI second pass. Here's how to use it, how it keeps resellers out, and the trap I avoided."
author: "Xiaozha"
tags: ["Tool", "Open Source", "Productivity"]
draft: false
ogImage: "/images/freebie-radar-en-real.webp"
coverAlt: "Freebie Radar page with category tabs, a search box, and promo code cards"
zhSlug: "freebie-radar"
---

Hunting for freebies gets old fast.

You want a free AI credit or a cloud provider's promo code. You open your bookmarks, flip through two pages of Nodeseek, search LinuxDO, check V2EX, then scroll back through a Telegram group. The information is scattered everywhere.

And then, after all that digging, you land on "【出】 cheap VPS, take it" or "looking to buy a ChatGPT seat." That's not a freebie. That's someone's secondhand sales post.

I pulled those sources into a single page and did two things: **gather the deals in one place, and keep the resellers out.**

## Two entrances, pick either

- "Freebie Radar" in this blog's navigation: [/radar/](https://xiaozha.org/en/radar/)
- Standalone site: [radar.xiaozha.org](https://radar.xiaozha.org/)

Same data on both. The standalone site has the native admin panel; the blog version is a reading page styled to match the rest of the site. If you just want to browse deals, the blog page looks better. If you want stats or want to change rules, use the standalone site.

## Three things you can use right away

**Category tabs.** A row of buttons at the top: AI, Games, VPS, Cloud Storage, Software, Domains, Hardware — 26 categories in total. Click "AI" and you only see AI deals instead of hunting through giveaway posts. The number after each label is how many items that category currently has.

**Search box.** Type `promo code`, `Netflix`, or `student` and it searches titles, summaries, and tags together. It waits until you stop typing instead of firing a request on every keystroke.

**The cards themselves.** Each item shows its source, date, and price tag; free items get a green "Free" badge; when there's a promo code, it's printed right under the card so you don't have to open the original post to find it.

It loads 24 items at a time — click "Load more" for the next batch. The build saves a snapshot, and the page replaces it with live data on load, so even if the API is down you won't stare at an empty page.

## Where the data comes from

Under the hood is the open-source [freebie-radar](https://github.com/ZiChuanLan/freebie-radar) project, around 2,900 stars at the time of writing. Its collectors watch 100+ sources and run every 30 minutes, pulling deals out of forums, communities, and vendor pages.

Collecting is only step one. Then come three filters:

1. **Deduplication and cleanup**: if several sources carry the same deal, only one survives; garbage characters and tracking parameters get stripped.
2. **Hard block rules**: anything matching a rule is never displayed.
3. **AI second pass**: decides whether it's a real deal, whether it's expired, and whether it's just an ad in disguise.

There are over 8,000 items in the database now. More than 2,600 have been judged by AI, with over 600 rejected as noise.

## How the reseller posts get blocked

This is the part I worked on most recently.

The dumb-but-effective approach first: **block rules**. There are 45 rules, in keyword and regex modes. Beyond the obvious words like "selling," "transfer," and "resell," it also catches a batch of variants:

- Tag style: `【出】`, `【收】`, `[出]`, `[收]` (Chinese "selling" / "buying" tags)
- Opening style: "buying one…", "selling a…", "收U", "pre-sale"
- Phrase style: "reselling at markup," "remaining value sale," "push included," "device swap," "收机", "收鸡"

Matching items are excluded at the database query stage, so the front end never even loads them. New items collected from now on get the same treatment.

But block rules have a built-in weakness: they only match literal text. Change the wording and they miss. "70r 出" — a sale for 70 yuan — is one example; you can't write a rule for every possible number, and if you try, you'll start killing legitimate news about discounts.

So there's a second layer: **AI supplementary review rules**.

I wrote a long set of judging instructions in the admin panel. The core boils down to two sentences:

> Person-to-person sales of accounts, VPS instances, domains, subscriptions, seats, or gift cards are always noise.
> Official vendor promotions, free giveaways, and all-time-low discounts are not sales posts — keep them.

The second sentence matters more. Say only "reject sales posts" and the AI starts treating "this cloud provider is 50% off today" as a sales post too. With the boundary spelled out, spot checks show it correctly separates "selling a raksmart VPS, personal transfer" from "official limited-time discount."

New items go through AI review automatically. I also re-ran 500 older items to check the rules were pointing in the right direction.

## The "original post deleted" problem — what I didn't do

You might think: just request each original URL and delete anything that returns 404.

I tested it. It doesn't work.

Nodeseek links return 403 across the board; plenty of LinuxDO links return 429, and what you get is a Cloudflare "Just a moment..." challenge page. The status code your script sees tells you nothing about whether the post was actually deleted. Bulk-deleting on HTTP status would wipe out a huge number of perfectly good items.

So I took the safer route: have the AI look for content clues during review — "original post deleted," "content no longer exists," "topic not found," "link expired" — and mark those as noise. At the same time, news articles merely *discussing* whether something will be deleted are explicitly excluded, to avoid false positives.

It won't leave the database perfectly clean. But it won't kill good items either.

## Where it stops

- **It's an aggregator, not a guarantee.** Promo codes expire, free quotas run out. Still open the original post and check.
- **Some deals are region- or new-user-only.** A "Free" badge means the source marked it free at collection time, not that you can claim it.
- **Filtering misses things and sometimes gets them wrong.** Forty-five rules plus AI review catch the vast majority of reseller posts, but zero leakage isn't promised. If you spot one, add a rule in the standalone admin panel — no code changes needed.

## One last thing

It runs on my own server, so when a source dies, a rule needs changing, or the AI gets something wrong, I can fix it myself. The upstream project also supports Telegram push notifications — I left that off, because 8,000+ items a day would bury your phone.

If you want to build your own, start with the official repo's deployment docs. If you just want the freebies, the blog page is enough.

---

**References**

- [freebie-radar official repo](https://github.com/ZiChuanLan/freebie-radar)
- [Freebie Radar page on this blog](https://xiaozha.org/en/radar/)
- [Standalone site](https://radar.xiaozha.org/)
