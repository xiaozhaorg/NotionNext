---
title: Immich 自建相册：Google Photos 的完美替代，AI 自动分类人脸识别
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Immich 是开源自托管相册，AI 人脸识别、智能搜索、地图视图媲美 Google Photos。本文详解 Docker Compose 部署、手机自动备份、从 Google Photos 迁移、GPU 加速与备份策略。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/immich-photo-backup"
ogImage: "/images/immich-photo-backup-real.jpg"
coverAlt: "绿色电路板上密布的芯片与数据线特写"
enSlug: "immich-photo-backup"
---

手机相册大概是普通人最值钱的数字资产，也是被云服务绑得最死的一个。Google Photos 取消了免费无限存储，iCloud 每月收钱，还存在被扫一眼的隐私顾虑。

**Immich** 是目前最成熟的自托管相册方案：AI 人脸识别、按时间/地点/人物搜索、地图视图、手机自动备份，体验已经非常接近 Google Photos，而数据全在你自己硬盘上。

## Immich 能做什么

- **手机自动备份**：iOS / Android 官方 App，后台静默上传
- **AI 人脸识别**：自动聚类，按人物浏览
- **智能搜索**：CLIP 模型支持自然语言搜图（"海边的日落"）
- **地图视图**：按 EXIF GPS 信息在地图上呈现
- **格式支持全**：RAW、HEIC、Live Photo、视频
- **共享相册**：生成公开链接给朋友，可设过期时间
- **多用户**：家人各自账号，权限隔离

## 前置条件

Immich 用 Docker Compose 部署，需要机器上已经有 Docker 和 Compose 插件。没装的话先看《Docker Compose 入门到实战》或《Ubuntu Server 初始化配置》第六节。

硬件建议：

| 用途 | 最低 | 舒适 |
|---|---|---|
| 内存 | 2 GB | 4 GB 以上 |
| 存储 | 照片体积 × 2 | SSD 放数据库，HDD 放原图 |
| AI 识别 | CPU 慢跑 | 有 Intel/NVIDIA GPU 快十倍 |

## Docker Compose 部署

### 目录结构

```
/opt/immich/
├── .env
├── docker-compose.yml
└── upload/          # 照片实际存放位置
```

### `.env`

```bash
# 上传文件存放路径（容器内固定，改这个会丢数据）
UPLOAD_LOCATION=./upload

# 数据库密码，改成一个随机强密码
DB_PASSWORD=换成随机强密码
DB_DATABASE=immich
DB_USERNAME=postgres

# Redis
REDIS_PASSWORD=再换一个随机强密码

# Immich 版本标签，升级前先看 release note
IMMICH_VERSION=release
```

### `docker-compose.yml`

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION}
    restart: unless-stopped
    ports:
      - "2283:2283"
    volumes:
      - ./upload:/data
      - /etc/localtime:/etc/localtime:ro
    depends_on:
      redis:
        condition: service_started
      database:
        condition: service_healthy
    environment:
      DB_HOSTNAME: database
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: ${DB_DATABASE}
      REDIS_HOSTNAME: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      IMMICH_PUBLIC_REGISTER: "false"     # 关闭公开注册
      IMMICH_MACHINE_LEARNING_ENABLED: "true"

  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION}
    restart: unless-stopped
    volumes:
      - model-cache:/cache

  redis:
    image: redis:6.2-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}

  database:
    image: tensorchord/pgvecto-rs:pg14-v0.2.7
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}"]

volumes:
  model-cache:
  pgdata:
```

注意 `immich-server` 挂的是 `./upload`，对应 `.env` 里的 `UPLOAD_LOCATION=./upload`。**这个路径一旦开服就别再改**，改了 Immich 会认为所有照片都丢了。

### 启动

```bash
cd /opt/immich
docker compose up -d
docker compose logs -f immich-server    # 看启动日志
```

没有报错就可以访问 `http://服务器IP:2283`。

## 首次配置

**注册第一个账号**，这个账号就是管理员。

注册完立刻确认关闭注册——否则任何人都能往你的相册里传东西。在 `docker-compose.yml` 里已设 `IMMICH_PUBLIC_REGISTER: "false"`，重启后新用户就注册不了。要加家人账号，由管理员在网页端手动创建。

**存储模板**：设置 → 存储模板，选一个和现有文件夹结构匹配的模板（比如 `{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}`）。这个决定导入的照片怎么归档，一次设好省得后面乱。

**机器学习设置**：开启智能搜索和人脸识别。CPU 跑第一遍全库扫描会比较久，几万张照片大概几小时，之后增量就快了。

**库扫描**：如果 `upload/` 里已经有旧照片，点"库扫描"让 Immich 索引它们。

## 手机端配置

App Store / Google Play 搜 Immich 官方 App。

**连接服务器**：填 `http://服务器IP:2283` 或你的域名。只在家庭网内用填 IP 就行；想在外面也能备份，需要配域名 + 反向代理，或者用 Cloudflare Tunnel 把服务暴露出去（见《Cloudflare Tunnel 免费内网穿透》）。

**开启后台自动上传**：Android 在 App 设置里开"后台相册备份"；iOS 受系统限制，见下一节。

**相册选择**：默认备份相机胶卷，可以勾选"排除截图"之类的文件夹。

### iOS 的后台限制

iOS 对后台任务管得严，Immich 在后台可能被系统挂起。实测经验：

- 打开 App 时上传最可靠，系统一般给几分钟窗口
- 关掉 iOS 的"后台 App 刷新"反而更稳——刷新会唤醒 App 但很快又被杀，反复启动更耗电
- 照片多的时候，第一次备份建议插着电、开着 App 放一晚

这是 iOS 的系统限制，不是 Immich 的问题，所有同类 App 都一样。

## 从 Google Photos 迁移

### 第一步：Google Takeout 导出

浏览器登录，访问 `takeout.google.com`。**只勾选 Google Photos**，别整个账号打包——那会大到离谱。

格式选"单个压缩包"，每个 2 GB 或 10 GB 都行。导出完成后下载，一个相册一个压缩包。

### 第二步：导入 Immich

最省事的做法：把压缩包解开到服务器的 `upload/` 目录下，然后在网页端点"库扫描"。

```bash
# 在服务器上
mkdir -p /opt/immich/upload/takeout
# 把下载的 zip 传上去后解压
cd /opt/immich/upload/takeout
unzip "*.zip"
```

解压后 Google Takeout 会带一堆 `.json` 伴随文件（存着拍摄时间、EXIF、地点）。**这些 json 别删**，Immich 靠它们恢复原始的拍摄时间和 GPS 信息，否则所有照片的日期会变成导入那天。

扫描完确认一下：随机抽几张老照片，看拍摄时间对不对、地图视图有没有点位。

## 备份策略

照片是**不可再生**的资产，手机丢了能买，照片丢了就真没了。Immich 本身有数据库和文件两层，都要备份。

### 1. 本地镜像到外部硬盘

```bash
# 挂上外部硬盘后
rsync -av --delete /opt/immich/upload/ /mnt/backup/immich-upload/
```

`--delete` 会同步删除，确认硬盘挂对了再用。建议每周一次，写进 cron。

### 2. 异地副本到对象存储

本地备份防硬盘坏，异地备份防火灾水灾。Backblaze B2、Cloudflare R2、阿里云 OSS 都行，用 rclone 同步：

```bash
rclone sync /opt/immich/upload r2:你的桶名/immich-upload \
  --transfers 8 --checksum
```

R2 有 10GB 免费额度，小规模相册基本不花钱。详细配置见《Cloudflare R2 对象存储完全指南》。

### 3. 数据库备份

照片文件 rsync 就行，但人脸聚类、标签、用户信息在 PostgreSQL 里，也要定期dump：

```bash
docker compose exec database pg_dump \
  -U postgres -d immich | gzip > /opt/immich/backup/db-$(date +%F).sql.gz
```

**遵循 3-2-1 原则**：3 份副本、2 种介质、1 份异地。做到这三条，照片数据就基本不可能丢了。

## 性能优化：GPU 加速

人脸识别和 CLIP 搜索默认跑 CPU，几万张照片要跑很久。有 GPU 的话快一个数量级。

### NVIDIA（CUDA）

宿主机装好 NVIDIA Container Toolkit，然后改 `immich-machine-learning` 服务：

```yaml
  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION}
    restart: unless-stopped
    volumes:
      - model-cache:/cache
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Intel（OpenVINO）

核显也能用，加一段设备映射：

```yaml
    devices:
      - /dev/dri:/dev/dri
```

并在环境变量里设 `MACHINE_LEARNING_WORKERS=1`（核显并发别开高）。

### macOS（CoreML）

Apple 芯片自动走 Core ML，不用额外配置，装完就比 CPU 快不少。

### 降低后台扫描频率

机器学习设置里，把"定时扫描"改成"不频繁"。相册不会天天大变，每天跑一次足够，还能省电。

## Immich 和其他方案对比

| | Immich | Google Photos | Nextcloud Photos | PhotoPrism |
|---|---|---|---|---|
| 费用 | 免费 | 超量收费 | 免费 | 免费 |
| 人脸识别 | 有，效果好 | 有 | 插件，一般 | 有 |
| 自然语言搜图 | 有（CLIP） | 有 | 无 | 有限 |
| 手机 App | 官方，体验好 | 官方 | 官方 | 无官方 |
| 地图视图 | 有 | 有 | 插件 | 有 |
| 资源占用 | 中等 | — | 较重 | 中等 |
| 多用户 | 完善 | 完善 | 完善 | 有限 |

选型建议：要 Google Photos 的完整体验选 **Immich**；已经有一套 Nextcloud 想顺带用，选 Nextcloud Photos；机器配置很差、只想要个能看的图库，选 PhotoPrism。

## 小结

Immich 是目前自托管相册的最优解，没有之一。部署本身半小时的事，真正花时间的是首次全库扫描和从 Google Photos 导出迁移——后者取决于你有多少照片。

装好之后记得做两件事：**关掉公开注册**、**配上备份**。前者防陌生人，后者防硬盘坏。相册这东西，丢一次就够后悔一辈子。
