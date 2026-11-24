---
title: "gstack 实测：给 Claude Code 配一整个虚拟工程团队"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "YC 掌门人 Garry Tan 开源的 gstack 已 14 万星，用 23 个 slash 命令把 Claude Code 变成 CEO、架构师、QA、安全官组成的团队。但官方评测承认它不提高修 bug 的数量——这篇讲它真正值钱的地方和 Windows 的坑。"
author: 小吒
tags:
  - AI 编程
  - 开源
  - 教程
draft: false
ogImage: "/images/gstack-virtual-team-real.webp"
coverAlt: "多个 AI 角色图标组成的虚拟工程团队"
enSlug: "gstack-virtual-team"
---

给 AI 编程 Agent 配"团队"这件事，最近被 [gstack](https://github.com/garrytan/gstack) 带火了。

项目作者是 Y Combinator 的掌门人 Garry Tan。他把日常用的那套 Claude Code 工作流开源了——**23 个 slash 命令，全部 Markdown，MIT 协议，免费**。目前 **14.2 万 stars**。

但先泼一盆冷水，这盆冷水是**官方自己泼的**：

> 在 2026 年 11 月一项针对 100 个常见 GitHub bug 与功能的测试中，装了 gstack 的 Claude Opus 5.5 修好 58 个，没装的修好 61 个。gstack 没有带来提升。

所以这篇文章不会告诉你"装了它 AI 就变强了"。它不解决这个。它解决的是另一件事。

## 它真正解决什么

一个开发者要同时做产品判断、架构设计、代码审查、QA、安全审计、发版——这些角色互相冲突，一个人很难同时做好。AI Agent 也一样，一个 prompt 里让它"又当产品经理又当 QA"，结果通常两头都不像。

gstack 的做法是**把这些角色拆成独立的 skill，让每一步的产物喂给下一步**：

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

`/office-hours` 写的设计文档，`/plan-ceo-review` 会读；`/plan-eng-review` 写的测试计划，`/qa` 会接；`/review` 记录的问题，`/ship` 会在开 PR 前检查是否解决。

这是"流程"，不是"工具集合"。单个命令单拿出来用效果有限，串起来才是它的价值。

## 安装（约 30 秒）

需要 Claude Code、Git、Bun v1.4.2+。Windows 还额外需要 Node.js。

在 Claude Code 里粘贴这一段，剩下的交给它：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

然后在 `CLAUDE.md` 加一段（不需要列技能清单，Claude Code 会自己发现）：

```markdown
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
```

团队模式推荐开——自动更新、无版本漂移：

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

把 `required` 换成 `optional` 就只是提醒、不阻断。

## 四个命令先上手

官方建议**到此为止**，先看适不适合你，别一上来全装。

**1. `/office-hours`** — 从这儿开始。它会问六个问题，挑战你的问题框架，而不是照单全收你的功能描述。

官方文档里的例子很说明问题：你说想做一个"日历日报应用"，它听完你描述的痛点后说——你其实要的是一个"个人 Chief of Staff AI"，然后帮你从描述里抽出 5 个你没意识到的能力、挑战 4 个前提、给 3 个实现方案。

设计文档会自动喂给下游所有技能。

**2. `/review`** — 在任何有改动的分支上跑。它找的是**能通过 CI、但会在生产环境炸掉**的那类 bug：竞态条件、N+1 查询、被破坏的信任边界。明显的自动修，剩下的问你。

它还有个我很喜欢的机制：任何被削弱的测试、超时、快照、抑制规则，都会**点名送到人手里**，不会静默通过。

**3. `/qa`** — 给 staging URL，或者本地隔离的 API / CLI / job / webhook。它会开真浏览器、复现 bug、写失败的回归测试、修根因、重新验证再提交。

**4. `/ship`** — 同步 main、跑测试、审计覆盖率与门禁完整性、验证后推送并开 PR。PR 正文开头是三行大白话，写清跑了什么测试、审了什么。

要完整 sprint 时再加 `/autoplan`（CEO → 设计 → DX → 工程审查一条龙）和 `/ship`。

## 不止 Claude Code

`./setup` 默认只装 Claude Code，但它支持一堆 Agent：

- `--host codex`：OpenAI Codex CLI（实验级）
- `--host opencode` / `cursor` / `copilot` / `gemini`：对应各家 CLI
- `--host auto`：自动检测并安装到本机所有能识别的 Agent

安全等级有差异：Claude Code 是 **full**（真实工作流认证，hooks 强制拦截危险操作），其他大多是 **experimental**（安全规则多为建议、不强制）。这点要清楚——换 Agent 不等于换到同等保护。

## Windows 用户特别注意

这条很重要，因为中文读者里 Windows 占比高：

**Windows 11 开 Smart App Control 时，gstack 的编译二进制会被拒绝启动**，Git Bash 里报 `Permission denied`。原因是这些二进制在本机编译、没有签名（官方 issue #2595）。

两个解法：在 WSL 里跑，或者关掉 Smart App Control。

另外 Windows 上除了 Bun 还要装 Node.js——Bun 在 Windows 有个已知的 Playwright 管道传输 bug。原生 `/cso`（安全审计）还需要 PowerShell 7 和 VS2022 C++ 桌面开发工作负载，缺了就用不了，但 setup 会正常完成并明确告诉你哪个技能不可用。

macOS 和 Linux 是完整支持。

## 该怎么定位它

回到开头那个评测结论。

**gstack 不提高修 bug 的命中率，那它值什么？**

值在流程、审查、发版步骤和安全护栏。具体说：

- `/review` 找出测试漏掉的生产级问题
- `/ship` 把"这次到底验了什么"写进 PR，可审计
- `/careful` 在 rm -rf、DROP TABLE、force-push 之前拦一下；根目录递归删除和默认分支强推是**硬拒绝**
- `/freeze` 把编辑限制在一个目录内，调试时防止手滑改到别处

它是给**已经在认真做工程**的人用的——不是让 AI 写更多代码，是让 AI 写的代码更容易被审查、被追溯、被安全地上线。

如果你只是偶尔让 AI 写个小工具，这套仪式感确实过重。如果你在维护要上线的东西，`/review` + `/qa` + `/ship` 这三步值得单独试。

顺带一提，它默认不发遥测；更新检查默认开但可以关；跨模型审查默认开（会把代码发给 Codex 或 Claude Code，用你自己的登录），也可关。每次对外发送都有收据可查。

---

**参考**

- [garrytan/gstack 官方仓库](https://github.com/garrytan/gstack)
- [官方评测数据与更正说明](https://github.com/garrytan/gstack-evals)
- [gstack 安装与平台说明](https://github.com/garrytan/gstack/blob/main/docs/install.md)
