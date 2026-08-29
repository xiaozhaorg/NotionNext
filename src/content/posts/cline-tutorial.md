---
title: Cline 实战：开源免费的 Claude Code 替代品，本地部署数据不出境
pubDatetime: "2026-08-28T00:00:00.000Z"
description: Cline 是目前最成熟的开源 AI 编程代理，功能对齐 Claude Code 且免费。本文从安装、配置模型讲到本地化部署方案，重点解决"数据不出境"——搭配 Ollama 本地模型或国内 API 端点即可，含 Plan/Act 双模式、MCP 接入和真实场景案例。
author: 小吒
tags:
  - AI
  - AI 编程
  - Cline
  - 教程
  - 开源工具
featured: false
draft: false
---

上篇 [Claude Code 实战指南](/article/claude-code-tutorial) 里说过，预算敏感、要求数据不出境的同学可以选 Cline，这篇就把它展开讲透。

## 一、Cline 是什么

Cline 是 VS Code / Cursor 生态里最出名的**开源 AI 编程代理**，定位和 Claude Code 几乎一致：你描述目标，它自主完成读代码、改文件、跑终端命令的全流程，所有操作都要经过你的审批。

和 Claude Code 最大的三点区别：

- **开源免费**：本体不收费，你只用为自己选的模型 API 付费
- **模型自由**：不绑定 Anthropic，任何 OpenAI 兼容端点都能接
- **数据可控**：模型指向哪里，代码就发往哪里——这是"数据不出境"的关键

## 二、为什么值得用

1. **成本几乎为零**：接本地模型完全免费，接国内 API 也就几分钱一次对话
2. **数据不出境**：代码不经过海外服务，适合企业、政府、金融等敏感场景
3. **权限全透明**：每一步改文件、执行命令都要你确认，不怕它乱来
4. **生态兼容**：MCP 协议、OpenAI 兼容 API 都是标准接口，可玩性高

## 三、安装

打开 VS Code（或 Cursor），扩展市场搜索 `Cline`，安装量最高那个就是，装完侧边栏会出现 Cline 图标。

安装后第一件事不是写代码，而是**先想清楚模型接哪**——这直接决定你的数据去哪里。

## 四、模型配置：三种"数据不出境"方案

### 方案 A：Ollama 本地模型（完全离线）

如果你在意到极致，用 [Ollama 本地大模型](/article/ollama-local-llm) 跑一个编程向模型：

```bash
ollama pull qwen2.5-coder:14b
```

Cline 的 API Provider 选 `Ollama`，Base URL 填 `http://localhost:11434`，模型名填 `qwen2.5-coder:14b` 即可。

优点是完全离线、零成本；缺点是本地模型能力上限明显，复杂重构容易翻车，适合小项目和隐私优先的场景。

### 方案 B：国内 API 端点（推荐）

国内厂商的 OpenAI 兼容接口，速度和能力都够用，数据留在大陆：

| 端点 | 编程模型 | 说明 |
|---|---|---|
| 硅基流动 | deepseek-ai/DeepSeek-V3、Qwen3-Coder 等 | 注册送额度，见[硅基流动入门](/article/siliconflow-intro) |
| DeepSeek 官方 | deepseek-chat、deepseek-reasoner | 便宜量大，见 [DeepSeek 编程实战](/article/deepseek-v4-coding) |
| 智谱开放平台 | GLM-4 系列 | OpenAI 兼容，新用户有免费包 |

Cline 的 API Provider 选 `OpenAI Compatible`，把 Base URL 和 API Key 填上就行，大部分厂商文档里直接给了兼容配置。

### 方案 C：Anthropic 官方（海外）

有海外网络和信用卡的直接选 `Anthropic` 官方端点，模型能力最强（Claude 系列），适合追求上限的同学。数据出境的问题自己权衡。

## 五、核心用法：Plan / Act 双模式

Cline 的命令行输入框旁有两个模式开关：

- **Plan 模式**：只读代码、出方案，不改任何文件——复杂需求先让它"讲思路"
- **Act 模式**：真正动手改代码、跑命令，每步操作弹窗等你批准

实战节奏建议：**先用 Plan 聊清楚，再切 Act 执行**。一次大改拆成几次小 Act，比让它一口气干完稳得多。

## 六、MCP 接入

Cline 原生支持 MCP（Model Context Protocol），配置入口在设置里的 `MCP Servers`。可以把文件系统、数据库、浏览器、代码检索等能力接进来，用法和 Claude Code 的 MCP 一致，相关教程可以看我之前写的 [Codebase Memory MCP 实践](/article/codebase-memory-mcp)。

## 七、与 Claude Code 对比

| 维度 | Cline | Claude Code |
|---|---|---|
| 开源 | ✅ | ❌ |
| 费用 | 免费（模型自付） | 订阅或按量付费 |
| 模型 | 任意 OpenAI 兼容 | 仅 Claude 系列 |
| 数据出境 | 可本地/国内 | 默认海外 |
| 运行环境 | VS Code / Cursor 扩展 | 终端 CLI |
| 能力上限 | 受所选模型限制 | 原生 Claude 最强 |

一句话：**要省、要数据安全选 Cline；要最强能力、不在乎出海选 Claude Code。**

## 八、常见坑

1. **本地模型别硬上大重构**：14B 级别模型改小文件没问题，跨模块重构还是交给云端强模型
2. **上下文会爆**：长对话后 Cline 变"笨"，及时开新会话并把关键结论写进需求里
3. **权限别全自动**：auto-approve 全开很危险，命令执行建议保持人工确认
4. **Base URL 别填错**：多数"连不上"是 URL 少了 `/v1` 后缀或 Key 多了空格

## 九、小结

Cline 的意义在于把"AI 编程代理"从收费墙里解放了出来：模型可换、数据可控、权限透明，配上国内 API 或本地 Ollama 就是一套完全合规的开发环境。

如果你的场景是"代码不想出国"，这套组合拳值得一用；如果你想要最强模型效果，回看 [Claude Code 实战指南](/article/claude-code-tutorial)。下一篇可以聊聊 MCP 生态大盘点，把 AI 编程工具的"外挂"能力一次讲全。
