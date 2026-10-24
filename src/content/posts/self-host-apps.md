---
title: 自托管 20 个必备开源应用：告别云服务订阅，掌控自己的数据
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 精选 20 个最值得自托管的开源应用，按笔记、网盘、影音、密码、自动化、监控、同步、协作、书签九大类，替代 Evernote、Dropbox、Netflix、Spotify、1Password、Zapier 等付费服务。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/self-host-apps"
ogImage: "/images/self-host-apps-real.jpg"
coverAlt: "办公桌上笔记本电脑与数据图表的工作场景"
enSlug: "self-host-apps"
---

云服务越来越贵，隐私越来越让人不放心。Netflix、Spotify、iCloud、Dropbox、1Password、Notion——随便几个加起来一年就是上千块，而数据还不在自己手里。

自托管是另一个选项：在自己机器上跑这些服务的开源替代品。这篇按类别整理 20 个最值得装的，每个都说明它替代谁、解决什么问题、以及适合什么场景。

## 为什么值得自托管

- **省钱**：一个 2 核 8G 的小主机或 5 美元/月的 VPS，能跑完这篇里所有应用
- **数据自主**：照片、笔记、密码在自己硬盘上，不担心服务商扫一眼或突然改条款
- **不会被下架**：服务商说关就关的日子，自托管的软件只要你自己维护就能一直跑

代价是你的时间——更新、备份、排错都得自己来。但按月算，一个配置良好的自托管栈大概每月花一两个小时维护。

## 一、笔记 & 文档（替代 Evernote、OneNote、Notion）

### Joplin — 替代 Evernote / OneNote

Markdown 笔记，端到端加密同步，全平台客户端（含移动端）。数据存自己定的位置（WebDAV、S3、本地），不怕厂商倒闭。适合个人知识管理。

### Trilium — 替代 Notion / Obsidian

层级笔记，支持在笔记之间嵌入关系图。本地优先，单文件部署，导出格式开放。适合需要结构化整理大量资料的人。

### AppFlowy — 替代 Notion（团队 workspace）

Notion 的开源平替，数据库 + 文档 + 看板。界面现代，适合小团队协作。仍在活跃开发，功能还没 Notion 全，但核心够用。

## 二、网盘 & 文件（替代 Dropbox、Google Drive）

### Nextcloud — 替代 Google Drive / iCloud

功能最全的自托管网盘：文件同步、共享链接、日历、联系人、在线文档。插件生态庞大。缺点是资源占用偏高，小机器上要注意。

### Seafile — 替代 Dropbox（性能优先）

同步速度快、历史版本做得干净，类似 Dropbox 的体验。比 Nextcloud 轻，但功能也少一些，专注做文件同步这一件事。

### FileBrowser — 轻量文件管理

一个 Web 界面管理服务器上的文件，能上传下载、分享链接。极轻量，适合只想"能用浏览器访问服务器文件"的场景。

## 三、影音 & 媒体（替代 Netflix、Spotify、Google Photos）

### Jellyfin — 替代 Plex / Netflix

完全免费的家庭影音库，无账号要求，硬件转码开箱即用（Intel Quick Sync、NVIDIA NVENC）。Plex 收费之后大部分人流都到这儿了。详细配置见《Jellyfin 影音库搭建指南》。

### Navidrome — 替代 Spotify

Subsonic 兼容的音乐服务器，资源占用极小，界面清爽。适合把本地音乐库用手机随时听。

### Immich — 替代 Google Photos

AI 相册，人脸识别 + 自然语言搜图 + 手机自动备份，是目前最像 Google Photos 的自托管方案。详细配置见《Immich 自建相册》。

### PhotoPrism — 相册管理（另一选择）

AI 标签 + EXIF 元数据支持好，适合有大量 RAW 照片要归档的人。比 Immich 轻，但没有官方手机 App，主打"管理"而非"备份"。

## 四、密码 & 安全（替代 1Password、LastPass）

### Vaultwarden — 替代 1Password / Bitwarden 云

Bitwarden 服务端的 Rust 实现，兼容官方所有客户端，资源占用只有原版的几分之一。**这是自托管里回报最快的一个应用**——一台机器跑起来，全家的密码都归自己管。详细配置见《Vaultwarden 自托管密码管理器》。

### Passbolt — 团队密码共享

面向团队的密码管理，带权限审计和分享审批流。适合需要把服务器密码分给不同成员、又不想共用一个账号的小团队。

## 五、工作流自动化（替代 Zapier、IFTTT）

### n8n — 替代 Zapier / Make

可视化工作流，几百个节点，能自托管。把不同应用连起来：收到邮件 → 存数据库 → 推 Telegram。数据流过自己机器，不用担心 API 密钥泄露给第三方。详细配置见《n8n 自托管工作流自动化》。

### Node-RED — 替代 IFTTT（物联网 / 硬件）

IBM 出的流式编程工具，强项是接硬件：传感器、GPIO、MQTT。玩树莓派、智能家居首选。

### Huginn — 替代 IFTTT（RSS 监控）

监控网页变化、RSS 更新，触发动作。适合"盯某个页面什么时候更新"这类需求。

## 六、监控 & 面板（替代 UptimeRobot、Datadog）

### Uptime Kuma — 替代 UptimeRobot / StatusPage

自托管监控，HTTP / TCP / Ping / DNS 检查，配告警推送（Telegram、Server酱、钉钉等）。界面漂亮，单容器部署，五分钟搞定。**建议第一个装的就是它**——服务挂了能第一时间知道。详细配置见《Uptime Kuma 自建监控》。

### Grafana + Prometheus — 替代 Datadog 面板

监控界的事实标准。Prometheus 采数据，Grafana 画图。学习曲线陡一点，但能看历史趋势、自定义告警规则。适合服务多起来之后。

## 七、文件同步（替代 Dropbox / 群晖 Drive）

### Syncthing — 替代 Dropbox 同步

P2P 文件同步，没有中心服务器，设备之间直接传。极轻量，适合在笔记本、手机、家庭服务器之间同步文件，不需要 Web 界面和分享链接的场景。

和 Nextcloud 的分工：要 Web 界面和分享链接用 Nextcloud，只要"文件在几个设备间自动一致"用 Syncthing。

## 八、团队协作（替代 Slack、Notion、Confluence）

### Mattermost — 替代 Slack / Teams

自托管团队聊天，频道、私信、文件分享全有。适合对数据合规有要求、不能把聊天记录放第三方的小团队。

### Outline — 替代 Notion / Confluence

团队知识库，Markdown 编辑器，权限管理细致。界面干净，写文档的体验比 Confluence 好得多。

## 九、书签 & 稍后读（替代 Pocket、Raindrop）

### Linkwarden — 替代 Pocket / Raindrop.io

自托管书签管理，自动抓取网页快照（防止原页面失效），支持标签、收藏夹、团队共享。

### Wallabag — 稍后读

把网页文章存下来离线读，去广告、重排版。Pocket 的开源替代。

## 组合起来的建议顺序

如果上面看着眼花了，按这个顺序装，回报最快：

1. **先装监控和密码**：Uptime Kuma + Vaultwarden，都是单容器，装完立刻有收益
2. **再上影音三件套**：Jellyfin + Navidrome + Immich，替代掉你最贵的几个订阅
3. **替换工作区**：Nextcloud 管文件，Joplin 或 Trilium 管笔记
4. **最后玩自动化**：n8n 把有数据的应用串起来

一台 2 核 8G 的小主机或 5 美元/月的 VPS，用 Docker Compose 就能跑完这 20 个。真正的成本只有时间——换来的是退掉的订阅、在自己硬盘上的数据，和不会被收回的软件。

## 部署相关

- 《Docker Compose 入门到实战》：从安装到生产最佳实践
- 《Ubuntu Server 初始化配置》：新服务器必做的十件事
- 《Cloudflare Tunnel 免费内网穿透》：不开放端口把服务暴露到公网
- 《Cloudflare 国内加速实战》：国内访问优化

祝自托管愉快 🐳
