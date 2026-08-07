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
---

![image](https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-8141-a5ba-e4bb8ee56188&q=50&width=1080&fmt=webp&fm=webp)

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

[上一篇Jellyfin 影音库搭建指南：

Plex 免费替代，4K 硬解全平台](/article/jellyfin-media-server)[下一篇Hi！

欢迎访问本站！](/article/hi-welcome)

[下一篇Hi！

欢迎访问本站！](/article/hi-welcome)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/immich-photo-backup](https://xiaozha.org/article/immich-photo-backup)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步![image](https://xiaozha.org/images/mineradio-tutorial-cover.jpg?t=3acc55d5-e9ea-8103-b388-c846fa950c37)](/article/mineradio-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)
