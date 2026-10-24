---
title: Vercel vs Cloudflare Pages：静态网站部署终极对比，2026 谁更胜一筹？
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 深入对比 Vercel 和 Cloudflare Pages 的部署体验、CDN 性能、免费额度、边缘函数、数据库生态与域名管理，附决策框架与并排对比表，帮你在 2026 年选对托管平台。
author: 小吒
tags:
  - 教程
  - 免费工具
  - Cloudflare
draft: false
sourceUrl: "https://xiaozha.org/article/vercel-vs-cloudflare"
ogImage: "/images/vercel-vs-cloudflare-real.jpg"
coverAlt: "云朵与服务器机房的云计算部署概念图"
enSlug: "vercel-vs-cloudflare"
---

最近几年部署过静态站的人，多半都纠结过同一个问题：**Vercel** 还是 **Cloudflare Pages**。两者个人项目都免费，都接 Git 仓库、推送即部署，都承诺全球边缘分发和自动 HTTPS。

2026 年到底该用哪个？老实说：**看项目**。Vercel 是 Next.js 和重 React 应用的天然归属；Cloudflare Pages 是带宽无限、由 Workers 驱动的劳力模范，内容型站点和流量突发的站点用它更香。

这篇按功能逐项拆开——部署体验、性能、价格、函数、数据库、域名——最后给一个明确的决策框架。

## 两者是什么

**Vercel** 是 Next.js 框架背后的公司。它提供完整的 Web 应用构建部署平台：静态站点、Serverless 函数、边缘函数、预览部署，以及一套丰富的一方集成（KV、Postgres、Blob、Analytics）。Hobby 套餐永久免费，慷慨到跑一个小副业项目不用花一分钱。

**Cloudflare Pages** 是 Cloudflare 的静态站点托管产品，构建在 Cloudflare Workers 运行时之上。它从"Cloudflare 版的 Netlify"起步，长成了完整的 JAMstack 平台：Pages Functions、直接打通整个 Workers 生态（D1、R2、KV、Durable Objects、Queues），以及一个近乎荒谬地友好的定价模式——**免费额度无限带宽**。

两者核心工作流一样：

1. 连接 Git 仓库（GitHub、GitLab 或 Bitbucket）
2. 选框架预设和构建命令
3. 推送 `main`，平台构建部署，给你一个 `*.vercel.app` 或 `*.pages.dev` 地址
4. 开 PR，得到带独立 URL 的隔离**预览部署**

## 部署体验

### Git 集成

两者都支持 GitHub / GitLab / Bitbucket，推送即触发生产部署，PR 触发预览部署。这一项打平。

**一个差异**：Vercel 对 Bitbucket 支持更好；Cloudflare Pages 曾经不支持 Bitbucket，后来加了。如果你在 Bitbucket 上，优先验证一下当前状态。

### 构建速度

Cloudflare Pages 通常更快——它用的构建机分布在全球多地，而且静态资源构建完直接进 CDN，没有额外分发步骤。

Vercel 的构建也不错，但对大型项目的冷启动有时偏慢。

实际感知：个人项目两者都是几十秒到一两分钟，差异不重要。**真正影响体感的是预览部署的生成速度**，这一项 Cloudflare Pages 通常快一截。

### 预览部署

两者都为每个 PR 生成独立 URL，这是现代部署的标配。

Vercel 的预览体验更完整：PR 评论里自动贴链接、可以和团队成员分享、支持用密码保护预览。

Cloudflare Pages 也有预览 URL，但集成深度稍逊——没有自动评论机器人。

## 性能：CDN 覆盖与 TTFB

### 网络规模

Cloudflare 的优势是**网络本身**。300+ 边缘节点，覆盖到很多小众地区。南美、非洲、中东的用户，Cloudflare 的延迟明显更低。

Vercel 的节点集中在欧美和亚太发达地区。对主流地区用户，两者都快到感知不出差别。

### TTFB（首字节时间）

对纯静态内容，两者都是 CDN 直出，TTFB 都在几十毫秒量级。

**差异在动态内容**：

- Vercel 的 Edge Functions 部署在 Vercel 自己的边缘网络上，对 Next.js 的 SSR/ISR 优化更深
- Cloudflare Workers 冷启动极快（接近 0ms，这是它架构优势），但和 Pages 的集成路径略长

结论：**纯静态站两者都够快；重 SSR 的应用，Vercel 对 Next.js 的调优更好。**

### 缓存与智能路由

Cloudflare 的缓存策略更激进也更可配（Cache Rules、Tiered Cache）。Vercel 的缓存对框架内容更智能（自动按 ISR 配置处理）。

这一项对普通用户无感，对高流量站点影响很大。

## 价格与免费额度

这是最多人关心的，也是差距最大的一项。

| | Vercel Hobby | Cloudflare Pages Free |
|---|---|---|
| 站点数量 | 无限 | 无限 |
| **带宽** | **100 GB/月** | **无限** |
| 构建 | 6000 分钟/月 | 500 次/月 |
| 并发构建 | 1 | 1 |
| 函数调用 | 100 万次 + 4h CPU | 10 万次/天 |
| 商业使用 | **禁止** | 允许 |
| 自定义域名 | 无限 | 无限 |

### 带宽这个故事

Cloudflare Pages 免费档**带宽无限**，这不是促销。缓存静态文件从边缘送出，对 Cloudflare 来说成本近乎零。

Vercel Hobby 有 100 GB/月 上限。个人博客通常够（一个月几十万 PV 也就几十 GB），但**流量一爆就超**——被 Hacker News 推到首页那天，可能就是你收到超额通知那天。

### 免费档什么时候会花钱

**Vercel 有两个隐性限制**：

1. **Hobby 禁止商业使用**。跑着 Stripe 收款的落地页、给公司用的官网，都算违规。查得松，但被 suspended 是没有预警的
2. 100 GB 带宽超了要升 Pro（$20/月）

**Cloudflare Pages 的限制**：

1. 每月 500 次构建。CI 每次 PR 都构建的话，活跃项目可能超
2. 单文件 25 MB 上限——要传大视频或 wasm 二进制，先撞这个
3. Workers 免费档 10ms CPU 时间，做不了重计算

**结论**：个人非商业项目，Cloudflare Pages 免费档更宽松；要商用或跑 Next.js，Vercel 的 Pro 是绕不开的成本。

## 函数与边缘计算

### Vercel Functions

Serverless Functions + Edge Functions 两套。Edge Functions 跑在 Vercel 边缘网络，基于 Next.js 的中间件模型，写起来顺手。

### Cloudflare Workers + Pages Functions

Pages Functions 就是 Workers 的简化封装，`functions/` 目录下的文件自动映射成路由。写法和 Workers 一致——`fetch(request, env, ctx)` 那个模型。

**性能上 Workers 冷启动更快**（接近 0ms，V8 isolate 架构），这是它和 Lambda 类方案的本质区别。

### 能力对比

| 能力 | Vercel | Cloudflare |
|---|---|---|
| 冷启动 | 快 | **极快（~0ms）** |
| 运行时 | Node.js / Edge | V8 isolate（JS/WASM/Rust） |
| 重定向/重写 | 内置 | `_redirects` / `_headers` |
| A/B 测试 | 内置 Edge Config | 需自己实现 |
| 定时任务 | Cron Jobs | Cron Triggers |
| WebSocket | 有限 | Durable Objects |

**Workers 的 Durable Objects 是个杀手级能力**——有状态、强一致、能协调。用它做协同编辑、实时协作、房间管理，Vercel 那边没有对等物。

## 数据库与存储生态

### Vercel 生态

一方产品齐全：Vercel KV（Redis 兼容）、Vercel Postgres（Neon 驱动）、Vercel Blob（文件存储）、Edge Config（配置分发）。

特点：**开箱即用，和平台深度整合**，但都是 Vercel 封装的，迁移出去要想一想。

### Cloudflare 生态

更大也更底层：D1（SQLite）、R2（对象存储，无出口费）、KV（最终一致键值）、Durable Objects（有状态）、Queues（消息队列）、Hyperdrive（连接池）。

特点：**选择更多、更接近原语**，且都能单独用（不绑定 Pages）。本站自己就跑在 Cloudflare Pages + R2 上，存储方案见《Cloudflare R2 对象存储完全指南》。

**生态选择建议**：要快速验证想法用 Vercel 一套；要长期可控、可能迁移，用 Cloudflare 的原语更稳。

## 域名与 HTTPS

两者都支持无限自定义域名、自动签证书、自动续期。打平。

**Cloudflare 的优势**：如果你的域名 DNS 本来就在 Cloudflare，Pages 绑定域名是一条龙的事，而且自动获得 Cloudflare 的 DDoS 防护和 WAF。这是"全家桶"的红利。

**Vercel 的优势**：域名可以在任何注册商，用 Vercel DNS 或外部 DNS 都行，不受生态绑定。

## 决策框架

### 选 Vercel 如果

- 主框架是 **Next.js**（官方最佳支持，没有第二家接近）
- 需要 SSR / ISR / 流式渲染
- 重视预览部署和团队协作体验
- 主要用户在欧美发达地区
- 不想碰底层配置，要平台包办

### 选 Cloudflare Pages 如果

- 追求**无限带宽**，担心流量突发
- 已经用 Cloudflare 的域名/DNS（无缝整合）
- 要用 Workers、R2、D1、Durable Objects
- 内容型站点：博客、文档、落地页
- **非商业项目想完全免费**（Vercel Hobby 禁止商用）
- 需要 Workers 那种 ~0ms 冷启动的边缘计算

### 两者都适合

- 个人博客、文档站、作品集
- 小型落地页
- 静态内容为主的营销页

## 并排对比总表

| 维度 | Vercel | Cloudflare Pages |
|---|---|---|
| 背后公司 | Vercel（Next.js） | Cloudflare |
| 免费带宽 | 100 GB/月 | **无限** |
| 免费构建 | 6000 分钟/月 | 500 次/月 |
| 商业使用 | Hobby 禁止 | 允许 |
| 单文件上限 | 无明确限制 | 25 MB |
| Git 平台 | GitHub/GitLab/Bitbucket | GitHub/GitLab/Bitbucket |
| 框架优化 | **Next.js 最佳** | 通用，Astro/Hugo 都顺手 |
| 边缘函数 | Edge Functions | Workers（冷启动更快） |
| 函数免费额度 | 100 万次/月 | 10 万次/天 |
| 数据库 | KV / Postgres / Blob | D1 / R2 / KV / DO / Queues |
| 有状态原语 | 无 | **Durable Objects** |
| CDN 覆盖 | 欧美亚太为主 | **300+ 节点，覆盖更广** |
| 分析 | Vercel Analytics（详细） | Web Analytics（隐私友好） |
| 域名要求 | 无 | 无（但 DNS 在 CF 更顺） |
| 自托管替代 | 无 | 无（价值在边缘网络） |

## 小结

2026 年两者的差距在缩小，但**核心分野没变**：

- **Vercel 赢在与 React/Next.js 的深度整合和开发体验**，代价是免费档的带宽和商用限制
- **Cloudflare Pages 赢在全球 CDN 性能和免费额度**，代价是生态更底层、要自己多配一点

个人博客和静态站，两者都是好选择。**如果已经用 Cloudflare 管域名，直接选 Pages**——一条龙整合的顺畅感值得那点配置成本。

如果还在纠结，一个简单的判断：**你的站主要给人看内容，还是给人用功能？** 看内容选 Cloudflare Pages，用功能（尤其 Next.js）选 Vercel。

本站用的就是 Cloudflare Pages，配合 R2 做存储。相关部署细节可以看《Cloudflare Workers 免费搭建个人博客》和《Cloudflare 数据层三件套》。
