---
title: Cloudflare 国内加速实战：优选 IP 配置指南
pubDatetime: "2026-07-05T00:00:00.000Z"
description: 网站管理员专属！通过优选IP + DNS解析实现全站加速，让所有国内访客都能享受低延迟访问体验。
author: 小吒
tags:
  - Cloudflare
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-ip-optimization"
ogImage: "/images/cloudflare-ip-optimization-real.jpg"
coverAlt: "数据中心服务器机架上闪烁的网络指示灯"
enSlug: "cloudflare-ip-optimization"
---

## 前言

Cloudflare 是全球最大的免费 CDN 服务商，但在中国大陆访问时经常遇到高延迟、丢包的问题。

作为网站管理员，你需要一套方案来优化所有访客的访问体验，而不是让每个用户自己去折腾。

本文分享一套面向网站管理员的加速方案：通过本地测速获取真实延迟的优选 IP，然后配置 DNS 解析让所有访客受益。

## 为什么需要优选 IP

Cloudflare 使用 Anycast 技术，理论上会自动连接最近的节点。但实际情况是：

| 现象 | 原因 |
|---|---|
| 延迟 200ms+ | 流量被路由到美国西海岸或欧洲节点 |
| 连接不稳定 | 部分 IP 段网络拥堵或线路质量差 |
| 频繁丢包 | 国际出口带宽受限 |

**核心问题：** 默认分配的 IP 可能不是国内网络环境中最快的那个。通过手动选择优选 IP，可以让访客直接连接到延迟最低的 CF 节点。

## 方案对比

作为网站管理员，你需要选择能让所有访客受益的方案：

| 方案 | 效果范围 | 实施难度 | 推荐度 |
|---|---|---|---|
| **DNS 解析优选 IP** | 全站访客受益 | 低 | ✅✅✅ |
| 三网分线路解析 | 分运营商优化 | 中 | ✅✅✅ |
| CNAME 优选服务 | 全站访客受益 | 低 | ✅✅ |
| 本地 hosts 修改 | 仅自己受益 | 低 | ❌（不推荐） |

**推荐方案：** DNS 解析优选 IP + 三网分线路解析。

## 第一步：获取优选 IP

在配置之前，你需要先测速获取国内访问最快的 Cloudflare IP。

### 使用工具

推荐使用开源工具 [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest)，这是国内公认最稳定的 CF IP 测速工具。

### 下载地址

| 平台 | 下载链接 |
|---|---|
| Windows | [CloudflareSpeedTest_windows_amd64.zip](https://github.com/XIU2/CloudflareSpeedTest/releases) |
| macOS | [CloudflareSpeedTest_macos_amd64.tar.gz](https://github.com/XIU2/CloudflareSpeedTest/releases) |
| Linux | [CloudflareSpeedTest_linux_amd64.tar.gz](https://github.com/XIU2/CloudflareSpeedTest/releases) |

### 运行测速

下载解压后直接运行工具，默认参数即可。程序会输出延迟最低的 IP 列表。

```bash
# Linux / macOS
./CloudflareSpeedTest

# Windows（在 PowerShell 或 CMD 中运行）
CloudflareSpeedTest.exe
```

### 选择标准

测速完成后，选择以下条件的 IP：

| 指标 | 推荐值 | 说明 |
|---|---|---|
| 延迟 | ≤ 100ms | 越低越好，50ms 内最佳 |
| 下载速度 | ≥ 5MB/s | 确保带宽充足 |
| 丢包率 | 0% | 必须为 0，否则不稳定 |

记录延迟最低的前 3-5 个 IP，作为优选 IP。

## 第二步：配置 DNS 解析（核心步骤）

这是最关键的一步，配置完成后所有访客都会通过优选 IP 访问你的网站。

### 前提条件

- 域名已在 Cloudflare 托管
- 已获取优选 IP

### 配置步骤

1. 登录 Cloudflare 控制面板，进入你的域名管理页面
2. **关闭橙色代理**（改为灰云 / DNS only）

> ⚠️ 重要：如果不关闭代理，直接使用 IP 访问会触发 1003 错误。

3. 添加 A 记录，指向优选 IP：

| 主机记录 | 类型 | 记录值 | 代理状态 |
|---|---|---|---|
| @ | A | 104.16.132.22 | DNS only（灰云） |
| www | A | 104.16.132.22 | DNS only（灰云） |

4. 设置 SSL/TLS：进入 SSL/TLS 设置，将模式改为「完全（严格）」。

### 为什么要关闭代理

| 效果 | 说明 |
|---|---|
| 橙色代理（开启） | 流量经过 CF 节点，可享受安全防护，但可能被分配到慢节点 |
| 灰色代理（关闭） | 直接解析到 CF IP，绕过节点分配，访问更快 |

关闭代理后，你的网站仍然使用 Cloudflare 的任播 IP 段，只是不再经过 CF 的安全过滤和加速层。

## 第三步：三网分线路解析（进阶方案）

不同运营商的网络质量差异很大，你可以为电信、联通、移动用户分别配置不同的优选 IP。

### 前提条件

- 域名 DNS 迁移到 DNSPod（免费版即可）
- 已分别测出三网的优选 IP

### 配置方法

在 DNSPod 添加多条 A 记录：

| 主机记录 | 类型 | 线路类型 | 记录值 |
|---|---|---|---|
| @ | A | 电信 | 104.16.132.22 |
| @ | A | 联通 | 172.64.155.88 |
| @ | A | 移动 | 104.18.42.166 |
| @ | A | 默认 | 104.16.132.22 |

### 如何分别测速

你需要在不同运营商网络环境下测速，或者使用社区提供的 IP 段文件（GitHub 或技术社区搜索 Cloudflare IP 段）。

## 第四步：自动更新优选 IP（自动化方案）

优选 IP 的网络状况会随时间变化，建议定期更新。你可以使用脚本实现自动更新。

### 配置 DNSPod API

在 DNSPod 控制台创建 API 密钥，记录 `SECRET_ID` 和 `SECRET_KEY`。

### 创建自动更新脚本

使用 CloudflareSpeedTest + DNSPod API 实现一键测速和更新：

```bash
#!/bin/bash
# cf-ip-update.sh - 自动测速并更新 DNSPod 解析

CLOUDFLARE_IP="你的优选 IP"
DNSPOD_SECRET_ID="你的 SECRET_ID"
DNSPOD_SECRET_KEY="你的 SECRET_KEY"
DOMAIN="你的域名"
SUB_DOMAIN="@"

# 1. 测速获取新 IP
./CloudflareSpeedTest -t 200 -n 10 -o result.csv
NEW_IP=$(tail -n +2 result.csv | sort -t',' -k2 -n | head -1 | cut -d',' -f1)

# 2. 更新 DNSPod 解析
# （调用 DNSPod API 修改 A 记录）
echo "优选 IP 已更新为: $NEW_IP"
```

### 设置定时任务

使用 crontab 设置每 6 小时更新一次：

```bash
# 编辑定时任务
crontab -e

# 添加这一行
0 */6 * * * /path/to/cf-ip-update.sh >> /var/log/cf-ip-update.log 2>&1
```

### 使用 GitHub Actions（推荐）

你也可以使用 GitHub Actions 实现定时测速和更新。

> ⚠️ 注意：GitHub Actions 运行在海外，测速结果可能不如国内准确。建议使用国内服务器或本地电脑运行脚本。

## 验证效果

### 检查 DNS 解析

```bash
# 本地查看 DNS 解析
nslookup yourdomain.com

# 或使用在线工具
# https://ping.chinaz.com/
```

### 测试访问速度

使用浏览器开发者工具（F12），切换到 Network 面板，查看 **TTFB**（Time to First Byte）：

| 指标 | 优化前 | 优化后 |
|---|---|---|
| TTFB | 200-500ms | 50-100ms |
| 页面加载 | 3-5s | 1-2s |

### 监控建议

- 使用 Cloudflare Analytics 监控访问速度
- 设置告警，当 TTFB 超过阈值时通知
- 每周手动测速一次，验证优选 IP 是否仍然有效

## 常见问题

**Q1：关闭代理后 SSL 证书还能用吗？**

A：可以。只要域名曾经在 Cloudflare 托管过，CF 会自动签发通用证书。即使改为灰云解析，证书仍然有效。但需要注意：
- SSL/TLS 模式设置为「完全（严格）」
- 源站必须有有效证书（CF Pages / Vercel 等托管平台自动提供）

**Q2：优选 IP 会失效吗？**

A：会。Cloudflare IP 的网络状况会变化，建议：
- 每 1-2 周重新测速
- 保留 3-5 个备用 IP
- 配置自动更新脚本

**Q3：为什么有些 IP 测速快但访问慢？**

A：测速只反映到 CF 节点的延迟，访问速度还取决于：
- CF 到源站的连接
- 源站响应速度
- 页面资源大小

建议同时测试下载速度，选择延迟和速度都好的 IP。

**Q4：如何测试不同地区的访问速度？**

A：可以使用在线工具：
- [站长工具](https://ping.chinaz.com/) — 国内多节点 ping 测试
- [Cloudflare Radar](https://radar.cloudflare.com/) — CF 网络状态
- [17CE](https://www.17ce.com/) — 全国多节点测速

## 避坑总结

| 错误做法 | 正确做法 |
|---|---|
| 海外测速（结果失真，不适合国内用户） | 在国内环境测速 |
| 开启橙云 + 直连 IP（触发 1003 错误） | 关闭代理（灰云） |
| 单一 IP 无备用（IP 失效后无法访问） | 保留多个备用 IP |
| 频繁测速大量 IP（触发 CF 风控） | 每周 1 次，每次 100-200 IP |
| 三网共用一个 IP（部分运营商访问慢） | 使用分线路解析 |

## 方案总结

本文推荐的优选 IP + DNS 解析方案：

| 优势 | 说明 |
|---|---|
| 全站受益 | 所有访客都能加速，无需用户操作 |
| 简单易行 | 无需服务器，只需配置 DNS |
| 效果显著 | TTFB 从 200ms+ 降到 100ms 以内 |
| 零成本 | 工具和 DNS 服务全部免费 |

**核心步骤：**

1. 在国内环境使用 CloudflareSpeedTest 测速
2. 选择延迟最低的 3-5 个 IP
3. 配置域名 DNS 解析（关闭 CF 代理）
4. （可选）配置三网分线路解析
5. （可选）设置自动更新脚本
6. 定期监控和验证效果

这套方案经实测有效，是网站管理员优化 Cloudflare 国内访问速度的最佳实践。

---

**参考资料：**
- [XIU2/CloudflareSpeedTest](https://github.com/XIU2/CloudflareSpeedTest) — 测速工具
- [DNSPod 分线路解析](https://docs.dnspod.cn/api/) — API 文档
- [Cloudflare SSL/TLS 设置](https://developers.cloudflare.com/ssl/) — 官方文档
