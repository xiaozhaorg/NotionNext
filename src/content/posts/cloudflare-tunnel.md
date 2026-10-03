---
title: Cloudflare Tunnel 免费内网穿透：把家里的NAS、树莓派暴露到公网
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Cloudflare Tunnel 免费将内网服务暴露到公网，无需公网IP、无需端口映射，5分钟搭建安全的内网穿透。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-tunnel"
ogImage: "/images/cloudflare-tunnel-real.jpg"
coverAlt: "数据中心服务器机架上闪烁的网络指示灯"
enSlug: "cloudflare-tunnel"
---

Cloudflare Tunnel（以前叫 Argo Tunnel）是免费内网穿透的最佳方案，无需公网 IP，无需端口映射，5 分钟即可用上。

## 一、什么是 Cloudflare Tunnel

通过在本地运行 `cloudflared` 守护进程，与 Cloudflare 边缘节点建立加密隧道，让公网用户可以通过你的域名访问内网服务。

## 二、安装 cloudflared

### Windows

从 [GitHub Releases](https://github.com/cloudflare/cloudflared/releases) 下载 `.msi` 安装包，或使用 winget：

```powershell
winget install Cloudflare.cloudflared
```

### macOS

```bash
brew install cloudflared
```

### Linux

```bash
# Debian/Ubuntu
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# CentOS/RHEL
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm
sudo rpm -i cloudflared-linux-amd64.rpm
```

验证安装：

```bash
cloudflared version
```

## 三、登录并创建隧道

```bash
# 1. 登录 Cloudflare 账号
cloudflared tunnel login

# 2. 创建命名隧道
cloudflared tunnel create my-tunnel

# 3. 配置 DNS（自动创建 CNAME）
cloudflared tunnel route dns my-tunnel tunnel.yourdomain.com
```

### config.yml 示例

在 `~/.cloudflared/config.yml` 中配置：

```yaml
tunnel: my-tunnel
credentials-file: ~/.cloudflared/<UUID>.json

ingress:
  - hostname: tunnel.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

## 四、配置 DNS

`cloudflared tunnel route dns` 命令会自动在 Cloudflare 控制台添加 CNAME 记录，指向 `<UUID>.cfargotunnel.com`。可通过 Cloudflare Dashboard → DNS 查看。

## 五、启动隧道

```bash
cloudflared tunnel run my-tunnel
```

配置开机自启：

```bash
# Linux（systemd）
sudo cloudflared service install

# Windows（管理员 PowerShell）
cloudflared service install
```

## 六、典型应用

- **NAS 远程访问**（群晖、威联通）
- **树莓派服务**
- **HomeAssistant 智能家居**
- **游戏服务器**
- **开发环境调试**
