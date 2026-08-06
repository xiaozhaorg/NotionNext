---
title: AtomCode：终端里的 AI 编码代理，开源免费且强大
pubDatetime: "2026-07-12T00:00:00.000Z"
description: 一个运行在终端的 AI 编码代理，支持任意 LLM，100% AI 生成代码库，开源免费，值得一试。
author: 小吒
tags:
  - AI
  - 开发工具
  - 开源
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/atomcode-intro"
ogImage: "https://xiaozha.org/images/atomcode-intro-cover.jpg?t=3a9c55d5-e9ea-81a2-a624-ff1c519f968e"
---

发现宝藏工具作为一个经常在终端里折腾的开发者，我一直在寻找一款能够在命令行中使用的 AI 编码工具。

市面上虽然有很多 IDE 插件和 Web 应用，但能在终端里原生运行的却寥寥无几。

直到最近，我发现了 AtomCode——一款用 Rust 构建的开源 AI 编码代理，它不仅能在终端中运行，还支持连接任意 OpenAI 兼容的 LLM。

这简直是为我量身定做的工具！

安装体验：

一行命令搞定AtomCode 的安装体验堪称完美。

对于 macOS/Linux 用户，只需要一行命令：

Windows 用户也有对应的 PowerShell 脚本。

安装完成后，直接在项目目录下运行 `atomcode` 即可启动。

首次运行时，AtomCode 会引导你完成三步配置：

选择语言、设置 LLM 提供商、配置 API 密钥。

整个过程非常流畅，不需要手动编辑任何配置文件。

核心功能：

终端里的 AI 助手

#### 智能代理循环AtomCode 的核心是一个智能代理循环：

读取 → 编辑 → 运行 → 验证。

你只需要给出一个任务描述，它就会自动完成整个流程。

比如我让它修复一个登录 Bug：

AtomCode 会自动读取相关文件，分析问题，修改代码，运行测试，直到任务完成。

整个过程完全自动化，不需要你手动干预。

#### 

多 LLM 提供商支持这是 AtomCode 最吸引我的地方。

它支持几乎所有主流的 LLM：

- Claude (Sonnet 4.5/4.6, Opus 4.6)
- OpenAI (GPT-4o/4.1)
- DeepSeek (V3/R1)
- GLM (4/5)
- Qwen (Plus/Max)
- SiliconFlow
- Ollama（本地模型）而且它支持任何 OpenAI 兼容的 API，意味着你可以接入自己部署的模型或者其他服务商。

#### 

代码图谱工具AtomCode 内置了 8 个代码图谱工具，让 AI 能够真正理解大型代码库：

- list_symbols：

列出符号
- read_symbol：

读取符号定义
- find_references：

查找引用
- trace_callers：

追踪调用者
- trace_callees：

追踪被调用者
- trace_chain：

追踪调用链
- file_deps：

文件依赖
- blast_radius：

影响分析这些工具让 AI 不再是"盲人摸象"，而是能够看清整个代码库的结构和依赖关系。

#### 

截图/图片支持AtomCode 支持通过 Ctrl+V 粘贴截图，或者直接拖拽图片。

当主模型不支持视觉时，它会自动使用 VL 预处理器进行 OCR 和描述。

这个功能对于调试 UI 问题特别有用。

#### 

命令系统AtomCode 支持丰富的命令系统：

- `/review`：

代码审查
- `/test`：

运行测试
- `/security`：

安全审计
- `/issue create`：

创建 GitHub Issue
- `/plugin install`：

安装插件你还可以编写自己的技能（Skills），扩展 AtomCode 的功能。

IDE 插件支持虽然 AtomCode 主要是一个终端工具，但它也提供了 VS Code 和 JetBrains 的插件，让你可以在 IDE 中使用它：

- 侧边栏聊天：

在编辑器侧边栏打开 AI 聊天
- 右键菜单：

选中代码后右键解释/修复/优化
- Diff 预览：

所有代码变更以原生 IDE Diff 形式展示，确认后才写入
- 会话管理：

按时间分组的会话历史，支持搜索、重命名、删除

### 与 Claude Code 的对比很多人会拿 AtomCode 和 Claude Code 做比较。

根据官方的基准测试：

任务类型

AtomCode

Claude Code

简单编辑

3 步

3 步

模块重构

7 步

6 步

启动开发服务器

4 步

4 步

Bug 修复

5 步

5 步

复杂任务

13 步

10 步

在复杂任务上，AtomCode 比 Claude Code 多约 30% 的步骤。

这并不是因为它能力弱，而是因为它采用了"小步快跑 + 自我验证"的策略——每个操作都是独立可撤销的，上下文更细粒度，中途更容易干预。

如果你更看重安全性和可干预性，AtomCode 是更好的选择；如果你追求速度和一次性完成，Claude Code 可能更适合。

开源免费，社区驱动AtomCode 是完全开源的（MIT 许可证），而且代码库本身是 100% AI 生成的。

这意味着：

- 免费使用：

没有订阅费用，只需要自己的 API 密钥
- 透明可审计：

所有代码都在 GitHub 上，你可以看到它的工作原理
- 社区驱动：

任何人都可以贡献代码，添加功能
- 定制化：

你可以根据自己的需求修改源代码

### 适合谁使用1. 终端爱好者

- 喜欢在命令行中工作
- 不想切换到 IDE 或浏览器
- 追求极简的开发体验2. 多模型用户

- 同时使用多个 LLM
- 想要根据任务选择最合适的模型
- 使用本地模型（Ollama）3. 开源贡献者

- 想要参与开源项目
- 喜欢 AI 生成代码的理念
- 想要定制自己的编码工具4. 开发者

- 需要快速完成编码任务
- 想要 AI 辅助代码审查和测试
- 追求高效的开发流程

### 安装方式macOS / Linux / HarmonyOS PC：

Windows（PowerShell）：

VS Code 插件：

总结AtomCode 是一款让我非常惊喜的工具。

它不仅解决了终端中缺少 AI 编码助手的问题，还通过多模型支持、代码图谱工具等功能，提供了堪比商业产品的体验。

如果你是一个终端爱好者，或者想要一个开源免费的 AI 编码工具，我强烈推荐你试试 AtomCode。

AtomCode 官网：[https://atomcode.atomgit.com/](https://atomcode.atomgit.com/invite/K37T22RU)

现在就去体验一下吧，相信你会喜欢上这款终端里的 AI 编码代理！

[上一篇Vaultwarden 自托管密码管理器：

告别 1Password 年费，数据自己掌控](/article/bitwarden-self-host)[下一篇Astro vs Next.js 终极对比：2026 年静态博客该选谁？](/article/astro-vs-nextjs)

[下一篇Astro vs Next.js 终极对比：2026 年静态博客该选谁？](/article/astro-vs-nextjs)

- **作者:**[小吒博客](/about)
- **链接:**[https://xiaozha.org/article/atomcode-intro](https://xiaozha.org/article/atomcode-intro)
- **声明:**本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。

相关文章

[薅羊毛！

肖恩AI 免费大模型 API 中转站，注册即送 7000 额度（附接入教程）![image](https://xiaozha.org/images/shawn-ai-free-api-cover.jpg?t=3aec55d5-e9ea-81c8-929b-f8a61e29177f)](/article/shawn-ai-free-api)[Claude Code 实战指南：

终端里的 AI 编程代理怎么用？（2026 国内版）![image](https://xiaozha.org/images/claude-code-tutorial-cover.jpg?t=3adc55d5-e9ea-813d-a1bd-ef7ad19790cc)](/article/claude-code-tutorial)[Mineradio 音乐播放器教程（2026）：3D 立体歌词开源播放器，支持网易云 QQ 音乐同步![image](https://xiaozha.org/images/mineradio-tutorial-cover.jpg?t=3acc55d5-e9ea-8103-b388-c846fa950c37)](/article/mineradio-tutorial)[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg?t=3a9c55d5-e9ea-81e1-86b5-f70a820365a8)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg?t=3a9c55d5-e9ea-8179-b3b3-c654b8779007)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg?t=3a9c55d5-e9ea-8125-9a64-e68f8868196e)](/article/winget-windows-tools)
