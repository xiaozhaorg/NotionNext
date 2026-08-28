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
enSlug: "cloudflare-r2-storage"
---

![image](/images/remote/1563986768609-322da13575f3.webp)

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

[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg)](/article/vscode-extensions-2026)
