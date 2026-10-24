---
title: NAS 折腾指南：从硬件选购到系统搭建，打造你的家庭数据中心
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 手把手 DIY 一台 NAS：两档硬件选购清单、TrueNAS/Unraid/OMV 系统对比与安装、ZFS 存储池配置、Cloudflare Tunnel 远程访问、影音库与照片备份方案。
author: 小吒
tags:
  - 教程
  - 免费工具
draft: false
sourceUrl: "https://xiaozha.org/article/nas-diy-guide"
ogImage: "/images/nas-diy-guide-real.jpg"
coverAlt: "服务器机房中排列整齐的机柜与网络设备"
enSlug: "nas-diy-guide"
---

网盘限速、相册要钱、电影没地方放——攒一台自己的 NAS，这些问题一次解决。数据在自己硬盘上，没有订阅费，没有容量焦虑。

这篇从硬件选购讲到系统安装和常用应用，照着走能搭出一台可用的家庭数据中心。

## 一、硬件选购

NAS 的核心是**硬盘**，主机反而是次要的。两档配置覆盖绝大多数需求：

### 入门级（2000 元内）

适合：存照片、备份、轻量影音

| 部件 | 推荐 |
|---|---|
| 主板 | J4125 / N100 集成板（低功耗，待机 10W 左右） |
| 内存 | 8GB DDR4 |
| 硬盘 | 2 × 4TB（组镜像，实际可用 4TB） |
| 机箱 | 4 盘位 |
| 电源 | 120W 足够 |

**这一档的关键是省电。** N100 整机待机 10-15W，一年电费几十块，可以 24 小时开机。

### 进阶级（5000 元）

适合：影音库、多用户、虚拟机、跑 Docker 全家桶

| 部件 | 推荐 |
|---|---|
| CPU | i3-12100 / i5-12400（带核显，硬件转码用得上） |
| 主板 | B660 ITX / mATX |
| 内存 | 16GB DDR4（跑虚拟机能上 32GB） |
| 硬盘 | 1 × 500GB SSD（系统）+ 4 × 8TB（数据） |
| 机箱 | 6-8 盘位 |
| 电源 | 300-450W |

### 几个容易忽略的点

- **硬盘别省钱**：NAS 盘（西数红盘/酷狼、希捷酷狼）比桌面盘贵一点，但 firmware 针对 7×24 优化，值得
- **ECC 内存看需求**：ZFS 建议上 ECC，但家用非必须，别为此多花一倍钱
- **网口至少 1G**：有 2.5G 更好，内网传片子快一倍
- **UPS 值得买**：几百块的入门 UPS，断电时自动关机，救过无数人的 ZFS
- **机箱风道**：4 块以上硬盘发热可观，风道差的机箱硬盘寿命明显短

## 二、系统选择

四个主流方案，按需求选：

| 系统 | 特点 | 难度 | 费用 |
|---|---|---|---|
| **TrueNAS Scale** | ZFS 文件系统，快照/校验强，Docker/K8s | 中 | 免费 |
| **Unraid** | 硬盘灵活扩容， parity 保护，应用市场 | 中 | 付费（$59 起） |
| **OpenMediaVault** | 轻量，基于 Debian，插件够用 | 低 | 免费 |
| **群晖 DSM** | 易用，生态全，套件丰富 | 低 | 需买硬件 |

### 怎么选

- **要数据完整性优先、愿意学一点**：TrueNAS Scale。ZFS 的快照和校验是家庭数据最靠谱的保护
- **要硬盘随时加、不想规划**：Unraid。一块一块加盘，不用重建阵列，这是它最大卖点
- **只想简单存文件、当网盘用**：OpenMediaVault。装完配置 SMB 就能用
- **完全不想折腾**：群晖。花钱买省心

**我的建议：想认真玩选 TrueNAS Scale，想省心选群晖，别选 Unraid 除非你确定需要它那个扩容模式。**（Unraid 付费，而且单盘损坏时重建比 ZFS 慢得多。）

这篇以 TrueNAS Scale 为主线。

## 三、TrueNAS Scale 安装

### 准备

去官网下载 Scale 版 ISO，用 Rufus 或 balenaEtcher 写入 U 盘。

**重要**：安装盘会被格式化，确认 U 盘里没东西。

### 安装步骤

1. U 盘启动，选 **Install/Upgrade**
2. 选目标盘——**装系统的 SSD**，别选错成数据盘
3. 设 root 密码（记住它）
4. 装完重启，拔 U 盘，`TrueNAS` 会打印一个 IP 地址

### 配置 ZFS 存储池

浏览器访问那个 IP，用 root 登录。

**Storage → Create Pool**：

- **Name**：`tank`（ZFS 传统命名，随意）
- **Layout**：家用选 `RAIDZ1`（4 块盘容忍坏 1 块）或 `Mirror`（2 块盘互相镜像）

**RAIDZ1 和 Mirror 的选择**：

| 盘数 | RAIDZ1 可用 | Mirror 可用 |
|---|---|---|
| 4 × 8TB | 24TB（坏 1 块不丢） | 16TB（坏 1 块不丢） |

**要容量选 RAIDZ1，要速度和安全冗余选 Mirror。** 家庭影音库通常选 RAIDZ1。

- **加密**：建议开。硬盘丢了数据不泄露
- **去重/压缩**：默认即可，压缩开 LZ4（几乎免费的速度换容量）

### 创建数据集

Pool 建好后，**Storage → Create Dataset**：

- `media` —— 影音文件
- `photos` —— Immich 照片
- `backups` —— 各服务备份
- `documents` —— 文档

分数据集的好处：可以给不同数据集设不同的快照策略和配额。

### 启用共享

**Shares → Windows (SMB) Share**：

- Path 选刚建的数据集
- 开 `Allow Guest Access` 或建本地用户
- Name 起个 `media`

Windows 上 `\\NAS的IP\media` 就能访问，Mac 上 Finder → 连接服务器 `smb://NAS的IP`。

## 四、远程访问：Cloudflare Tunnel

在外网访问家里的 NAS，**最不推荐的做法是端口映射**——等于把 NAS 挂到公网扫描器脸上。

**Cloudflare Tunnel** 不开放任何入站端口，NAS 主动向外建立加密通道：

```bash
# TrueNAS Scale 里跑（或用 Docker）
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

cloudflared tunnel login
cloudflared tunnel create nas
cloudflared tunnel route dns nas nas.example.com
```

`config.yml`：

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: nas.example.com
    service: http://localhost:80        # TrueNAS Web UI
  - service: http_status:404
```

**配合 Cloudflare Access**，要求邮箱验证才能进管理界面——这是家用 NAS 该有的安全水位。

需要更深的隔离（比如 NAS 和手机组成私有网络，不经过公网），用 **Tailscale**。两个方案的完整对比见《Tailscale vs Cloudflare Tunnel》。

## 五、影音库与照片

NAS 装 TrueNAS 只是开始，真正好用靠应用。

### Jellyfin —— 媒体服务器

把电影、剧集、音乐集中管理，全平台播放，硬件转码免费。配置见《Jellyfin 影音库搭建指南》。

```yaml
# TrueNAS Scale 的 Docker/Apps 里部署
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    restart: unless-stopped
    ports: ["8096:8096"]
    volumes:
      - /mnt/tank/media:/media
      - /mnt/tank/apps/jellyfin:/config
    devices:
      - /dev/dri:/dev/dri     # 核显硬解
```

### qBittorrent —— 下载

Linux 下最好用的 BT 客户端，有 Web UI：

```yaml
services:
  qbittorrent:
    image: linuxserver/qbittorrent:latest
    restart: unless-stopped
    ports: ["8080:8080"]
    volumes:
      - /mnt/tank/downloads:/downloads
      - /mnt/tank/apps/qbit:/config
```

### Immich —— 照片备份

Google Photos 的开源替代，手机自动备份 + AI 人脸识别。**这是 NAS 最值得装的应用之一**，配置见《Immich 自建相册》。

### Jellyseerr —— 追剧管理

配合 Jellyfin，管理"想看"清单，自动请求下载。多人家庭用很合适。

## 六、必备 Docker 应用

TrueNAS Scale 自带 Kubernetes/Docker 能力，除了上面这些，还推荐：

| 应用 | 用途 | 参考 |
|---|---|---|
| **Uptime Kuma** | 监控 NAS 和服务状态，挂了能知道 | 《Uptime Kuma 自建监控》 |
| **Vaultwarden** | 自托管密码管理器 | 《Vaultwarden 自托管密码管理器》 |
| **Pi-hole** | 全家广告拦截 | 《Pi-hole 全网广告拦截》 |
| **Mealie** | 家庭菜谱 + 购物清单 | 《Mealie 自建菜谱应用》 |
| **n8n** | 工作流自动化 | 《n8n 自托管工作流自动化》 |

一台 N100 + 8GB 的小主机，跑完上面全部还有余量。

### 用 Docker Compose 管理

TrueNAS Scale 的 Apps 界面偏简陋，建议直接用 Compose：

```bash
mkdir -p /mnt/tank/apps && cd /mnt/tank/apps
# 每个应用一个目录，各自 docker-compose.yml
mkdir jellyfin qbittorrent immich
cd jellyfin && nano docker-compose.yml && docker compose up -d
```

备份也简单——整个 `apps` 目录 tar 一份，配合 Restic 同步到 R2，方案见《自托管数据备份完全指南》。

## 七、备份：NAS 不是备份

最后说最容易被忽略的。

**NAS 的 RAID/ZFS 保护的是"硬盘损坏"，不是"数据丢失"。** 误删、勒索软件、火灾水灾、熊孩子拔线——这些 RAID 一个都防不住。

家庭 NAS 的备份策略：

1. **ZFS 快照**：TrueNAS 里配自动快照任务，每小时/每天一份，保留 30 天。误删文件从快照恢复
2. **关键数据异地**：照片、文档同步到 Cloudflare R2 或 Backblaze B2
3. **3-2-1 原则**：3 份副本、2 种介质、1 份异地

```bash
# 用 Restic 备份 NAS 上的关键数据到 R2
restic -r s3:https://<account-id>.r2.cloudflarestorage.com/nas-backup \
  backup /mnt/tank/photos /mnt/tank/documents /mnt/tank/apps \
  --tag nightly
```

完整方案包括加密、保留策略、恢复演练，见《自托管数据备份完全指南》。

## 小结

搭 NAS 的投入产出比很高：两千块的小主机，解决存储、备份、影音、照片四大需求，还没有订阅费。

建议的推进顺序：

1. 先装 TrueNAS + 硬盘，把 SMB 共享用起来（半小时）
2. 配自动快照（十分钟，但最关键）
3. 装 Immich，手机照片开始自动备份
4. 装 Jellyfin，把散落的电影收进来
5. 按需加其他 Docker 应用
6. **最后配异地备份**——别跳这步

硬件会过时，但你存在上面的照片和文档不会。数据安全这件事，装完系统第一天就该做，而不是等硬盘响了才想起来。
