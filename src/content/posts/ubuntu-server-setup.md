---
title: Ubuntu Server 初始化配置：拿到新服务器必做的 10 件事
pubDatetime: "2026-07-21T00:00:00.000Z"
description: 拿到新的 Ubuntu 服务器后必做的 10 件事：SSH 安全、防火墙、自动更新、时区、Docker、监控等，一键脚本搞定。
author: 小吒
tags:
  - 教程
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/ubuntu-server-setup"
ogImage: "/images/ubuntu-server-setup-real.jpg"
---

![image](https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-8114-abc6-ecf95b105f02&q=50&width=1080&fmt=webp&fm=webp)

拿到新的 Ubuntu Server，第一件事该做什么？

这份清单帮你避免常见坑。

一、SSH 安全配置

### 二、配置 SSH 密钥登录

### 三、配置防火墙

### 四、配置自动更新

### 五、设置时区

### 六、创建普通用户

### 七、安装 Docker

### 八、配置 Swap（内存不足时）

### 九、配置 Fail2ban

### 十、安装监控

### 一键脚本保存为 `setup.sh`：

[上一篇Uptime Kuma 自建监控：

免费替代 UptimeRobot，漂亮又强大](/article/uptime-kuma-monitor)[下一篇Trae IDE 深度体验：

字节出品的 AI 原生编辑器，到底值不值得用？](/article/trae-ide-review)

[下一篇Trae IDE 深度体验：

字节出品的 AI 原生编辑器，到底值不值得用？](/article/trae-ide-review)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/ubuntu-server-setup](https://xiaozha.org/article/ubuntu-server-setup)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg?t=3a9c55d5-e9ea-816d-a569-f20405ad6185)](/article/vscode-extensions-2026)
