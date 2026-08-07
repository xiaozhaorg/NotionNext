---
title: Vaultwarden 自托管密码管理器：告别 1Password 年费，数据自己掌控
pubDatetime: "2026-07-21T00:00:00.000Z"
description: Vaultwarden 是 Bitwarden 的轻量自托管版，本文详解 Docker 部署、Cloudflare Tunnel 安全暴露、客户端配置，告别年费。
author: 小吒
tags:
  - 免费工具
  - 开源
  - 教程
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/bitwarden-self-host"
ogImage: "/images/bitwarden-self-host-cover.jpg"
---

![image](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-81fe-9173-f6132acdd060&q=50&width=1080&fmt=webp&fm=webp)

1Password 一年要 $36？

Vaultwarden 自托管完全免费，且数据自己掌控。

一、为什么选 Vaultwarden
- 完全免费开源
- 兼容 Bitwarden 客户端
- 资源占用低（10MB 内存）
- Docker 一键部署
- 密码完全自己掌控

### 二、Docker 部署`docker-compose.yml`：

启动：

三、Cloudflare Tunnel 暴露

### 四、客户端配置下载 Bitwarden 客户端，服务器地址填入你的域名，即可使用。

五、安全建议
- 启用 2FA
- 关闭公开注册（注册完成后设置 `SIGNUPS_ALLOWED=false`）
- 定期备份 data 目录
- 配置 fail2ban 防爆破

### 六、迁移自 1Password
- 1Password 导出 CSV
- Bitwarden 网页端导入
- 验证无误后删除 1Password 数据

[上一篇登陆宝塔面板访问404](/article/bt-panel-404)[下一篇AtomCode：

终端里的 AI 编码代理，开源免费且强大](/article/atomcode-intro)

[下一篇AtomCode：

终端里的 AI 编码代理，开源免费且强大](/article/atomcode-intro)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/bitwarden-self-host](https://xiaozha.org/article/bitwarden-self-host)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步![image](https://xiaozha.org/images/mineradio-tutorial-cover.jpg?t=3acc55d5-e9ea-8103-b388-c846fa950c37)](/article/mineradio-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)
