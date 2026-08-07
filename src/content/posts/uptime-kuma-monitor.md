---
title: Uptime Kuma 自建监控：免费替代 UptimeRobot，漂亮又强大
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Uptime Kuma 自托管监控工具，支持 HTTP、TCP、Ping、DNS 等多种监控类型，漂亮 UI + 告警通知，免费替代 UptimeRobot。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/uptime-kuma-monitor"
ogImage: "/images/uptime-kuma-monitor-real.jpg"
---

![image](https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-81a5-aa0f-d18e601cfd94&q=50&width=1080&fmt=webp&fm=webp)

Uptime Kuma 是一款漂亮的自托管监控工具，GitHub 60k+ Stars。

一、核心功能
- 多种监控类型（HTTP、TCP、Ping、DNS、推送等）
- 漂亮的实时状态页
- 多渠道告警（邮件、微信、Telegram、Slack、Discord 等 90+ 渠道）
- SSL 证书过期提醒
- 状态码、响应时间监控
- 多语言支持

### 二、Docker 部署启动：

访问 `http://localhost:3001`，创建管理员账户。

三、添加监控项
- 点击 "Add New Monitor"
- 选择类型（HTTP(s)、TCP、Ping 等）
- 填写目标 URL
- 配置心跳间隔（建议 60s）
- 配置告警通知

### 四、配置通知支持 90+ 通知渠道，常用：

- Email - 邮件
- Telegram - TG 机器人
- Discord - Discord Webhook
- Slack - Slack Webhook
- Bark - iOS 推送
- Server Chan - 微信推送
- 企业微信 - 群机器人
- 钉钉 - 群机器人

### 五、状态页可以创建公开状态页：

- 点击 "Status Pages"
- 添加页面
- 选择要展示的监控项
- 公开链接可分享

### 六、高级技巧
- 使用 Cloudflare Tunnel 暴露
- 配置反向代理 + HTTPS
- 多实例 + 数据库备份
- API 集成（Prometheus、Grafana）

[上一篇Vercel vs Cloudflare Pages：

静态网站部署终极对比，2026 谁更胜一筹？](/article/vercel-vs-cloudflare)[下一篇Ubuntu Server 初始化配置：

拿到新服务器必做的 10 件事](/article/ubuntu-server-setup)

[下一篇Ubuntu Server 初始化配置：

拿到新服务器必做的 10 件事](/article/ubuntu-server-setup)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/uptime-kuma-monitor](https://xiaozha.org/article/uptime-kuma-monitor)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步![image](https://xiaozha.org/images/mineradio-tutorial-cover.jpg?t=3acc55d5-e9ea-8103-b388-c846fa950c37)](/article/mineradio-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)
