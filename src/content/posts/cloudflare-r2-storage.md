---
title: Cloudflare R2 对象存储完全指南：10GB 免费存储，替代 S3 的最佳选择
pubDatetime: "2026-07-21T00:00:00.000Z"
description: 详细教程教你在 Cloudflare R2 上使用免费对象存储，含 S3 兼容 API、CDN 加速、自定义域名配置，替代 AWS S3 节省成本。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-r2-storage"
ogImage: "/images/cloudflare-r2-storage-real.jpg"
coverAlt: "云端服务器机房的蓝色存储阵列灯光"
enSlug: "cloudflare-r2-storage"
---

Cloudflare R2 提供 **10GB 免费存储 + 零出口流量费**，是 AWS S3 的最佳免费替代品。本文详解使用方法。

## 一、R2 核心优势

- **10GB 免费存储**：永久免费
- **零出口流量费**：S3 这部分很贵
- **S3 兼容 API**：现有工具无缝迁移
- **全球 CDN 加速**

## 二、快速开始

### 1. 创建 R2 存储桶

登录 Cloudflare Dashboard → **R2** → **Create Bucket**

### 2. 获取 API 凭证

创建 API Token，配置 S3 客户端。以 AWS CLI 为例：

```bash
aws configure
# AWS Access Key ID: <R2 Access Key>
# AWS Secret Access Key: <R2 Secret>
# Default region: auto
```

使用 `aws s3` 命令操作 R2：

```bash
aws s3 cp local-file.jpg s3://my-bucket/ --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

### 3. 上传文件

也可以通过 Cloudflare Dashboard 网页界面直接拖拽上传。

## 三、绑定自定义域名

- R2 Dashboard → 你的 Bucket → **Settings**
- **Public Access** → **Connect Domain**
- 输入你的子域名（如 `cdn.example.com`）
- Cloudflare 自动配置 DNS

## 四、典型使用场景

- 博客图片存储
- 静态资源 CDN
- 备份文件存储
- 用户上传文件
