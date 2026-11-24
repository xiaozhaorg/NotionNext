---
title: "Spec Kit 实战：让 AI 先写规格再写代码，告别 Vibe Coding"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "GitHub 官方开源工具 Spec Kit 已到 15 万星。它不是老教程里那套五步 SDD——现在还有 Bug 修复和想法评估两个独立入口。这篇讲清它解决什么问题、完整怎么用、以及什么时候不该用。"
author: 小吒
tags:
  - AI 编程
  - 开源
  - 教程
draft: false
ogImage: "/images/spec-kit-sdd-real.webp"
coverAlt: "终端屏幕上显示规格文档与代码并排对照"
enSlug: "spec-kit-sdd"
---

用 AI 写代码最让人抓狂的从来不是"写不出来"，而是"写出来的不是我想要的"。

你描述了一个功能，Agent 忠实地生成了三千行代码，方向却从第二步就跑偏了。回头改提示词，再生成，再跑偏——这就是 Vibe Coding 的真实成本。

**garbage in, garbage out**。含糊的需求进去，忠实的垃圾代码出来。

GitHub 官方开源的 [Spec Kit](https://github.com/github/spec-kit) 就是冲着这个痛点来的。它目前 **15.1 万 stars**，是 GitHub 自己在用的规格驱动开发（SDD）工具包。

但要先纠正一个常见误解：**网上大多数中文教程还停留在"五步 SDD"阶段，而现在它已经不止五步了。**

## 它到底是什么

一句话：给 AI 编程 Agent 一套结构化的流程、可复用的模板，以及**可追溯的产物**。

关键点是"可追溯"。传统 PRD 是写给人看的参考文档，写完可能就扔了；Spec Kit 的 spec 是给 Agent 执行的**事实来源**——带编号、带验收标准、可以 diff、可以追溯。代码改了 spec 不改，一致性检查会一直报差距。

它做的三件事，对应三个**互相独立的入口**（不是必须按顺序走的阶段）：

| 你要做什么 | 入口 | 最终产物 |
| --- | --- | --- |
| 从零造一个功能 | 规格驱动开发（SDD） | 规格贯穿计划、实现与收敛 |
| 修一个诡异 bug | Bug 修复（扩展） | 诊断结论 + 限定范围的修复 + 验证记录 |
| 判断一个想法值不值得做 | 想法评估（扩展） | 有证据支撑的 go / clarify / kill 决策 |

后两个是**按需安装的扩展**，不用先跑一遍 SDD。这个设计在 v1.4 之后才成型，老教程基本没覆盖。

## 安装

需要 Python 3.11+ 和 [uv](https://docs.astral.sh/uv/)，Linux / macOS / Windows 都支持。

```bash
uv tool install specify-cli
specify init my-project --integration copilot
cd my-project
```

`--integration` 指定你用的编程 Agent。它对这些工具是中立的——GitHub Copilot、Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等 20 多种都支持，不绑定某一家的订阅。

在**已有项目**里用，进入项目目录执行 `specify init .` 即可，不必新建项目。

## 核心流程：规格驱动开发

新建项目先立一次"宪法"，之后每个功能重复下面的流程。

**注意：这些斜杠命令是在 Agent 的对话框里执行的，不是终端。** 下面用 Copilot 的语法，其他 Agent 的调用方式看[官方文档](https://github.github.io/spec-kit/integrations/cli.html#command-invocation)。

```text
/speckit-constitution Create principles focused on code quality, testing, and maintainability.
/speckit-specify Build a photo organizer with albums grouped by date and a tile preview of each album.
/speckit-plan Use Vite with vanilla JavaScript. Keep images local and store metadata in SQLite.
/speckit-tasks
/speckit-implement
/speckit-converge
```

每步生成的文件都是下一步的输入：

- **Constitution**（全项目一次）：写进 `.specify/memory/constitution.md`，定义不可妥协的技术原则——技术栈约定、代码风格、测试标准、安全红线。后续每份计划都要过这道门禁。
- **Specify**：只谈 what / why，不谈 how。生成 `specs/001-xxx/spec.md`，包含目标、范围、约束和验收标准。
- **Clarify**（强烈建议）：Agent 主动追问模糊点，把答案写回 spec。**这一步最值钱**——它会问出你自己都没想清楚的边界、权限、数据格式。
- **Plan**：这时才谈技术。架构决策、技术选型、组件结构、接口契约。你可以直接给约束："用 Vite + 原生 JS，图片本地存储，元数据用 SQLite。"
- **Tasks**：拆成有依赖关系的有序任务，每 tasks 粒度小到可以直接交给 Agent，且带可验证的验收条件。
- **Implement**：逐条实现，每完成一项在 `tasks.md` 打勾。在每个检查点审查 diff。
- **Converge**：扫描代码与规格的一致性。结果是 `Converged` 才收工，否则列出偏差，回到 implement 补，循环到收敛。

写一个合格的 spec，至少有四块：**目标与非目标**（写清"这次不做什么"比写"做什么"更能防止发散）、**用户旅程**（按真实使用步骤，而不是罗列功能点）、**可量化的验收标准**（"P95 < 200ms" 而不是"要快"）、**边界与异常**（非法输入、依赖不可用、数据缺失时怎么办）。

## 另外两个入口

**修 bug**——先装扩展：

```bash
specify extension add bug
```

然后在 Agent 里：

```text
/speckit-bug-assess "Submitting an empty password crashes the login form." slug=login-crash
/speckit-bug-fix slug=login-crash
/speckit-bug-test slug=login-crash
```

报告在 `.specify/bugs/login-crash/`。最终结论有 `verified`、`partial`、`failed` 三种，**只有 `verified` 才算真修好了**。

**评估想法**——同样先装扩展：

```bash
specify extension add assess
```

```text
/speckit-assess-intake "Let users work offline and sync when they reconnect." slug=offline-mode
/speckit-assess-research slug=offline-mode
/speckit-assess-define slug=offline-mode
/speckit-assess-shape slug=offline-mode
/speckit-assess-decide slug=offline-mode
```

最后给出 `go`、`needs-clarification` 或 `kill`。决定不做一个想法，并且写清原因，也是有价值的产出。真要开工，把 `decision.md` 里的交接摘要丢给 `/speckit-specify` 就行。

## 什么时候别用它

这是最该说清楚、却最少人写的部分。Spec Kit 是有成本的——一个功能产出十来个文档文件，仪式感不是免费的。

我的划分：

| 场景 | 建议 |
| --- | --- |
| 探索性脚本、一次性数据处理 | 别用，直接让 AI 写 |
| 一小时内能修完的小改动 | 别用，口头讲清楚就行 |
| 多 Agent 并行的功能块、要上线的业务逻辑 | 值得，重点用 specify + tasks + converge 三步 |
| 从 0 到 1 的新项目 | 全流程走一遍，宪法一次管到底 |

原则很简单：**用消除歧义所需的最小严格度**。别为了"规范"给一次性脚本写宪法。

## 常见误区

**必须用 GitHub Copilot 吗？** 不用，它对 Agent 中立。

**和 PRD 什么关系？** PRD 写给人看，SDD 的 spec 是给 Agent 执行的事实来源，可 diff、可追溯。

**spec 要不要一直维护？** 要。代码改了 spec 不改，converge 会一直报差距。把它当测试用例看待：改需求先改 spec。

**社区扩展能直接装吗？** Spec Kit 自带社区 catalog，但官方明确提醒：目录列表不是审计也不是背书，安装运行前先看源码。

## 小结

Spec Kit 管不了"你到底想要什么"，但它能管住"AI 交付的东西和你说的完全一致"。

如果你的痛点已经从"写不出来"变成"写出来的不是我想要的"，这套流程值一次完整试用。如果只是偶尔让 AI 写个小工具，口头说清楚反而更快。

---

**参考**

- [github/spec-kit 官方仓库与文档](https://github.com/github/spec-kit)
- [Spec Kit 官方文档站](https://github.github.io/spec-kit/)
- [稀土掘金：上手 GitHub 官方 Spec Kit](https://juejin.cn/post/7705577542891421706)
