---
title: Immich 自建相册：Google Photos 的完美替代，AI 自动分类人脸识别
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Immich 是开源的自托管相册应用，AI 自动分类、人脸识别、地图视图，是 Google Photos 的最佳替代品，本文详解部署使用。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/immich-photo-backup"
ogImage: "/images/immich-photo-backup-real.jpg"
coverAlt: "绿色电路板上密布的芯片与数据线特写"
enSlug: "immich-photo-backup"
---

![image](/images/remote/1518770660439-4636190af475.webp)

Immich 是 GitHub 上最火的自托管相册项目，AI 能力媲美 Google Photos。

一、核心功能
- 自动备份手机照片
- AI 人脸识别
- 智能搜索（按时间、地点、人物）
- 地图视图
- RAW/HEIC 支持
- 共享相册

### 二、Docker 部署`docker-compose.yml`：

三、首次配置
- 访问 `http://your-server:2283`
- 创建管理员账户
- 关闭注册（`IMMICH_PUBLIC_REGISTER=false`）
- 下载手机 APP，配置服务器地址

### 四、性能优化
- 使用 SSD 存储照片
- GPU 加速 AI 识别（可选）
- 定期清理缩略图缓存

### 五、备份策略
- 3-2-1 备份原则
- 定期 rsync 到外部硬盘
- 上传到 Backblaze B2 / 阿里云 OSS

[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg)](/article/claude-code-tutorial)[Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步![image](https://xiaozha.org/images/mineradio-tutorial-cover.jpg)](/article/mineradio-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg)](/article/winget-windows-tools)
