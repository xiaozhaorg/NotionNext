---
title: Claude Code 实战指南：终端里的 AI 编程代理怎么用？（2026 国内版）
pubDatetime: "2026-07-30T06:18:32.994Z"
description: Claude Code 是 Anthropic 推出的终端原生 AI 编程代理。本文从安装配置讲到实战命令，重点详解国内开发者如何通过 CC Switch、阿里云百炼、QuickRouter 等方案无障碍使用，含 5 个真实场景案例。
author: 小吒
tags:
  - AI
  - 教程
  - Claude Code
  - AI 编程
  - ccswitch
  - 免费工具
featured: false
draft: false
sourceUrl: "https://xiaozha.org/article/claude-code-tutorial"
ogImage: "/images/claude-code-tutorial-real.jpg"
coverAlt: "开发者双手放在笔记本键盘上编写代码的特写"
enSlug: "claude-code-tutorial"
---

⚡

本文专门为国内开发者打造。

除了常规的安装使用教程，重点详解如何通过 CC Switch、阿里云百炼、QuickRouter 等方案，无需魔法、无需海外账号也能爽用 Claude Code。

 

2026 年，AI 编程工具已从「代码补全」进化到「自主执行」阶段。

在 Cursor、Trae IDE 等 GUI 工具之外，Anthropic 推出的 Claude Code 走了一条完全不同的路：

它放弃图形界面，回归终端原生，用命令行的方式重塑了「人机协作编程」的范式。

但它在国内能用吗？

怎么用？

本文会给你一套完整答案。

一、Claude Code 是什么？

Claude Code 是 Anthropic 官方推出的命令行 AI 编程代理（Agent）。

与 VS Code 插件、网页聊天不同，它直接运行在终端中，围绕你的本地项目目录进行工作。

核心特点：

- 终端原生：

没有 GUI，用自然语言在终端里和它对话
- 项目级理解：

能读取整个项目结构、跨文件理解依赖关系
- 自主执行：

可以自己拆解任务、读写文件、运行命令、跑测试、修 Bug
- 百万级上下文：

可处理 50 万行+的超大型项目
- 不绑定单一模型：

可以接入 Claude、GPT、DeepSeek、Qwen 等多种模型> 一句话理解：

Claude Code 不是 IDE 插件，而是一个能独立干活的「AI 工程师」。

你描述目标，它自主完成读代码、改文件、跑测试的全流程。

二、Claude Code vs Cursor vs Cline：

选型逻辑2026 年 AI 编程工具三足鼎立，三者代表了完全不同的技术哲学：

维度

Claude Code

Cursor

Cline

定位

终端原生 Agent

AI 原生 IDE

VS Code 插件

交互方式

命令行

图形界面

VS Code 内

自主执行

⭐⭐⭐⭐⭐ 顶级

⭐⭐⭐ 中等

⭐⭐⭐⭐ 强（需审批）

开源

否

否

是（MIT）

成本

Pro $20/月 起

Pro $20/月

免费 + API 费用

 

选型建议：

- 追求极致效率、习惯终端：

选 Claude Code
- 日常编码、喜欢图形界面：

选 Cursor
- 预算敏感、要求数据不出境：

选 Cline（可本地化部署）--
-

### 三、安装 Claude Code（国内镜像加速）Claude Code 依赖 Node.js 18+ 运行环境。

Windows 用户建议同时安装 Git for Windows。

#### 

3.1 安装 Node.jsWindows 用户可用 winget 一键安装：

macOS 用户用 Homebrew：

验证安装：

#### 

3.2 安装 Claude Code（国内镜像源）⚠️

国内用户必须使用镜像源，否则下载会超时。

这是第一步也是最常被忽略的一步。

验证安装：

--
-

### 四、国内使用方案详解（重点）🎯

Claude Code 默认调用 Anthropic 官方 API，国内直连会失败。

下面是 3 套主流方案，按推荐度排序。

#### 

方案一：

CC Switch 可视化管理（⭐⭐⭐⭐⭐ 推荐）CC Switch 是一款开源桌面工具，专门解决多 AI 编程工具的 API 配置管理问题。

它支持 Claude Code、Codex、Gemini CLI、OpenCode 等多款工具的统一管理。

核心优势：

- 图形化界面，零命令行基础也能用
- 内置 50+ 供应商预设（DeepSeek、Qwen、Kimi、智谱 GLM、MiniMax 等）
- 一键切换 Provider，无需手动改 JSON 配置
- 内置本地 API 代理，支持自动故障转移
- 用量统计：

实时查看 Token 消耗与费用
- WebDAV 自动同步，多设备共享配置安装步骤：

- 访问 GitHub Releases 页面：

https://github.com/farion1231/cc-switch
- 根据系统下载对应安装包：

Windows 下载 .msi 或便携版 ZIP；macOS 用 Homebrew 安装；Linux 选 .deb/.rpm/.AppImage
- macOS 用户推荐一行命令：

brew tap farion1231/ccswitch && brew install --cask cc-switch以接入 DeepSeek 为例：

- 在 DeepSeek 开放平台注册账号，创建 API Key（以 sk
- 开头，注意只显示一次）
- 打开 CC Switch，顶部应用栏选择 Claude
- 点击「添加供应商」，在预设列表选 DeepSeek
- 粘贴 API Key，其他字段保持默认（已自动配置 DeepSeek-V4-Pro 和 Flash）
- 如需百万 Token 超长上下文，可勾选开启 1M 模式
- 点击「添加」即可，CC Switch 会自动修改 Claude Code 的配置文件CC Switch 配置示例（DeepSeek）：

#### 

方案二：

阿里云百炼 Token Plan（⭐⭐⭐⭐ 企业/团队首选）阿里云百炼平台提供了 Anthropic 协议兼容接口，支持 Qwen3.6-plus、Qwen3.7-max 等旗舰模型，并支持 Coding Plan 固定订阅、Token Plan 团队抵扣两种计费模式，适合团队规模化使用。

配置步骤：

- 订阅阿里云百炼 Token Plan 团队版
- 获取专属 API Key
- 编辑 ~/.claude/settings.json 配置文件配置文件示例：

⚠️

必须将所有模型槽位（Haiku/Sonnet/Opus）都配置为国产模型，否则 Claude Code 会尝试调用 Anthropic 官方模型导致请求失败。

#### 

方案三：

环境变量直连（⭐⭐⭐ 简单方案）如果不想装额外工具，可以直接设置环境变量。

适合「先跑起来看看效果」的场景。

Windows PowerShell（临时生效）：

Windows 永久生效：

macOS/Linux：

#### 

方案对比与选型建议方案

难度

成本

适合人群

CC Switch

低

按 API 用量

个人开发者、想试多家模型

阿里云百炼

中

订阅制/团队抵扣

团队、企业、需要稳定 SLA

环境变量直连

低

按 API 用量

快速验证、不想装工具

--
-

### 五、CLAUDE.md：

项目的「记忆文件」CLAUDE.md 是 Claude Code 的项目级配置文件，用来设定你和 AI 的协作规则。

它分两种：

- 全局：~/.claude/CLAUDE.md，所有项目生效
- 项目级：

项目根目录下的 CLAUDE.md，只对当前项目生效推荐模板：

💡

CLAUDE.md 是新手最容易忽略的文件。

第一天就写好它，能省掉后续无数麻烦——AI 会自动遵守你设定的规则，不再需要每次提醒。

--
-

### 六、5 个实战场景演示

#### 场景 1：

接手新项目快速理解接手一个陌生项目时，先用 Claude Code 梳理架构：

Claude Code 会扫描整个项目，生成 CLAUDE.md 文件，并输出模块依赖关系图。

#### 

场景 2：

智能代码重构重构一段混乱代码：

#### 

场景 3：

跨文件批量修改把所有 API 调用从 fetch 迁移到 axios：

Claude Code 会一次性产出所有文件的修改，按文件分组展示 diff，确认后一键应用。

#### 

场景 4：

Bug 排查与修复Claude Code 会自主运行测试、读日志、定位问题、修改代码、再跑测试验证，形成完整闭环。

#### 

场景 5：

自动化测试生成--
-

### 七、常用斜杠命令速查Claude Code 内置大量 / 开头的斜杠命令，掌握这些能大幅提升效率：

命令

作用

/clear

清空当前对话，开始新会话

/compact

压缩历史上下文，保留关键信息

/init

生成项目 CLAUDE.md 文件

/plan

进入计划模式，先规划后执行

/context

查看当前上下文消耗

/branch

复制当前对话作为分支

/fork

后台启动子 Agent 处理辅助任务

/status

查看模型、Base URL、API Key 配置

/memory

编辑项目记忆文件

--
-

### 八、进阶技巧与避坑指南

#### 8.1 国内启用 Web SearchClaude Code 内置的 web_search 工具在国内常受限。

推荐安装 Fetch MCP 替代：

Fetch MCP 优势：

不受 Anthropic 政策限制、自动 HTML→Markdown 转换、支持代理配置、内置 15 分钟缓存。

#### 

8.2 防止上下文污染⚠️

永远不要在电脑根目录（如 C:\）启动 Claude Code！

否则它会扫描整个磁盘，不仅慢还可能误操作。

正确做法：

为每个项目建独立文件夹，cd 进去再启动 claude。

#### 

8.3 VS Code 集成Claude Code 提供官方 VS Code 扩展，在扩展市场搜索安装即可。

配合 CC Switch 中开启「启用到 Claude Code 插件」选项，可以在 VS Code 里直接调用。

#### 

8.4 成本控制技巧
- 用 /compact 压缩上下文，减少 Token 消耗
- 日常用 DeepSeek/Qwen，复杂任务才切到 Claude Opus
- CC Switch 设置用量阈值告警，避免账单爆炸
- 长任务用 --dangerously-skip-permissions 减少交互（仅在信任的沙箱环境）--
-

### 九、总结：

该不该切换到 Claude Code？

Claude Code 不是 IDE 的替代品，而是 IDE 的补充。

它的真正价值在于「Agent 模式」——你描述目标，它自主完成全流程。

适合切换的场景：

- 需要跨文件大规模重构
- 接手陌生项目，想快速理解架构
- DevOps/CI-CD 场景，需在服务器端无 GUI 操作
- 追求极致效率，愿意学习终端工作流不建议切换的场景：

- 完全不会命令行，且不想学
- 只是写写小脚本、改改小 bug（Cursor 更顺手）
- 项目高度依赖 IDE 的可视化调试能力> 模型会被替代，但好的 Agent 框架是更持久的基础设施。

Claude Code 就是 2026 年最值得掌握的那一个。

🌟

本文涉及的 CC Switch 项目地址：

https://github.com/farion1231/cc-switch —— 完全开源免费，给作者点个 Star 支持一下国产开源。

下一篇我会写《Cline 实战：

开源免费版 Claude Code》—— 重点讲本地化部署和数据不出境方案，敬请关注。

[NextChat 部署指南：

Vercel 一键部署专属 AI 助手，支持 DeepSeek 等 16+ 大模型![image](https://xiaozha.org/images/nextchat-deploy-guide-cover.jpg)](/article/nextchat-deploy-guide)[Zed 编辑器体验：

号称最快的代码编辑器，到底有多强？![image](https://xiaozha.org/images/zed-vs-vscode-cover.jpg)](/article/zed-vs-vscode)[Windows 包管理器 winget 完全指南：

告别手动下载安装软件![image](https://xiaozha.org/images/winget-windows-tools-cover.jpg)](/article/winget-windows-tools)[2026 年 VS Code 必备插件推荐：

让开发效率翻倍的 20 个神器![image](https://xiaozha.org/images/vscode-extensions-2026-cover.jpg)](/article/vscode-extensions-2026)[⚡ VS Code + OpenAI Codex 深度集成：

开启 AI 结对编程新时代![image](https://xiaozha.org/images/vscode-codex-integration-cover.jpg)](/article/vscode-codex-integration)
