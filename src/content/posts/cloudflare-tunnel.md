---
title: Cloudflare Tunnel 免费内网穿透：把家里的NAS、树莓派暴露到公网
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Cloudflare Tunnel 免费将内网服务暴露到公网，无需公网IP、无需端口映射，5分钟搭建安全的内网穿透。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-tunnel"
ogImage: "/images/cloudflare-tunnel-real.jpg"
coverAlt: "数据中心服务器机架上闪烁的网络指示灯"
enSlug: "cloudflare-tunnel"
---

![image](/images/remote/1558494949-ef010cbdcc31.webp)

Cloudflare Tunnel（以前叫 Argo Tunnel）是免费内网穿透的最佳方案，无需公网 IP，无需端口映射，5 分钟即可用上。

一、什么是 Cloudflare Tunnel通过在本地运行 `cloudflared` 守护进程，与 Cloudflare 边缘节点建立加密隧道，让公网用户可以通过你的域名访问内网服务。

二、安装 cloudflared

#### Windows从 https://github.com/cloudflare/cloudflared/releases 下载安装包

#### 

macOS

#### Linux

### 三、登录并创建隧道`config.yml` 示例：

四、配置 DNS

### 五、启动隧道

### 六、典型应用
- NAS 远程访问（群晖、威联通）
- 树莓派服务
- HomeAssistant 智能家居
- 游戏服务器
- 开发环境调试

[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg)](/article/vscode-extensions-2026)
