---
title: Vaultwarden 自托管密码管理器：告别 1Password 年费，数据自己掌控
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Vaultwarden 是 Bitwarden 的轻量自托管版，本文详解 Docker Compose 部署、Cloudflare Tunnel 安全暴露、客户端配置、安全加固与从 1Password 迁移，彻底告别订阅年费。
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

1Password 家庭版一年 $36，团队版更贵。钱是小事——**你的密码库在别人服务器上**，这才是自托管派在意的地方。

**Vaultwarden** 是 Bitwarden 服务端的 Rust 轻量实现：兼容官方所有客户端，资源占用只有原版的几分之一，功能完全一致。自托管免费，数据在自己硬盘上。

这篇从部署讲到迁移，包括怎么把它安全暴露到公网。

## 为什么选 Vaultwarden

- **完全免费开源**：没有付费墙，Bitwarden 收费的高级功能（TOTP、附件、紧急访问）这里都有
- **兼容官方客户端**：iOS、Android、浏览器插件、桌面端全能用，不用换习惯
- **资源占用极低**：10-30 MB 内存，树莓派都跑得动
- **Docker 一键部署**：一个 compose 文件搞定
- **数据自主**：密码库是你自己的 SQLite/MySQL，加密后存在你机器上

**和 Bitwarden 官方自托管（`vaultwarden/server`）的区别**：官方版用 MS SQL Server，重；Vaultwarden 用 SQLite/MySQL/PostgreSQL，轻。功能对个人用户完全够。

## Docker Compose 部署

### 目录结构

```
/opt/vaultwarden/
├── docker-compose.yml
└── data/          # 密码库和附件
```

### `docker-compose.yml`

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    ports:
      - "8222:80"              #  Web 界面和 API
    environment:
      # 域名，用于生成正确的密码库同步地址
      DOMAIN: "https://vw.example.com"
      # 关闭注册——注册完第一个账号后改成 false
      SIGNUPS_ALLOWED: "true"
      # 邀请功能，多账号家庭用
      INVITATIONS_ALLOWED: "true"
      # 登录失败限制，防爆破
      LOGIN_RATELIMIT_MAX_BURST: "10"
      LOGIN_RATELIMIT_SECONDS: "60"
      # 禁用 SINKHOLE 组织策略外的危险项（可选）
      WEBSOCKET_ENABLED: "true"
    volumes:
      - ./data:/data
```

`DOMAIN` 必须填对——客户端同步靠它生成的地址。先用域名配好，或者先用 IP 测试（`http://服务器IP:8222`）。

### 启动并注册

```bash
cd /opt/vaultwarden
docker compose up -d
docker compose logs -f vaultwarden
```

访问 `http://服务器IP:8222`，点 **Create Account** 注册第一个账号——**这个账号就是管理员**。

**注册完立刻关注册**：

```bash
# 改 compose 里的 SIGNUPS_ALLOWED
sed -i 's/SIGNUPS_ALLOWED: "true"/SIGNUPS_ALLOWED: "false"/' docker-compose.yml
docker compose up -d
```

不关的话，任何人都能在你的服务器上建账号，把你的机器当免费密码库用。

## 暴露到公网：Cloudflare Tunnel

密码管理器必须在外网也能用，但**千万别直接开端口**——查询日志等于暴露你的浏览记录，而且这是最值得被攻击的目标。

用 Cloudflare Tunnel，不开放任何入站端口：

```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# 登录并创建隧道
cloudflared tunnel login
cloudflared tunnel create vw
cloudflared tunnel route dns vw vw.example.com
```

`config.yml`：

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: vw.example.com
    service: http://localhost:8222
  - service: http_status:404
```

```bash
sudo cloudflared service install
```

之后 `DOMAIN` 改成 `https://vw.example.com`，重启容器。详细步骤见《Cloudflare Tunnel 免费内网穿透》。

**更安全的做法**：Cloudflare Tunnel 前面再套一层 **Cloudflare Access**，要求邮箱验证或一次性密码才能访问。等于给密码库加了第二道门——就算域名泄露，没有你的邮箱也进不去。

## 客户端配置

各平台装官方 Bitwarden 客户端：

- **iOS/Android**：App Store / Google Play 搜 Bitwarden
- **浏览器**：Chrome/Firefox/Safari 扩展
- **桌面**：Windows/macOS/Linux 客户端

**关键一步**：登录前先改服务器地址。Bitwarden 客户端默认连官方云，自托管要手动指过去：

- 网页版登录页 → 左上角齿轮图标 → **Self-hosted** → 填 `https://vw.example.com`
- 手机 App → 设置 → **Self-hosted** 或登录页的"登录到自托管服务器"
- 浏览器扩展 → 扩展设置 → **Server URL**

改完再登录，密码就同步到你自己服务器了。

## 安全加固

密码管理器是单点故障——它丢了，你所有账号都暴露。加固值得花时间：

### 1. 启用 2FA

网页端 → **Settings → Security → Two-step login**，用 TOTP（Authenticator App）或 FIDO2 硬件密钥。

**主密码是唯一钥匙**——Vaultwarden 是零知识架构，服务器上只有加密后的数据，**主密码忘了没有任何办法恢复**。所以：

- 主密码要强，且要记住
- 2FA 建议开，但别用同一个设备存 TOTP 又存密码库
- **把主密码和恢复码写下来，放物理安全的地方**

### 2. 关注册 + 关邀请

```yaml
SIGNUPS_ALLOWED: "false"
INVITATIONS_ALLOWED: "false"     # 不打算加家人就关掉
```

### 3. fail2ban 防爆破

如果 Vaultwarden 直接暴露在公网（不走 Tunnel），一定要装 fail2ban。Docker 版要读容器日志：

```ini
# /etc/fail2ban/jail.local
[vaultwarden]
enabled = true
port = 80,443
filter = vaultwarden
logpath = /var/lib/docker/containers/*/*.log
maxretry = 5
bantime = 1h
```

走 Cloudflare Tunnel 的话，Cloudflare 的 WAF 和 Access 已经挡了绝大部分，fail2ban 可选。

### 4. 备份 data 目录

`./data` 里有 SQLite 数据库、附件、RSA 密钥。**RSA 密钥丢了，已有的加密数据解不开**——等于全丢。

```bash
# 停容器保证一致性
docker compose stop
tar czf vw-$(date +%F).tar.gz data/
docker compose start

# 同步到异地
rclone sync ./ r2:你的桶/vaultwarden-backup/
```

加进 cron 每天跑。完整方案见《自托管数据备份完全指南》。

### 5. 升级

```bash
docker compose pull
docker compose up -d
```

数据在卷里，升级不丢。Vaultwarden 升级频繁（跟 Bitwarden 协议走），建议每月看一眼 release。

## 从 1Password 迁移

### 1. 从 1Password 导出

1Password 8 桌面端 → 文件 → 导出 → 选 **CSV**。会导出一个 `.csv` 文件，含登录、密码、备注、URL。

**安全提醒**：CSV 是明文。导出后立刻用，用完删掉，别留在下载目录。

### 2. 导入 Bitwarden

网页端登录你的 Vaultwarden → **Tools → Import data** → 选 **1Password (csv)** → 上传文件。

导入前建议先建一个测试条目验证，再全量导。导入后检查：

- 密码数量对不对
- TOTP 有没有跟过来（1Password 的 2FA 在较新版本才支持导出）
- 附件（1Password 收费功能，免费用户一般没有）
- 自定义字段

### 3. 清理

确认 Vaultwarden 里一切正常、各设备同步完成后：

1. 删掉本地那个明文 CSV
2. 1Password 里删除数据（或直接退订）
3. **先别急着退订**——留一个月观察期，确认没有遗漏再退

### 4. 顺带检查的坑

- **1Password 的"Watchtower"** 监控的泄露密码，Bitwarden 也有（Reports → Data breach）
- **1Password 的共享家庭库**，Vaultwarden 用组织（Organization）功能，配置稍麻烦但免费版支持
- **浏览器自动填充**：Bitwarden 扩展的填充逻辑和 1Password 略有不同，头几天可能要多点两下

## 小结

Vaultwarden 是自托管里**回报最快**的应用之一：半小时部署完，从此每年省 $36，密码库归自己。

最关键的三个动作：**注册完关注册**、**主密码和恢复码放物理安全处**、**data 目录定期备份**。这三件做了，剩下的都是锦上添花。

如果想让家人都用上，Vaultwarden 免费支持组织功能，一个人管理全家密码——比买 1Password 家庭版还省心。

接着可以看《Pi-hole 全网广告拦截》把网络层也管起来，或者《自托管数据备份完全指南》把备份体系建好——密码库的备份优先级应该是你所有服务里最高的。
