---
title: Cloudflare R2 对象存储完全指南：10GB 免费存储，替代 S3 的最佳选择
pubDatetime: "2026-07-21T00:00:00.000Z"
description: 详细教程教你在 Cloudflare R2 上使用免费对象存储，含 S3 兼容 API、CDN 加速、自定义域名配置，替代 AWS S3 节省成本。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-r2-storage"
ogImage: "/images/cloudflare-r2-storage-real.jpg"
coverAlt: "云端服务器机房的蓝色存储阵列灯光"
---

![image](https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-8130-990e-e9fc5d09cd05&q=50&width=1080&fmt=webp&fm=webp)

Cloudflare R2 提供 10GB 免费存储 + 零出口流量费，是 AWS S3 的最佳免费替代品。

本文详解使用方法。

一、R2 核心优势
- 10GB 免费存储永久免费
- 零出口流量费（S3 这部分很贵）
- S3 兼容 API：

现有工具无缝迁移
- 全球 CDN 加速

### 二、快速开始

#### 1. 创建 R2 存储桶登录 Cloudflare Dashboard → R2 → Create Bucket

#### 

2. 获取 API 凭证创建 API Token，配置 S3 客户端：

#### 

3. 上传文件

### 三、绑定自定义域名
- R2 Dashboard → 你的 Bucket → Settings
- Public Access → Connect Domain
- 输入你的子域名（如 `cdn.example.com`）
- Cloudflare 自动配置 DNS

### 四、典型使用场景
- 博客图片存储
- 静态资源 CDN
- 备份文件存储
- 用户上传文件

[上一篇🚀 免费内网穿透！

Cloudflare Tunnel 实战教程，让本地AI服务触达全球](/article/cloudflare-tunnel-tutorial)[下一篇Cloudflare 国内加速实战：

优选 IP 配置指南](/article/cloudflare-ip-optimization)

[下一篇Cloudflare 国内加速实战：

优选 IP 配置指南](/article/cloudflare-ip-optimization)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/cloudflare-r2-storage](https://xiaozha.org/article/cloudflare-r2-storage)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg?t=3a9c55d5-e9ea-816d-a569-f20405ad6185)](/article/vscode-extensions-2026)
