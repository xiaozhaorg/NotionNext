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
ogImage: "https://xiaozha.org/images/cloudflare-tunnel-cover.jpg?t=3a9c55d5-e9ea-81e7-b11e-f6d81fbdd3a6"
---

![image](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-8146-a4b1-fc79a42610d8&q=50&width=1080&fmt=webp&fm=webp)

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

[上一篇零成本建站！

用 Cloudflare Workers 免费搭建个人博客完整教程](/article/cloudflare-workers-blog)[下一篇🚀 免费内网穿透！

Cloudflare Tunnel 实战教程，让本地AI服务触达全球](/article/cloudflare-tunnel-tutorial)

[下一篇🚀 免费内网穿透！

Cloudflare Tunnel 实战教程，让本地AI服务触达全球](/article/cloudflare-tunnel-tutorial)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/cloudflare-tunnel](https://xiaozha.org/article/cloudflare-tunnel)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg?t=3a9c55d5-e9ea-816d-a569-f20405ad6185)](/article/vscode-extensions-2026)
