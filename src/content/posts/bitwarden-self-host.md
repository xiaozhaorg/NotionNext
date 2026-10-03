---
title: Vaultwarden 自托管密码管理器：告别 1Password 年费，数据自己掌控
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Vaultwarden 是 Bitwarden 的轻量自托管版，本文详解 Docker 部署、Cloudflare Tunnel 安全暴露、客户端配置，告别年费。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/bitwarden-self-host"
ogImage: "/images/bitwarden-self-host-real.jpg"
coverAlt: "云计算与服务器机房的蓝色科技灯光"
enSlug: "bitwarden-self-host"
---

1Password 一年要 $36？

Vaultwarden 自托管完全免费，且数据自己掌控。

一、为什么选 Vaultwarden
- 完全免费开源
- 兼容 Bitwarden 客户端
- 资源占用低（10MB 内存）
- Docker 一键部署
- 密码完全自己掌控

### 二、Docker 部署`docker-compose.yml`：

启动：

三、Cloudflare Tunnel 暴露

### 四、客户端配置下载 Bitwarden 客户端，服务器地址填入你的域名，即可使用。

五、安全建议
- 启用 2FA
- 关闭公开注册（注册完成后设置 `SIGNUPS_ALLOWED=false`）
- 定期备份 data 目录
- 配置 fail2ban 防爆破

### 六、迁移自 1Password
- 1Password 导出 CSV
- Bitwarden 网页端导入
- 验证无误后删除 1Password 数据

[Claude Code 实战指南：

