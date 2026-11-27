---
title: "Freebie Radar: 8,000 Deals on One Page"
pubDatetime: "2026-11-27T00:00:00.000Z"
description: "Hunting for free credits, promo codes, and trial access used to mean digging through a dozen forums and Telegram groups. Now they're all on one page: 26 categories, search, promo codes shown inline, refreshed every 30 minutes. Here's how to use it and what to check for yourself."
author: "Xiaozha"
tags: ["Tool", "Open Source", "Productivity"]
draft: false
ogImage: "/images/freebie-radar-en-real.webp"
coverAlt: "Freebie Radar page with category tabs, a search box, and promo code cards"
zhSlug: "freebie-radar"
---

Hunting for freebies gets old fast.

You want a free AI credit or a cloud provider's promo code. You open your bookmarks, flip through two pages of Nodeseek, search LinuxDO, check V2EX, then scroll back through a Telegram group. The information is scattered everywhere.

So I pulled those sources into a single page. Open it and scroll — no more jumping between sites.

## Two entrances, pick either

- "Freebie Radar" in this blog's navigation: [/radar/](https://xiaozha.org/en/radar/)
- Standalone site: [radar.xiaozha.org](https://radar.xiaozha.org/)

Same data on both. The blog page is styled to match the rest of the site, so it's easier to read; the standalone site is the original page.

## Three things you can use right away

**Category tabs.** A row of buttons at the top: AI, Games, VPS, Cloud Storage, Software, Domains, Hardware — 26 categories in total. Click "AI" and you only see AI deals instead of hunting through giveaway posts. The number after each label is how many items that category currently has.

**Search box.** Type `promo code`, `Netflix`, or `student` and it searches titles, summaries, and tags together. It waits until you stop typing instead of firing a request on every keystroke.

**The cards themselves.** Each item shows its source, date, and price tag; free items get a green "Free" badge; when there's a promo code, it's printed right under the card so you don't have to open the original post to find it.

It loads 24 items at a time — click "Load more" for the next batch. The build saves a snapshot, and the page replaces it with live data on load, so even if the API is down you won't stare at an empty page.

## Where the data comes from

Under the hood is the open-source [freebie-radar](https://github.com/ZiChuanLan/freebie-radar) project, around 2,900 stars at the time of writing. Its collectors watch 100+ sources and run every 30 minutes, pulling deals out of forums, communities, and vendor pages, then removing duplicates and garbage text and sorting everything into categories.

There are over 8,000 items in the database now.

## Where it stops

- **It's an aggregator, not a guarantee.** Promo codes expire, free quotas run out. Still open the original post and check.
- **Some deals are region- or new-user-only.** A "Free" badge means the source marked it free at collection time, not that you can claim it.
- **With this much information, some entries go stale.** The original post is the source of truth.

## One last thing

The upstream project also supports Telegram push notifications — I left that off, because 8,000+ items a day would bury your phone.

If you want to build your own, start with the official repo's deployment docs. If you just want the freebies, the blog page is enough.

---

**References**

- [freebie-radar official repo](https://github.com/ZiChuanLan/freebie-radar)
- [Freebie Radar page on this blog](https://xiaozha.org/en/radar/)
- [Standalone site](https://radar.xiaozha.org/)
