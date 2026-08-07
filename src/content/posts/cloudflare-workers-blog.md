---
title: 零成本建站！用 Cloudflare Workers 免费搭建个人博客完整教程
pubDatetime: "2026-07-20T00:00:00.000Z"
description: 手把手教你使用 Cloudflare Workers 免费搭建个人博客，无需服务器，全球CDN加速，支持自定义域名，零成本上线你的网站。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-workers-blog"
ogImage: "/images/cloudflare-workers-blog-cover.jpg"
---

![image](https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-814d-878a-f9f28c01d539&q=50&width=1080&fmt=webp&fm=webp)

Cloudflare 被网友亲切地称为"赛博活佛"，因为它的 Free 账号提供了大量实用功能。

今天我们就来用 Cloudflare Workers 搭建一个完全免费的个人博客，无需购买服务器，享受全球 CDN 加速。

一、为什么选择 Cloudflare Workers？

传统建站通常需要：

购买服务器（年费几百到几千）+ 配置环境 + 维护安全。

而 Cloudflare Workers 让你跳过所有这些步骤：

- 完全免费：

每天 10 万次请求额度，个人博客绰绰有余
- 全球 CDN：

Cloudflare 在全球 300+ 城市有节点，访问速度极快
- 无需服务器：

代码运行在边缘节点，不用管运维
- 自定义域名：

支持绑定自己的域名，还自动配 HTTPS
- 自动扩缩容：

流量暴增也不用担心

### 二、搭建前的准备你需要准备以下内容：

- 一个 Cloudflare 账号（免费注册）
- 安装 Node.js（建议 18+ 版本）
- 安装 Wrangler CLI（Cloudflare 的命令行工具）
- （可选）一个自己的域名

#### 安装 Wrangler安装完成后，登录你的 Cloudflare 账号：

浏览器会自动打开授权页面，点击允许即可。

三、创建博客项目

#### 1. 初始化项目我们使用 Hono 框架——一个专为边缘计算设计的轻量 Web 框架，速度极快。

#### 

2. 编写核心代码创建 `src/index.ts` 文件：

#### 

3. 配置 wrangler.toml在项目根目录创建 `wrangler.toml`：

四、部署上线

#### 1. 本地预览浏览器打开 `http://localhost:8787` 即可预览效果。

#### 

2. 部署到 Cloudflare部署成功后，你会得到一个 `https://my-blog.<你的子域>.workers.dev` 的地址，博客已经上线了！

#### 

3. 绑定自定义域名如果你有自己的域名（且域名已托管在 Cloudflare）：

- 进入 Cloudflare Dashboard → Workers & Pages
- 选择你的 Worker 项目
- 点击 "Settings" → "Triggers"
- 在 "Custom Domains" 中添加你的域名
- Cloudflare 会自动配置 DNS 和 SSL 证书

### 五、进阶：

添加文章管理为了真正像一个博客，我们可以用 Cloudflare KV 存储文章内容：

#### 

1. 创建 KV 命名空间

#### 2. 更新 wrangler.toml

#### 3. 读取文章列表

### 六、成本分析项目

传统建站

Cloudflare Workers

服务器

¥300-3000/年

**免费**

CDN加速

¥100-500/年

**免费**

SSL证书

¥0-800/年

**免费**

域名

¥50/年

¥50/年（可选）

**总成本**

**¥450-4350/年**

**¥0-50/年**

七、注意事项
- 请求限制：

免费版每天 10 万次请求，个人博客完全够用
- CPU 时间：

单次请求 CPU 时间限制 10ms，纯静态内容没问题
- KV 读写：

免费版每天 10 万次读、1000 次写，注意写入频率
- 静态资源大小：

单个文件不超过 25MB

### 八、总结使用 Cloudflare Workers 搭建博客是一个真正的零成本方案。

你不需要购买服务器，不需要配置环境，不需要维护安全更新——只需要写代码，然后 `wrangler deploy`，一切就搞定了。

对于个人博客、文档站、小型展示站来说，这可能是 2026 年最划算的建站方案之一。

如果你还没有试过，强烈建议动手实践一下。

[上一篇💻 codebase-memory-mcp：

让AI记住整个代码库的神器，毫秒级索引158种语言](/article/codebase-memory-mcp)[下一篇Cloudflare Tunnel 免费内网穿透：

把家里的NAS、树莓派暴露到公网](/article/cloudflare-tunnel)

[下一篇Cloudflare Tunnel 免费内网穿透：

把家里的NAS、树莓派暴露到公网](/article/cloudflare-tunnel)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/cloudflare-workers-blog](https://xiaozha.org/article/cloudflare-workers-blog)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg?t=3a9c55d5-e9ea-816d-a569-f20405ad6185)](/article/vscode-extensions-2026)
