---
title: Tailscale vs Cloudflare Tunnel：自托管远程访问该选哪个？
pubDatetime: "2026-10-24T00:00:00.000Z"
description: Tailscale 和 Cloudflare Tunnel 解决的是两个不同问题：前者把你的设备组成私有 mesh 网络，后者把 Web 服务发布到公网。本文讲清架构差异、隐私边界、Cloudflare 服务条款对视频传输的限制，以及两者混合使用的最佳实践。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/tailscale-vs-cloudflare-tunnel"
ogImage: "/images/tailscale-vs-cloudflare-tunnel-real.jpg"
coverAlt: "配线架上编号的端口与密集的蓝灰色网线"
enSlug: "tailscale-vs-cloudflare-tunnel"
---

想把家里的服务在外网访问，2018 年的做法是在路由器上开端口映射。2026 年还这么干，等于把内网 IP 挂到扫描器脸上——几小时内就会有机器人尝试暴力破解你的 SSH。

现在有两个主流方案，都做到**零开放入站端口**：Tailscale 和 Cloudflare Tunnel。

网上大量文章把它们当成竞品比较，其实**它们解决的是两个不同问题**。选错的那个，会在某个深夜连不回家的时候后悔。

## 先分清：发布还是连接

这是全部决策的起点。

**发布（Publishing）**：把一个 Web 服务分享给"任何人"——朋友、家人、同事，对方不会为你装任何软件，用浏览器打开 URL 就行。

**连接（Connecting）**：让你自己的设备在外网像在同一个局域网里一样，访问家里所有机器的 SSH、数据库、管理面板。

前者要 **Cloudflare Tunnel**，后者要 **Tailscale**。

搞混的典型后果：想给爸妈看相册，装了个 Tailscale，然后花两小时教他们装客户端——而这件事 Cloudflare Tunnel 五分钟搞定；反过来，想 SSH 回家，用了 Cloudflare Tunnel，然后发现它只能代理 HTTP，SSH 走不了。

## 架构差异

### Cloudflare Tunnel 怎么工作

在家里任意机器上跑一个 `cloudflared` 守护进程，它**主动向外**建立一条到 Cloudflare 边缘网络的加密隧道。

外部访问 `jellyfin.example.com` 时：请求先到 Cloudflare 边缘节点 → Cloudflare 做 DDoS 清洗、WAF 过滤、TLS 终止 → 再通过隧道转给你家里的服务。

全程没有入站连接，你家 IP 对外不可见。

### Tailscale 怎么工作

Tailscale 用 WireGuard 协议，把你所有的设备组成一个加密 mesh 网络（叫 tailnet）。每个设备拿到一个固定的 `100.x.x.x` 地址，互相之间点对点直连。

**Subnet Router（子网路由）** 是关键角色：它是一个 Tailscale 节点，同时把你的整个家庭网段（比如 `192.168.1.0/24`）通告给 tailnet 里其他设备。这样你的手机在外网能直接访问 `192.168.1.10`——像真的连上了家里 WiFi。

打洞失败时（对称 NAT、严格防火墙）走 DERP 中继，仍然是端到端加密，中继看不到内容。

## 正面对比

| | Cloudflare Tunnel | Tailscale |
|---|---|---|
| 本质 | 反向代理发布服务 | 私有 mesh VPN |
| 协议 | HTTP/HTTPS（SSH/RDP 需另配） | **完整三层，TCP/UDP/ICMP 全支持** |
| 加密边界 | TLS 终止在 Cloudflare 边缘 | **端到端，WireGuard 密钥加密** |
| 第三方可见性 | Cloudflare 能看到解密后流量 | 只能看到元数据 |
| 客户端要求 | 访问者零安装 | 每个设备要装客户端 |
| 域名 | 必须有（且 DNS 在 Cloudflare） | 不需要，MagicDNS 自动分配 |
| 延迟 | +10~30ms（边缘跳转） | +2~8ms（P2P 直连） |
| 公开分享 | **强项**，WAF/DDoS/缓存全免费 | 弱（Funnel 仍属实验性） |
| 私有访问 | 弱，需要 Access 规则 | **强项**，像在局域网 |
| 自托管替代 | 无 | **Headscale**（自建控制服务器） |
| 费用 | 免费，需域名 | 个人免费额度够家用 |

## 隐私边界：一个容易被忽略的差别

**Cloudflare Tunnel 的 TLS 终止在 Cloudflare 边缘。** 也就是说你的流量在 Cloudflare 机房里是明文状态——这是它能做 WAF 过滤、Bot 识别、Access 认证的前提。

技术上 Cloudflare 有能力读取你的流量内容。对公开服务来说这是合理的交换：你换来免费的 DDoS 防护和应用层过滤。

**Tailscale 是端到端加密。** 每个包在你的设备上用对方公钥加密，只有目标主机能解开。即使走 DERP 中继，中继服务器也看不到载荷。

所以原则很清晰：**公开服务走 Cloudflare，私有管理走 Tailscale。** 别用 Cloudflare Tunnel 暴露你的密码管理器管理后台——那是拿隐私换不必要的便利。

## Cloudflare 服务条款的坑：视频传输

这条很多人踩，单独说。

**Cloudflare 自助服务条款（第 2.8 节）限制通过 CDN 传输大量非 HTML 内容**——典型就是视频流。用 Cloudflare Tunnel 暴露 Jellyfin 或 Plex，然后远程放 4K，属于灰色地带。

实际执行对小个人站点很少见，但**这是 Cloudflare 的裁量权，不是你的**。真被判定违规，后果可能是域名被停。

所以：

- **Jellyfin / Plex / Emby 远程播放 → 用 Tailscale**，WireGuard 点对点没有这类限制
- 博客、状态页、API、Webhook、家庭相册的**公开分享链接** → Cloudflare Tunnel 没问题
- 图片、文档这类小文件 → Cloudflare Tunnel 可以

我自己家的做法：Jellyfin 只挂 Tailscale，Uptime Kuma 状态页走 Cloudflare Tunnel 公开。

## Tailscale 上手

三步，五分钟：

**1. 注册并安装**

[tailscale.com](https://tailscale.com) 注册，各设备装客户端（Windows/macOS/Linux/iOS/Android 全平台）。登录同一个账号就进同一个 tailnet。

**2. 设一个 Subnet Router**

家里随便一台常开的机器（或专门的小主机），装 Tailscale 后：

```bash
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-dns=false
```

`--advertise-routes` 填你家网段。然后去管理后台 **Machines → 那台机器 → Edit route settings**，批准这个路由。

**3. 开 IP 转发（Subnet Router 必需）**

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

完事。现在手机在外面 `ssh 192.168.1.10` 就能连回家，浏览器开 `http://192.168.1.50:8096` 就是 Jellyfin。

配合 **MagicDNS**，还能用机器名访问：`ssh proxmox`、`http://pihole/admin`，不用记 IP。

## Cloudflare Tunnel 上手

详细步骤见《Cloudflare Tunnel 免费内网穿透》，这里只说骨架：

```bash
# 安装并登录
cloudflared tunnel login

# 创建命名隧道
cloudflared tunnel create homeserver

# 把域名指过来
cloudflared tunnel route dns homeserver jellyfin.example.com
```

`config.yml`：

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: status.example.com
    service: http://localhost:3001
  - hostname: photos.example.com
    service: http://localhost:2283
  - service: http_status:404
```

```bash
sudo cloudflared service install
```

**前置条件**：一个域名，且 DNS 托管在 Cloudflare。没有域名的话 Tunnel 用不了（Tailscale 不需要域名）。

## 混合架构：多数人最后的形态

如果你两个都有，分工是这样的：

```
                        ┌─ 公开服务 ─→ Cloudflare Tunnel ─→ 公网可访问
                        │   （状态页、分享相册、API、Webhook）
外网设备 ─── Tailscale ─┤
                        └─ 私有管理 ─→ 直接走 mesh ─→ SSH/Proxmox/数据库/NAS/监控
```

具体到设备：

| 服务 | 走哪个 | 理由 |
|---|---|---|
| SSH 到各台机器 | Tailscale | 非 HTTP，且要 IP 级访问 |
| Proxmox / TrueNAS 管理面板 | Tailscale | 管理后台不该公开 |
| 数据库 | Tailscale | 别把 5432 暴露出去 |
| Pi-hole 管理界面 | Tailscale | 查询日志等于浏览记录 |
| Grafana 监控 | Tailscale | 含内网拓扑信息 |
| Jellyfin / Plex | Tailscale | 避开 Cloudflare 视频条款 |
| 博客、文档、导航站 | Cloudflare Tunnel | 要公开被访问 |
| Uptime Kuma 状态页 | Cloudflare Tunnel | 给别人自查用 |
| Webhook、API | Cloudflare Tunnel | 第三方要能调 |
| 家庭相册公开分享 | Cloudflare Tunnel | 家人不装客户端 |

维护成本确实比单用一个高：新机器要装 Tailscale，要公开的服务再加一条隧道规则。但就两个动作，不构成负担。

## 只想选一个？

选 **Tailscale**。

理由：私有访问覆盖的场景远比"发布"多——SSH、管理面板、数据库、监控、媒体播放，这些都是你天天用的；而"把服务分享给不装客户端的人"是偶发需求。而且 Tailscale 没有域名门槛、没有服务条款灰区、没有第三方解密你的流量。

等哪天真有需要了，再加一个 cloudflared 容器——一个域名加一条隧道的事。

## 想彻底摆脱第三方？

两个都有自托管替代：

- **Headscale**：开源的 Tailscale 控制服务器，自建后不依赖 Tailscale 官方协调服务器，客户端照样用。数据全在自己手里。
- Cloudflare Tunnel **没有**自托管替代——它的价值就在 Cloudflare 的边缘网络上，自己搭那就成了自建反代 + 自建 CDN，是另一个量级的工程。

如果第三方可见性是你的红线，Tailscale + Headscale 是完整答案。

## 小结

一句话决策：

> **给自己和设备访问 → Tailscale；给别人和不装软件的人访问 → Cloudflare Tunnel。**

两个都装，按"公开/私有"划清边界，是 2026 年自托管远程访问的标准形态。每月成本 0 元，攻击面接近于零，比任何端口映射方案都安全。

接着可以看《Cloudflare Tunnel 免费内网穿透》把公网那半配好，或者《Ubuntu Server 初始化配置》把服务器地基先打牢。
