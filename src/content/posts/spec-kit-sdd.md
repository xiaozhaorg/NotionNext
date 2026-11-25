---
title: "写代码前先跟 AI 把需求说清楚：Spec Kit 从装到用"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "你描述一个功能，AI 写了很多代码，方向却从第二步就跑偏。Spec Kit 让你先把规格写清楚，AI 照着做，做完还能自动查有没有跑偏。这篇教你怎么装、怎么走一遍流程，以及什么时候其实不用这么麻烦。"
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

你有没有遇到过这种事：你跟 AI 描述了一个功能，它老老实实写了三千行代码，方向却从第二步就跑偏了。你改提示词，再来一遍，又跑偏。回头一看，时间全花在"它怎么又理解错了"上。

说白了，含糊的需求进去，忠实的垃圾代码出来。问题往往不在 AI 写不出来，而在它不知道你到底想要什么。

[Spec Kit](https://github.com/github/spec-kit) 就是冲着这个痛点来的：写一行代码之前，先让 AI 跟你把"要做什么、做到什么算好"白纸黑字写清楚。

特别像装修房子。你不会跟装修队说"给我弄好看点"就走人——你得先出一张图纸：几室几厅、插座在哪、用什么材料、验收怎么算。工人照图纸干，你照图纸验。中间想改，也是改图纸，不是等墙砌好了再砸。Spec Kit 干的就是让 AI 照图纸干活这件事，只不过那张图纸叫规格（spec）。

它管三件事，三个入口互相独立，不是必须按顺序走的阶段：

| 你要做什么 | 入口 | 最终产物 |
| --- | --- | --- |
| 从零造一个功能 | 规格驱动开发（SDD） | 规格贯穿计划、实现与收敛 |
| 修一个诡异 bug | Bug 修复（扩展） | 诊断结论 + 限定范围的修复 + 验证记录 |
| 判断一个想法值不值得做 | 想法评估（扩展） | 有证据支撑的 go / clarify / kill 决策 |

后两个是按需安装的扩展，不用先跑一遍 SDD。这个设计是 v1.4 之后才成型的，老教程基本没赶上。

## 现在就能上手

需要 Python 3.11+ 和 [uv](https://docs.astral.sh/uv/)，Linux / macOS / Windows 都支持。

```bash
uv tool install specify-cli
specify init my-project --integration copilot
cd my-project
```

`--integration` 是告诉它你用哪个编程 Agent。它对工具不挑——GitHub Copilot、Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等 20 多种都能用，不绑定哪一家的订阅。

在**已有项目**里用，进项目目录执行 `specify init .` 就行，不用新建。

## 先走一遍核心流程

新建项目先立一次"宪法"，之后每做一个功能，重复下面这套。

**注意：这些斜杠命令是在 Agent 的对话框里敲的，不是在终端。** 下面用 Copilot 的写法，其他 Agent 怎么调用，看[官方文档](https://github.github.io/spec-kit/integrations/cli.html#command-invocation)。

```text
/speckit-constitution Create principles focused on code quality, testing, and maintainability.
/speckit-specify Build a photo organizer with albums grouped by date and a tile preview of each album.
/speckit-plan Use Vite with vanilla JavaScript. Keep images local and store metadata in SQLite.
/speckit-tasks
/speckit-implement
/speckit-converge
```

每一步生成的东西，就是下一步的输入：

- **Constitution**（全项目一次）：写进 `.specify/memory/constitution.md`，把不能妥协的原则定下来——技术栈、代码风格、测试标准、安全红线。之后每份计划都得过这一关。
- **Specify**：只说做什么、为什么，不谈怎么做。生成 `specs/001-xxx/spec.md`，包含目标、范围、约束和验收标准。
- **Clarify**（强烈建议）：Agent 主动追问含糊的地方，把答案写回 spec。这一步最值钱——它会问出你自己都没想清楚的边界、权限、数据格式。
- **Plan**：到这里才谈技术。架构怎么定、用什么、组件怎么拆、接口怎么约。你可以直接给约束："用 Vite + 原生 JS，图片本地存储，元数据用 SQLite。"
- **Tasks**：拆成有先后依赖的任务，每项小到可以直接丢给 Agent，还带能验证的验收条件。
- **Implement**：一条条实现，完成一项就在 `tasks.md` 上打个勾，每个检查点看一眼 diff。
- **Converge**：拿代码和规格对一遍。结果是 `Converged` 才收工，否则列出差在哪，回去补，直到对上。

一份合格的 spec 至少有四块：**目标和非目标**（写清"这次不做什么"比写"做什么"更能防止跑偏）、**用户旅程**（按真实使用步骤写，不是罗列功能点）、**能量化的验收标准**（写"P95 < 200ms"，别写"要快"）、**边界和异常**（非法输入、依赖挂了、数据缺了怎么办）。

## 真正省心的地方

省心在两件事上。一是 Clarify 那一步——它会追着你问，把你自己都没想明白的地方翻出来，省得写完才发现不是那个意思。二是 Converge——代码改了规格没改，它会一直报差距，规格不会悄悄过期。换句话说，spec 不是写完就扔的参考文档，而是 Agent 照着执行的事实来源：带编号、带验收标准、能 diff、能追溯。

另外两个入口也是按需装的，不用为了修个小 bug 先把 SDD 从头走一遍。

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

报告在 `.specify/bugs/login-crash/`。结论有 `verified`、`partial`、`failed` 三种，只有 `verified` 才算真修好了。

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

最后给出 `go`、`needs-clarification` 或 `kill`。想明白一个想法不该做、并且把原因写下来，也是有用的结果。真要开工，把 `decision.md` 里的交接摘要丢给 `/speckit-specify` 就行。

## 用起来会碰到的几件事

**一定要用 GitHub Copilot 吗？** 不用，它对 Agent 中立，换哪个都行。

**它和 PRD 是一回事吗？** 不是。PRD 写给人看，SDD 的 spec 是给 Agent 执行的事实来源，能 diff、能追溯。所以 PRD 看完常常就放下了，spec 得一直跟着代码走。

**spec 写完还要维护吗？** 要。代码改了 spec 不改，converge 会一直报差距。把它当测试用例看：需求先变，spec 跟着变。

**社区扩展能直接装吗？** Spec Kit 自带社区 catalog，但官方说得很明白：目录列表既不是审计也不是背书，安装运行前先看看源码。

## 什么时候别用

Spec Kit 不是免费的——一个功能会产出十来个文档文件，这套仪式有成本。我的划分：

| 场景 | 建议 |
| --- | --- |
| 探索性脚本、一次性数据处理 | 别用，直接让 AI 写 |
| 一小时内能修完的小改动 | 别用，口头讲清楚就行 |
| 多 Agent 并行的功能块、要上线的业务逻辑 | 值得，重点用 specify + tasks + converge 三步 |
| 从 0 到 1 的新项目 | 全流程走一遍，宪法一次管到底 |

原则就一条：**用消除歧义所需的最小严格度**。别为了"规范"给一次性脚本写宪法。

## 说到底

它管不了"你到底想要什么"，但能管住"AI 交付的东西和你说的完全一致"。

如果你的麻烦已经从"写不出来"变成"写出来的不是我想要的"，这套流程值得完整试一次。只是偶尔让 AI 写个小工具，口头说清楚反而更快。

---

**参考**

- [github/spec-kit 官方仓库与文档](https://github.com/github/spec-kit)
- [Spec Kit 官方文档站](https://github.github.io/spec-kit/)
- [稀土掘金：上手 GitHub 官方 Spec Kit](https://juejin.cn/post/7705577542891421706)
