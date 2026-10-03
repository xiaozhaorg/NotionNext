---
title: NAS 折腾指南：从硬件选购到系统搭建，打造你的家庭数据中心
pubDatetime: "2026-07-21T00:00:00.000Z"
description: 手把手教你 DIY 一台 NAS，涵盖硬件选购清单、TrueNAS/Unraid 系统安装、远程访问、影音库搭建，私有云存储完整方案。
author: 小吒
tags:
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/nas-diy-guide"
ogImage: "/images/nas-diy-guide-real.jpg"
coverAlt: "团队成员在桌前协作交流的温馨工作场景"
enSlug: "nas-diy-guide"
---

想要一个属于自己的家庭数据中心？

这份 NAS 折腾指南帮你从零开始。

一、硬件选购

#### 入门级（2000 元内）
- 主板：

J4125 / N100 集成
- 内存：8GB DDR4
- 硬盘：2 × 4TB
- 机箱：4 盘位

#### 进阶级（5000 元）
- CPU：

i3-12100 / i5-12400
- 内存：16GB DDR4
- 硬盘：4 × 8TB
- 机箱：6-8 盘位

### 二、系统选择系统

特点

难度

TrueNAS Scale

ZFS 文件系统

中

Unraid

灵活扩展

中

OpenMediaVault

轻量

低

群晖

易用

低（需购买）

三、TrueNAS 安装
- 下载镜像写入 U 盘
- 启动安装
- 配置 ZFS 存储池
- 创建数据集
- 启用 SMB/NFS 共享

### 四、远程访问推荐 Cloudflare Tunnel（免费且安全）：

五、影音库
- Jellyfin / Plex - 媒体服务器
- qBittorrent - 下载工具
- Jellyseerr - 追剧管理
- Immich - 照片备份（Google Photos 替代）

### 六、必备 Docker 应用

[Claude Code 实战指南：

