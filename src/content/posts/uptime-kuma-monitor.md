---
title: Uptime Kuma 自建监控：免费替代 UptimeRobot，漂亮又强大
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Uptime Kuma 自托管监控完全指南：Docker 部署、HTTP/TCP/Ping/DNS/推送等监控类型、Telegram 与 Ntfy 等告警配置、公开状态页、SSL 证书监控、Cloudflare Tunnel 暴露与备份迁移。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/uptime-kuma-monitor"
ogImage: "/images/uptime-kuma-monitor-real.jpg"
coverAlt: "整洁办公桌面上的笔记本电脑与工作笔记"
enSlug: "uptime-kuma-monitor"
---

Uptime Kuma 是一款漂亮的自托管监控工具，GitHub 60k+ Stars。功能对标 UptimeRobot，但免费额度无限、界面更好看，而且能自己掌握所有监控数据。

这篇从部署讲到告警、状态页、SSL 监控和安全暴露。

## 为什么不用 UptimeRobot

UptimeRobot 免费版 50 个监控项、5 分钟检查间隔。听起来够用，但：

- 5 分钟间隔意味着你的站最长挂了 5 分钟你才知道
- 状态页定制受限，品牌化要付费
- 数据在别人手里，历史记录导出麻烦

Uptime Kuma 没有这些限制：监控项无限、间隔最低 20 秒、状态页完全自定义、数据在自己 SQLite 里。

## Docker Compose 部署

### 目录结构

```
/opt/uptime-kuma/
└── docker-compose.yml
```

数据存在容器内的 `/app/data`，用命名卷持久化。

### `docker-compose.yml`

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data

volumes:
  uptime-kuma-data:
```

### 启动

```bash
cd /opt/uptime-kuma
docker compose up -d
docker compose logs -f uptime-kuma
```

日志出现 `Listening on 3001` 就成了。访问 `http://服务器IP:3001`，第一次进会要你建管理员账号——**这个账号只有一次机会，密码忘了基本只能重置数据**，设完记好。

### 升级

```bash
docker compose pull
docker compose up -d
```

数据在卷里，升级不丢。但大版本升级前建议先备份（见下文）。

## 添加第一个监控

左侧 **+ New Monitor**，以监控一个网站为例：

- **Monitor Type**：`HTTP(s)`
- **Friendly Name**：`我的博客`
- **URL**：`https://xiaozha.org`
- **Heartbeat Interval**：`60` 秒（个人用够了，重要服务可以 30）
- **Retries**：`3`（连续失败 3 次才告警，避免网络抖动误报）
- **Request Timeout**：`10` 秒

保存后列表里就会出现一条，绿点表示正常。点进去能看响应时间曲线和详细日志。

## 监控类型详解

Uptime Kuma 支持十几种，常用的：

| 类型 | 监控什么 | 典型用途 |
|---|---|---|
| `HTTP(s)` | 网址可用性 + 状态码 + 响应时间 | 网站、API 健康检查 |
| `TCP Port` | 端口是否开放 | 数据库、SSH、游戏服 |
| `Ping` | 主机是否可达 | 服务器、路由器 |
| `DNS` | 域名解析记录 | 盯着解析有没有被改 |
| `Push` | **反向监控**，你定时来"打卡" | cron 任务是否还在跑 |
| `Docker Container` | 容器状态 | 本机 Docker 服务 |
| `Steam / GameDig` | 游戏服务器 | Minecraft 等 |
| `Keyword` | 页面内容包含关键词 | 监控页面被篡改 |
| `gRPC` | gRPC 服务 | 微服务 |

### Push 监控值得单独说

这是最容易被忽略但极好用的类型。它反过来：**不是 Uptime Kuma 去访问你，而是你的 cron 任务每隔一段时间 ping 一下 Uptime Kuma**。

```bash
# crontab 里
*/5 * * * * curl -fsS https://kuma.example.com/api/push/xxxxx > /dev/null
```

如果你的备份脚本凌晨 2 点执行，执行完就 curl 一下。**Uptime Kuma 超过 5 分钟没收到这个 ping 就告警**——意味着你的 cron 挂了、机器宕了、或者脚本报错没跑完。

这是监控"监控不到的东西"（定时任务本身）的唯一可靠办法。

## 告警通知配置

Uptime Kuma 支持 90+ 通知渠道。点监控项的 **Notifications** 或全局 **Settings → Notifications** 配置。

### Telegram（推荐）

1. 找 [@BotFather](https://t.me/BotFather) 发 `/newbot`，拿到 Bot Token
2. 给你的 Bot 发条消息，然后访问 `https://api.telegram.org/bot<token>/getUpdates` 拿到 Chat ID
3. Uptime Kuma 里选 **Telegram**，填 Token 和 Chat ID，点 Test

好处：免费、实时、支持群组（可以把家人的监控都推到同一个群）。

### Discord / Slack（Webhook）

频道设置 → 集成 → Webhook → 复制 URL，粘到 Uptime Kuma 对应渠道。团队协作时好用。

### 邮件（SMTP）

设置里填 SMTP 服务器、端口、账号密码。适合作为兜底渠道——IM 挂了邮件还能到。

### 通用 Webhook

任何能收 POST 的服务都行。接自己的告警系统、飞书机器人、或者写个脚本转发到微信，都用这个。

### Ntfy — 免费手机推送

[ntfy.sh](https://ntfy.sh) 是开源推送服务，不用注册：

1. 手机装 ntfy App，订阅一个随机 topic（比如 `my-alerts-abc123`）
2. Uptime Kuma 选 **Ntfy**，Topic 填 `my-alerts-abc123`，服务器 `https://ntfy.sh`

告警直接推送到手机通知栏，比邮件及时，又不需要像 Telegram 那样配 Bot。**国内网络访问 ntfy.sh 不稳的话，可以自托管 ntfy 服务端**（一个二进制文件，Docker 一条命令）。

### 国内常用渠道

- **Server酱 / ServerChanTurbo**：推到微信，配置最简单
- **Bark**：iOS 推送，免费
- **企业微信 / 钉钉群机器人**：团队场景

## 公开状态页

想让别人看到你的服务状态（或者自己出门在外也能看），用 Status Page：

**Status Pages → New Status Page**，起个名，勾选要展示的监控项，保存后会得到一个公开链接。

可以自定义：域名（`status.example.com`）、主题色、Logo、描述文字、显示哪些指标。

这个页面不需要登录就能看，适合放在博客底部或文档里，让用户自查"是不是服务挂了"。

## SSL 证书过期监控

证书过期是经典的"半夜全站挂掉"事故。Uptime Kuma 能提前警告：

监控项里 **Advanced → Certificate Expiry Notification**，填提前多少天提醒（建议 30 天）。

配了之后，证书剩 30 天会告警一次，剩 7 天再告警一次。Cloudflare 的自动证书一般 90 天续期，有这个监控足够从容处理。

## 安全暴露到公网

监控页面上有你的服务器拓扑、服务地址、响应时间，**不要裸暴露**。

### 方案 A：反向代理 + HTTPS

用 Caddy 最简单，自动签证书：

```caddy
status.example.com {
    reverse_proxy localhost:3001
}
```

但这样端口还是对外开的，只是套了 HTTPS 和域名。要加认证的话，Uptime Kuma 本身有账号系统，但**没有二次验证**。

### 方案 B：Cloudflare Tunnel（推荐）

不开放任何端口，通过 Cloudflare 内网穿透出去：

```bash
# 服务器上安装 cloudflared（详见《Cloudflare Tunnel 免费内网穿透》）
cloudflared tunnel login
cloudflared tunnel create uptime-kuma
cloudflared tunnel route dns uptime-kuma status.example.com
```

`config.yml`：

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: status.example.com
    service: http://localhost:3001
  - service: http_status:404
```

```bash
cloudflared tunnel run uptime-kuma
```

好处：机器上没有对外开放的端口，扫描器根本看不到你。Cloudflare 还能在前面加 Access 策略（邮箱验证、一次性密码），做到"只有你能看"。

## 备份与迁移

### 备份数据目录

```bash
# 先停容器，保证数据一致
cd /opt/uptime-kuma && docker compose stop

# 打包数据目录（命名卷在 docker volume 里）
docker run --rm \
  -v uptime-kuma-data:/data \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/kuma-$(date +%F).tar.gz -C /data .

docker compose start
```

把这个 tar.gz 加进你现有的备份流程（比如 rclone 同步到 R2）。

### 内置备份功能

Uptime Kuma 1.23+ 在设置里有 **Backup** 页，可以直接下载 SQLite 数据库文件，也能上传恢复。比手动 tar 方便。

### 迁移到新机器

把备份文件拷过去，新机器上起容器，从设置里上传恢复，所有监控项和通知配置都回来了。

## 进阶用法

### Prometheus API

Uptime Kuma 提供 `/metrics` 端点，Prometheus 可以直接抓。接 Grafana 就能把监控数据画成漂亮的仪表盘，和服务器指标放一起看。

### 维护模式

计划内停机（升级、迁移）不想收到告警？监控项里开 **Maintenance**，设个时间窗，期间不告警。比临时关监控项方便，而且不容易忘着重开。

### 分组与标签

监控项多了之后，用 **Groups** 分类（按项目、按机器、按重要程度）。配合标签筛选，状态页可以按组展示。

## Uptime Kuma vs 其他方案

| | Uptime Kuma | UptimeRobot | StatusCake | 自建 Prometheus |
|---|---|---|---|---|
| 费用 | 免费无限 | 50 个/5 分钟 | 10 个起 | 免费 |
| 部署 | Docker 一条命令 | 无需部署 | 无需部署 | 复杂 |
| 界面 | 现代好看 | 一般 | 一般 | 取决于 Grafana |
| 状态页 | 完全自定义 | 有限定制 | 有限定制 | 自己搭 |
| 数据归属 | 自己 | 服务商 | 服务商 | 自己 |
| 历史趋势 | 有 | 付费版才有 | 付费版才有 | 极强 |

结论：**个人和小团队用 Uptime Kuma**，除非你需要 Prometheus 那种级别的指标查询能力——那种场景一般是 Uptime Kuma 管可用性，Prometheus 管性能，两个一起用。

## 小结

Uptime Kuma 是自托管里**投入产出比最高**的应用之一：一条 Docker 命令部署完，五分钟配上第一个监控和告警，之后你的服务挂了第一时间知道。

建议部署顺序：先装它，再装其他服务。原因很直接——**没有监控的自托管是盲飞**，等服务出问题你才发现，还不如不自己折腾。

配好之后接着看《Cloudflare Tunnel 免费内网穿透》把它安全暴露到公网，或者《Ubuntu Server 初始化配置》把服务器地基打好。
