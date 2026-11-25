---
title: "给 Claude Code 配几个帮手：gstack 从装到用"
pubDatetime: "2026-11-24T00:00:00.000Z"
description: "你让 AI 写完一个功能，测试全绿，一上线就炸——问题出在它自己审自己。gstack 是给 Claude Code 用的一套工作流，把想需求、审代码、测试、发版拆成 23 个命令一步一步做。这篇从一次踩坑讲起，教你怎么装、先用哪四个命令，以及 Windows 上一定会碰到的坑。"
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

你有没有让 AI 帮你写完一个功能，代码看着挺像样，结果一上线就出问题——测试一路全绿，偏偏到生产环境就炸？回头让它自己审一遍，它把自己写的东西夸得天花乱坠。

[gstack](https://github.com/garrytan/gstack) 就是冲着这个麻烦来的。作者是位创业者，把自己日常用的 Claude Code 工作流开源了：23 个 slash 命令，全是 Markdown，MIT 协议，免费。说白了，它给 AI 配了个分工明确的小团队。

不过有一件事得先说清楚：它不会让你修的 bug 变多。官方自己做过测试——2026 年 11 月拿 100 个常见的 GitHub bug 和功能来跑，装了 gstack 的 Claude Opus 5.5 修好 58 个，没装的修好 61 个，基本没差别。所以它解决的不是"让 AI 更强"，而是另一件事。

这就有点像办比赛：你不会让同一个人又当裁判又当运动员——他既想赢，又得判自己犯没犯规，结果谁都不信。写代码也一样，让一个 prompt 里的 AI 又当产品经理又当 QA，通常两头都不像。gstack 的做法是把角色拆开，每一步的产物喂给下一步：

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

`/office-hours` 写的设计文档，`/plan-ceo-review` 会读；`/plan-eng-review` 写的测试计划，`/qa` 会接；`/review` 记录的问题，`/ship` 会在开 PR 前检查是否解决。单个命令拿出来用，效果有限；串起来才是它的价值。

## 装上，先跑四个命令

需要 Claude Code、Git、Bun v1.4.2+，Windows 还得多装一个 Node.js。

在 Claude Code 里粘贴这一段，剩下的交给它：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

然后在 `CLAUDE.md` 加一段（不用列技能清单，Claude Code 会自己发现）：

```markdown
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
```

团队模式推荐开——自动更新，不会出现版本对不上：

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

把 `required` 换成 `optional`，就只是提醒、不阻断。

官方建议先拿四个命令上手，到此为止，看看适不适合你，别一上来全装。

**1. `/office-hours`** — 从这儿开始。它会问六个问题，挑你说法里的毛病，而不是照单全收你的功能描述。官方文档里的例子挺说明问题：你说想做一个"日历日报应用"，它听完你描述的痛点后说，你其实要的是一个"个人 Chief of Staff AI"，然后帮你从描述里抽出 5 个你没意识到的能力、挑战 4 个前提、给 3 个实现方案。设计文档会自动喂给下游所有技能。

**2. `/review`** — 在任何有改动的分支上跑。它专找那种能过 CI、却会在生产环境炸掉的 bug：竞态条件、N+1 查询、被破坏的信任边界。明显的自动修，剩下的问你。还有个我挺喜欢的机制：任何被削弱的测试、超时、快照、抑制规则，都会点名送到人手里，不会悄悄放过。

**3. `/qa`** — 给它一个 staging 地址，或者本地隔离的 API / CLI / job / webhook。它会开真浏览器、复现 bug、写失败的回归测试、修根因、重新验证再提交。

**4. `/ship`** — 同步 main、跑测试、审计覆盖率和门禁完整性，验证后推送并开 PR。PR 正文开头是三行大白话，写清跑了什么测试、审了什么。

要跑完整流程时，再加 `/autoplan`（CEO → 设计 → DX → 工程审查一条龙）和 `/ship`。

`./setup` 默认只装 Claude Code，其实还支持一堆 Agent：`--host codex` 是 OpenAI Codex CLI（实验级）；`--host opencode` / `cursor` / `copilot` / `gemini` 对应各家 CLI；`--host auto` 会自动检测、装到本机所有能认出来的 Agent 上。

## 它真正省心的地方

省心的地方不是"写得更多"，而是"发得更稳"。具体说：

- `/review` 找出测试漏掉的生产级问题
- `/ship` 把"这次到底验了什么"写进 PR，能倒查
- `/careful` 在 `rm -rf`、`DROP TABLE`、force-push 之前拦一下；根目录递归删除和默认分支强推是直接拒绝
- `/freeze` 把编辑限制在一个目录内，调试时防止手滑改到别处

还有几个默认设置你可以放心：它默认不发遥测；更新检查默认开但可以关；跨模型审查默认开（会把代码发给 Codex 或 Claude Code，用你自己的登录），也能关。每次对外发送都有收据可查。

## 你会撞上的几件事

**换 Agent 不等于换到同等保护。** 安全等级不一样：Claude Code 是 full（真实工作流认证，hooks 强制拦截危险操作），其他大多是 experimental（安全规则多为建议、不强制）。这点得清楚。

**Windows 用户得多留个心眼。** Windows 11 开着 Smart App Control 时，gstack 编译出来的二进制会被拒绝启动，Git Bash 里报 `Permission denied`——因为这些二进制在本机编译、没签名（官方 issue #2595）。要么在 WSL 里跑，要么把 Smart App Control 关掉。另外 Windows 上除了 Bun 还得装 Node.js——Bun 在 Windows 有个已知的 Playwright 管道传输 bug。原生的 `/cso`（安全审计）还需要 PowerShell 7 和 VS2022 C++ 桌面开发工作负载，缺了就用不了，不过 setup 会正常完成，并明确告诉你哪个技能不可用。macOS 和 Linux 是完整支持。

## 什么时候别用

如果你只是偶尔让 AI 写个小工具，这套仪式感确实过重，没必要。如果你在维护要上线的东西，`/review` + `/qa` + `/ship` 这三步值得单独试试，不用整套上。

## 说到底

它不帮你把 bug 修得更多，但能让你写的代码更容易被审查、被追溯、被安全地上线。慢一点，稳一点——这笔账值不值，看你维护的东西有多重要。

---

**参考**

- [garrytan/gstack 官方仓库](https://github.com/garrytan/gstack)
- [官方评测数据与更正说明](https://github.com/garrytan/gstack-evals)
- [gstack 安装与平台说明](https://github.com/garrytan/gstack/blob/main/docs/install.md)
