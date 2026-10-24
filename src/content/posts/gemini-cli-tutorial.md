---
title: Gemini CLI 实战：免费额度用不完的终端 AI 编程工具
pubDatetime: "2026-10-25T00:00:00.000Z"
description: 用个人 Google 账号登录就能拿到每天 1000 次请求、100 万 token 上下文的终端 AI agent。这篇讲 Gemini CLI 的安装、三种认证方式、GEMINI.md 层级上下文、sandbox 与 YOLO 模式、MCP 配置，以及它和 Claude Code 的真实差异。
author: 小吒
tags:
  - 教程
  - AI 编程
  - 免费工具
draft: false
ogImage: "/images/gemini-cli-tutorial-real.jpg"
coverAlt: "Ubuntu 终端屏幕特写，黑色背景上显示绿色命令行提示符与白色 sudo 命令"
enSlug: "gemini-cli-tutorial"
---

终端 AI 编程工具 2026 年卷得厉害，Claude Code、Codex CLI、Gemini CLI 三足鼎立。前两个都有入门门槛——Claude Code 要付费 Claude 订阅，Codex 要 ChatGPT 账号或 API。

Gemini CLI 是例外：**用个人 Google 账号登录，每天 1000 次请求免费，100 万 token 上下文，还开源。**

这篇讲怎么把它用起来，以及它和 Claude Code 的真实差异——不是"谁更强"，是"什么场景用哪个"。

## 免费额度：先算清楚你能免费用到什么程度

Gemini CLI 的免费额度分两套体系：

**Google 账号登录（推荐）**

- 每分钟 60 次请求
- 每天 1000 次请求
- 用的是 Gemini 模型，无需绑卡

**API Key（Google AI Studio）**

- 免费层每天有请求配额
- 好处是能指定模型、代码里能调用
- 超出走按量计费

对个人使用，直接 Google 账号登录就行。1000 次/天听起来多，但 agent 干一个任务经常要烧掉十几次请求（读文件、想方案、改代码、跑测试、看报错再改），所以它适合**交互式开发**，不适合挂后台跑无人值守的批量任务。

## 安装：一条命令的事

前提是 Node.js 20+。检查：

```bash
node --version
```

不够的话先升级 Node。然后三选一：

```bash
# 方式一：npx，不安装直接跑（适合先试试）
npx @google/gemini-cli

# 方式二：全局安装，日常用这个
npm install -g @google/gemini-cli

# 方式三：Homebrew（macOS/Linux）
brew install gemini-cli
```

装完在任意项目目录里敲 `gemini` 启动：

```bash
cd ~/projects/my-app
gemini
```

首次启动会走两步：选个主题颜色，然后认证。浏览器会跳转到 Google 登录页，授权完凭据缓存在本地，以后不用重复登。

## 三种认证方式，按场景选

`/auth` 命令可以随时切换：

| 方式 | 适用场景 | 额度 |
|---|---|---|
| **Google 个人账号** | 日常交互式开发 | 60 次/分、1000 次/天，免费 |
| **API Key** | 需要指定模型、写脚本调用 | 免费层 + 按量计费 |
| **Vertex AI** | 企业 GCP 项目、要审计日志 | 随 GCP 计费 |

API Key 的配法：

```bash
# 从 https://aistudio.google.com/app/apikey 生成 key
export GEMINI_API_KEY="你的key"
# 写进 shell 配置里免得每次敲
echo 'export GEMINI_API_KEY="你的key"' >> ~/.bashrc
```

**一个安全提醒**：API Key 等同于你的额度所有权，别提交进 git。用 `.env` 文件加 `.gitignore`，别直接硬编码在代码里。

## 核心用法：三个必须记住的交互

进了 `gemini` 之后，交互逻辑和 Claude Code 很像，但有几个自己的语法：

**`@` 引用文件**——把文件内容喂进上下文，不用复制粘贴：

```
> 帮我看下 @src/main.py 这个函数的性能问题
```

**`!` 执行 shell 命令**——不用退出会话：

```
> !ls -la
```

**普通对话**——直接问，它会自己读文件、提方案、给 diff 让你确认后才改。

它还有个内置的 Google Search grounding：问它一个上周刚出的 API 变更，它会现场搜，而不是拿训练数据里的旧知识瞎编。这点在实际用的时候很省心。

## GEMINI.md：层级上下文，比 CLAUDE.md 更细

Gemini CLI 用 `GEMINI.md` 存项目指令，类似 Claude Code 的 `CLAUDE.md`。但它的加载机制是**层级式**的：

| 位置 | 作用范围 |
|---|---|
| `~/.gemini/GEMINI.md` | 全局，所有项目生效 |
| 项目根目录 `GEMINI.md` | 该项目生效 |
| 子目录 `GEMINI.md` | 进到该子目录才生效 |

这意味着你可以把"通用偏好"（比如"注释用中文""别用 any 类型"）放全局文件，把"这个项目的技术栈和测试命令"放项目文件，把"这个模块的特殊约定"放子目录文件。指令会越往目录深处越具体。

一个实用的项目级 GEMINI.md 长这样：

```markdown
# 项目上下文

## 技术栈
- Python 3.12 + FastAPI + PostgreSQL
- 包管理用 uv，不用 pip

## 常用命令
- 跑测试: uv run pytest -q
- 代码检查: uv run ruff check .
- 数据库迁移: uv run alembic upgrade head

## 约定
- 不要手改迁移文件，一律用 alembic 生成
- 所有函数必须有类型标注
- 提交信息用中文
```

让 AI 自己写第一版：`gemini` 里直接说"读一下这个项目，帮我生成一份 GEMINI.md"，它会扫代码结构填内容，你再手工改。

## 两个模式：安全自动化的分水岭

这是 Gemini CLI 最实用的设计，很多人不知道：

**Sandbox 模式**——把 Gemini 的文件访问限制在项目目录内，系统级命令不让跑。适合在不信任的代码库上跑 agent，或者你不想让它碰 `~/.ssh` 这类目录的时候。

**YOLO 模式**——自动接受所有文件修改、不询问直接执行 shell 命令。全自动，适合批量任务，但**只在你完全信任的场景用**，比如让 AI 给 50 个文件统一加个 header。

两者可以叠加：

```bash
# 既限制在目录内，又全自动执行
gemini --sandbox --yolo
```

日常开发建议：默认两个都不开（每步确认），批量重构开 sandbox，跑无人任务才考虑 yolo——而且务必先在 git 干净的分支上试。

## 接 MCP：工具能力扩展

Gemini CLI 支持 MCP，配置在 `~/.gemini/settings.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "你的token"
      }
    }
  }
}
```

配完重启 `gemini`，工具列表里就能看到。MCP 的完整玩法和 server 清单见本站的 [MCP 生态与实战](/article/mcp-ecosystem/)，这里不展开。

## 和 Claude Code 的真实差异

网上大量"Gemini CLI vs Claude Code"的对比文章，结论基本都是"看需求"。说点具体的：

| 维度 | Gemini CLI | Claude Code |
|---|---|---|
| 入门成本 | Google 账号即可，免费 | 需 Claude 订阅（约 $20/月） |
| 免费额度 | 1000 次/天 | 按订阅内的用量窗口 |
| 上下文 | 100 万 token | 200K（长上下文另算） |
| 代码质量（复杂重构） | 够用，偶有返工 | 更稳，一次成功率更高 |
| 搜索 grounding | 内置 Google Search | 无，靠训练数据 |
| 多编辑器 | 终端独立 | 终端独立 |

**我的实际用法**：两个都装。日常小改小补、查资料、读陌生代码库用 Gemini CLI（免费额度不心疼）；跨文件的大重构、需要严谨推理的活留给 Claude Code。

100 万上下文是真实优势——把一个中型仓库连文档一起丢给它，它真能全读进去。Google Search grounding 也是独一份：问它某个库上个月的 breaking change，它搜完再答，不会瞎编。

## 配额省着用的几个技巧

1000 次/天经不住乱烧：

1. **任务拆小**。一个大任务改成"先分析再改"，比一句"帮我重构整个模块"省一半请求——因为失败重试最烧额度。
2. **善用 `@` 精确喂文件**，别说"看看那个配置文件"，直接 `@config.yaml`。
3. **GEMINI.md 写清楚**，减少它反复读文件猜上下文的次数。
4. **批量任务用脚本**，别用交互式 agent——API 直接调比 agent 循环便宜得多。

## 小结

Gemini CLI 是 2026 年终端 AI 编程里对免费用户最友好的一个：Google 账号登录即用、1000 次/天、100 万上下文、开源。它不是 Claude Code 的完全替代——复杂推理和重构质量还有差距——但作为**日常搭档和第二意见**，免费额度这个优势没有对手。

装一个试试，从"总结这个项目结构"这种零风险任务开始。

---

**相关阅读**：终端 agent 的另一个选择见 [Claude Code 实战教程](/article/claude-code-tutorial/)；AI 编程工具全貌对比看 [2026 免费 AI 编程工具横评](/article/free-ai-coding-tools-2026/) 和 [ChatGPT vs Claude vs Gemini](/article/chatgpt-vs-claude-vs-gemini/)；想给 agent 扩展能力看 [MCP 生态与实战](/article/mcp-ecosystem/)。
