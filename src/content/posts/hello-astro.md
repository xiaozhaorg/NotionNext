---
title: 博客已迁移到 Astro + Cloudflare Pages
pubDatetime: "2026-05-09T10:53:56.073Z"
description: 告别 NotionNext，博客已基于 Astro 重建并部署到 Cloudflare Pages。这是迁移后的第一篇文章。
author: 小吒
tags:
  - "公告"
  - "建站"
featured: true
ogImage: "/images/hello-astro-real.jpg"
coverAlt: "MacBook 笔记本上的博客写作场景，旁边放有咖啡杯"
enSlug: "hello-astro"
---

## 为什么要迁移

之前博客基于 NotionNext（Next.js + Notion CMS）搭建，虽然功能丰富，但存在几个问题：

- **强依赖 Notion**：

内容存在第三方，Notion 改 API 或限流会影响访问
- **配置爆炸**：19 份配置文件，维护成本高
- **为 Vercel 优化**：

迁到 Cloudflare 要踩不少坑
- **偏重**：

Next.js 全套运行时对个人博客来说过重

## 新的技术栈

迁移后采用更纯粹的静态站点方案：

| 层 | 技术 |
|---|---|
| 框架 | Astro（零 JS 优先） |
| 样式 | Tailwind CSS |
| 内容 | Markdown 文件 + Git |
| 搜索 | Pagefind（即将接入） |
| 评论 | Giscus（基于 GitHub Discussions） |
| 统计 | 51la + Cloudflare Web Analytics |
| 部署 | Cloudflare Pages |

## 文章 URL 保持不变

为了不影响 SEO，所有文章 URL 仍然保持 `/article/[slug]` 的结构，旧链接无需 301。

## 接下来

- 逐步迁移历史文章
- 接入 Pagefind 全文搜索
- 完善 Giscus 评论配置
- 复刻 heo 主题的视觉细节

这是一个新的开始。
