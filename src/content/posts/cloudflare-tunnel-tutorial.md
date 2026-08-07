---
title: 🚀 免费内网穿透！Cloudflare Tunnel 实战教程，让本地AI服务触达全球
pubDatetime: "2026-07-21T00:00:00.000Z"
description: 手把手教你使用 Cloudflare Tunnel 免费实现内网穿透，无需公网IP，将本地AI服务、NAS、开发环境安全暴露到公网，全球可访问。
author: 小吒
tags:
  - Cloudflare
  - 教程
  - 免费工具
  - 内网穿透
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/cloudflare-tunnel-tutorial"
ogImage: "/images/cloudflare-tunnel-tutorial-real.jpg"
---

![image](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&t=3aac55d5-e9ea-81a9-b99e-deafcdc9e314&q=50&width=1080&fmt=webp&fm=webp)

在 AI 工具百花齐放的 2026 年，越来越多开发者会在本地部署大模型、AI 编程助手、NextChat 这类服务。

但问题随之而来：

如何让外网访问家里的本地服务？

传统方案要么买公网 IP，要么用付费的 frp/ngrok，成本和维护都不小。

今天就分享一个完全免费的解决方案——Cloudflare Tunnel。

一、为什么选择 Cloudflare Tunnel？

Cloudflare Tunnel（前身为 Argo Tunnel）是 Cloudflare 提供的免费内网穿透服务。

它的核心思路很巧妙：

你不需要公网 IP，也不需要在路由器上开端口，只要在本机跑一个 `cloudflared` 客户端，它会主动向 Cloudflare 建立一条长连接，把外部请求反向代理到你本地的服务。

相比传统内网穿透方案，它有几个压倒性优势：

- 完全免费：

不限流量、不限带宽，个人使用 0 成本
- 无需公网 IP：

家里宽带、移动网络、办公室都能用
- 自带 HTTPS：

Cloudflare 自动签发证书，告别自己配 Let&#x27;s Encrypt
- 安全可靠：

不暴露真实 IP，所有流量经过 Cloudflare 的 WAF 和 DDoS 防护
- 全球加速：

依托 Cloudflare 300+ 边缘节点，访问速度极快
- 自定义域名：

可绑定自己的域名，专业又美观

### 二、准备工作开始之前，你需要准备：

- 一个 Cloudflare 账号（免费注册即可）
- 一个托管在 Cloudflare 的域名（免费域名也可以，参考本博客之前的 Gname eu.cc 教程）
- 本地一个正在运行的服务（比如 `localhost:3000` 的 NextChat）

### 三、安装 cloudflared 客户端

#### Windows 系统推荐使用 winget 直接安装：

或者去 [GitHub Releases](https://github.com/cloudflare/cloudflared/releases) 下载 `.msi` 安装包，双击安装即可。

#### 

macOS 系统

#### Linux 系统安装完成后验证：

四、快速体验：

Quick Tunnel（临时隧道）如果你只是临时给同事演示一下本地项目，不想配置域名，可以用 Quick Tunnel 一行命令搞定：

执行后终端会输出一个形如 `https://random-words-xxx.trycloudflare.com` 的临时网址，把这个网址发给别人就能访问你的本地服务了。

> ⚠️ **注意**：

Quick Tunnel 是临时的，客户端关闭后网址立即失效，域名也是随机分配的。

长期使用请按下面的方式配置命名隧道。

五、正式配置：

命名隧道（长期稳定）

#### 1. 登录 Cloudflare浏览器会自动打开授权页面，选择你要使用的域名（比如 `example.com`），点击授权。

系统会在 `~/.cloudflared/` 下生成 `cert.pem` 凭证文件。

#### 

2. 创建隧道执行后会输出一个隧道 UUID，同时在 `~/.cloudflared/` 目录下生成 `<UUID>.json` 凭证文件，请妥善保管。

#### 

3. 配置 DNS 记录把子域名指向隧道（无需手动去 Cloudflare 控制台添加，命令会自动帮你配置）：

执行完毕后，Cloudflare 会自动为 `ai.example.com` 创建一条 CNAME 记录，指向 `<UUID>.cfargotunnel.com`。

#### 

4. 编写配置文件在 `~/.cloudflared/` 下新建 `config.yml`：

#### 

5. 启动隧道打开浏览器访问 `https://ai.example.com`，是不是已经能访问你的本地服务了？

而且自动带 HTTPS！

六、设置开机自启生产环境当然不能一直开着终端，配置成系统服务更省心。

#### 

Linux（systemd）

#### Windows以管理员身份打开 PowerShell：

服务会注册为 `Cloudflared`，可在 `services.msc` 中管理启动类型。

七、实战场景：

暴露本地 Ollama 大模型 API下面演示一个真实场景——把本地的 Ollama 大模型 API 暴露到公网，方便在外面用手机调用。

Step 1：

本地启动 Ollama（默认监听 127.0.0.1:11434）

为了让局域网外能访问，先设置环境变量让 Ollama 监听所有网卡：

Step 2：

在 `config.yml` 中新增一条 ingress 规则：

Step 3：

重启 cloudflared，然后用 curl 测试：

搞定！

现在你在任何地方都能调用家里的本地大模型了。

八、安全加固建议把服务暴露到公网后，安全一定要跟上：

- 开启 Cloudflare Access：

在 Zero Trust 控制台为隧道配置身份验证（邮箱 OTP、GitHub 登录等），只有授权用户才能访问
- 限制访问路径：

用 `originRequest` 配置仅暴露必要的 API 路径
- 开启速率限制：

在 Cloudflare Dashboard 设置 WAF 规则，防止恶意刷接口
- 定期检查日志：

通过 `cloudflared tunnel list` 和 Cloudflare 控制台查看访问记录

### 九、常见问题排查

#### Q1：

访问显示 502 Bad Gateway？

检查本地服务是否正常运行，`config.yml` 中的端口是否正确。`cloudflared` 必须能从本机访问到 `service` 地址。

#### 

Q2：

DNS 解析不生效？

Cloudflare DNS 通常 1 分钟内生效。

可以用 `nslookup ai.example.com` 验证是否解析到了 `cfargotunnel.com`。

#### 

Q3：

如何同时运行多个隧道？

在 `config.yml` 中通过不同的 `hostname` 区分即可，一个隧道可以代理多个服务，无需创建多个隧道实例。

十、总结Cloudflare Tunnel 是目前最适合个人开发者的内网穿透方案：

免费、安全、稳定、配置简单。

无论是暴露本地 AI 服务、远程访问 NAS、还是给客户演示本地项目，它都能轻松胜任。

配合本博客之前介绍的 Cloudflare Workers 建站、Cloudflare 域名邮箱，你已经可以用 Cloudflare 全家桶搭建一套完整的个人云基础设施了。

下一篇文章我们将继续探索 Cloudflare 生态，敬请关注「小吒の博客」的后续更新。

[上一篇Cloudflare Tunnel 免费内网穿透：

把家里的NAS、树莓派暴露到公网](/article/cloudflare-tunnel)[下一篇Cloudflare R2 对象存储完全指南：10GB 免费存储，替代 S3 的最佳选择](/article/cloudflare-r2-storage)

[下一篇Cloudflare R2 对象存储完全指南：10GB 免费存储，替代 S3 的最佳选择](/article/cloudflare-r2-storage)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/cloudflare-tunnel-tutorial](https://xiaozha.org/article/cloudflare-tunnel-tutorial)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg?t=3a9c55d5-e9ea-816d-a569-f20405ad6185)](/article/vscode-extensions-2026)
