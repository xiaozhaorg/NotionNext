---
title: Jellyfin 影音库搭建指南：Plex 免费替代，4K 硬解全平台
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Jellyfin 是完全免费开源的媒体服务器。本文详解 Docker 部署、媒体库配置、TMDB 元数据刮削、Intel/NVIDIA/AMD 硬件转码、全平台客户端、Cloudflare Tunnel 远程访问与命名规范。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/jellyfin-media-server"
ogImage: "/images/jellyfin-media-server-real.jpg"
coverAlt: "客厅电视屏幕上播放电影的温馨场景"
enSlug: "jellyfin-media-server"
---

Jellyfin 是完全免费开源的媒体服务器，是 Plex 和 Emby 的最佳替代品。没有账号要求、没有功能墙、没有广告，转码和多平台客户端全都有。

这篇从部署讲到硬件转码调优——那是 Jellyfin 体验的分水岭。

## 为什么选 Jellyfin 而不是 Plex

Plex 免费版在 2025 年的涨价和远程播放收费，把大量用户推到了 Jellyfin：

| | Jellyfin | Plex 免费版 |
|---|---|---|
| 费用 | 完全免费 | 远程播放/硬件转码要 Plex Pass |
| 账号 | 不需要 | 必须注册 |
| 追踪 | 无 | 有 |
| 硬件转码 | 免费 | 付费功能 |
| 客户端 | 全平台官方 | 全平台，TV 端更强 |
| 元数据刮削 | TMDB 等 | 自家数据库，更全 |

**Plex 的优势**在 TV 端客户端更成熟、元数据更准。但如果你主要在自己设备上看、不想被收费墙卡住，Jellyfin 是更合理的选择。

## Docker 部署

### 目录结构

```
/opt/jellyfin/
├── docker-compose.yml
├── config/          # Jellyfin 配置和数据库
└── media/
    ├── movies/
    ├── tv/
    └── music/
```

### `docker-compose.yml`

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    ports:
      - "8096:8096"
    volumes:
      - ./config:/config
      - ./media:/media
      - /etc/localtime:/etc/localtime:ro
    environment:
      - JELLYFIN_PublishedServerUrl=http://你的服务器IP:8096
```

**硬件转码版本**需要额外挂载渲染设备，见下文。

### 启动

```bash
cd /opt/jellyfin
docker compose up -d
```

访问 `http://服务器IP:8096`。

## 初始配置向导

**第一步：创建管理员账号。** 这个账号能管理一切，密码设好。

**第二步：添加媒体库。** 内容类型选对很重要——选 `Movies` 会按电影刮削，选 `Shows` 会按剧集刮削，选错会导致元数据一团糟。文件夹填容器内路径 `/media/movies`、`/media/tv`。

**第三步：语言和地区。** 元数据语言选 `Chinese` 优先， country 选 `China`，这样刮削器会优先找中文标题和简介。

**第四步：远程访问。** 先跳过，最后单独配（见下文远程访问）。

## 媒体库配置

### 电影

文件夹按"一部电影一个目录"组织，Jellyfin 认这个结构：

```
media/movies/
├── 肖申克的救赎 (1994)/
│   └── The.Shawshank.Redemption.1994.1080p.BluRay.x264.mkv
├── 星际穿越 (2014)/
│   └── Interstellar.2014.2160p.UHD.BluRay.x265.mkv
```

**文件名带年份**是关键——`肖申克的救赎 (1994)` 比 `肖申克的救赎` 刮削成功率高得多。

### 剧集

```
media/tv/
└── 绝命毒师 (2008)/
    ├── Season 01/
    │   ├── Breaking.Bad.S01E01.1080p.mkv
    │   ├── Breaking.Bad.S01E02.1080p.mkv
```

`Season 01` 和 `S01E01` 这种命名是行业标准，Jellyfin 和所有刮削器都认。

### 音乐

```
media/music/
└── 周杰伦/
    └── 叶惠美 (2003)/
        ├── 01 - 以父之名.flac
```

音乐库走的是另一套元数据源（MusicBrainz），命名规范宽松些，但有"歌手/专辑/曲目"三层结构体验最好。

## 元数据刮削

Jellyfin 默认用几个刮削器，推荐主力配 TMDB（电影电视剧数据最全、更新最快）。

**配置步骤**：

1. Dashboard → Libraries → 点你的库 → Manage Library
2. **Metadata downloaders**：把 TheMovieDB 拖到最上面，禁用不靠谱的
3. **TMDB API Key**：免费申请，去 [themoviedb.org](https://www.themoviedb.org/settings/api) 注册后拿
4. 勾选 **Save artwork into media folders**——海报和背景图存到媒体目录旁边，换机器不用重下
5. **Language** 优先 `Chinese`

### 单个条目重新刮削

某个条目识别错了，进条目详情 → 右上角 **⋯ → Identify**，手动搜正确的标题。比删库重扫快得多。

### NFO 文件（本地元数据）

如果你在别处（比如 Emby、Kodi）已经整理好了元数据，把 `.nfo` 文件放到媒体旁边，Jellyfin 会优先读本地文件，不去网上刮。适合精心整理过的收藏。

## 硬件转码

这是 Jellyfin 体验的核心。**没有硬解，4K HEVC 在手机上基本播不动**；有硬解，N100 这种百元小主机都能同时转两三路 1080p。

### 在容器里启用

Docker 部署要额外挂载渲染设备：

**Intel Quick Sync（核显，最推荐）**

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    devices:
      - /dev/dri:/dev/dri          # 挂载渲染节点
    volumes:
      - ./config:/config
      - ./media:/media
    group_add:
      - "109"                       # render 组 GID，用 getent group render 查
```

**NVIDIA（独显）**

宿主机先装 NVIDIA Container Toolkit，然后：

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu,video,utility]
```

**AMD**

```yaml
    devices:
      - /dev/dri:/dev/dri
```

### 在 Jellyfin 里开启

Dashboard → **Playback** → **Transcoding**：

- **Hardware acceleration**：Intel 选 `Intel QuickSync (QSV)`，NVIDIA 选 `NVIDIA NVENC`，AMD 选 `AMD AMF`
- **Enable hardware decoding for**：勾上 `H264`、`HEVC`、`AV1`（按你的片源）
- **Throttling**：开启，避免转码吃满 CPU

### 验证硬解真的在工作

播放一个 4K 视频，转到低画质，然后看 Dashboard → **Playback** 里的转码信息：

```bash
# Intel 生效时能看到
hwaccel: qsv

# NVIDIA
hwaccel: nvenc
```

如果显示 `hwaccel: none`，说明设备没挂对，转码还在吃 CPU。

## 客户端

| 平台 | 客户端 |
|---|---|
| Web | 内置，浏览器直接访问 |
| iOS | Jellyfin Mobile（App Store） |
| Android | Jellyfin for Android |
| Android TV / Fire TV | Jellyfin for Android TV |
| Apple TV | Swiftfin 或 Infuse |
| 桌面 | Jellyfin Media Player |

**手机端**装官方 App 就行，能投屏、能下载离线看。

**TV 端**是体验重点。Jellyfin for Android TV 免费好用；Apple TV 上 Swiftfin 是开源原生客户端，Infuse 画质和界面更好但要付费。

## 远程访问

### 方案 A：反向代理

用 Caddy 最简单，自动 HTTPS：

```caddy
jellyfin.example.com {
    reverse_proxy localhost:8096
}
```

需要域名已经解析到服务器，且 80/443 端口没被墙。

### 方案 B：Cloudflare Tunnel（推荐）

没有公网 IP、不想开端口、或者端口被运营商封了，用 Tunnel：

```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# 登录并创建隧道
cloudflared tunnel login
cloudflared tunnel create jellyfin
cloudflared tunnel route dns jellyfin jellyfin.example.com
```

`config.yml`：

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: jellyfin.example.com
    service: http://localhost:8096
  - service: http_status:404
```

```bash
sudo cloudflared service install
```

家里网不用开任何端口，外面就能看。详细配置见《Cloudflare Tunnel 免费内网穿透》。

## 实用技巧

### 命名规范

最重要的两条：**电影带年份**、**剧集用 `S01E01` 格式**。做到这两条，刮削成功率 95% 以上，剩下的手动 Identify 补。

### 字幕

Jellyfin 不自动下字幕，但支持外挂字幕文件。把 `.srt` / `.ass` 和视频放同目录、同名，播放时自动加载。

需要自动下载字幕可以装 bazarr（Sonarr 生态那个），或者用 OpenSubtitles 插件。

### 整理好的收藏导出

如果你用 Kodi 或 Emby 整理过元数据，把 `.nfo` 和图片一起拷过来，Jellyfin 会直接复用，省去重新刮削。

## Jellyfin vs Plex vs Emby

| | Jellyfin | Plex | Emby |
|---|---|---|---|
| 费用 | 免费 | 部分功能付费 | 部分功能付费 |
| 硬件转码 | 免费 | Premiere | Premiere |
| 账号 | 不需要 | 需要 | 需要 |
| TV 客户端 | 好 | **最好** | 好 |
| 元数据 | TMDB | 自家，最全 | 自家 |
| 插件生态 | 丰富 | 丰富 | 丰富 |
| 中文支持 | 好 | 好 | 好 |

**选 Jellyfin**：不想付费、要硬件转码、能接受 TV 端稍微差一点。
**选 Plex**：愿意为最好的 TV 体验和元数据付钱。
**选 Emby**：介于两者之间，但社区已经很小了。

## 小结

Jellyfin 的核心价值：**免费获得 Plex 八成体验**。硬件转码这个 Plex 收费的功能它白给，而这是自建影音库能不能用的关键。

部署本身半小时，真正花时间的是整理媒体文件命名——这部分没有捷径，但一次做好以后永久受益。

配好之后，把《Cloudflare Tunnel 免费内网穿透》也看了，你的影音库就能在任何地方看了。存储不够的话，大盘子可以接《Cloudflare R2 对象存储》做冷备份。
