---
title: "让 AI 按你的规矩办事：Agent Skills 从写到用"
pubDatetime: "2026-11-28T00:00:00.000Z"
description: "同一件事做到第五遍，就该把它写成一个 Skill。Skill 是一份给 AI 看的岗位手册：告诉它这活怎么干、什么时候该上。这篇从那个重复的场景讲起，教你怎么写、写的时候留意什么，以及什么时候其实不用写。"
author: 小吒
tags:
  - AI
  - 开源
  - 教程
draft: false
ogImage: "/images/agent-skills-real.webp"
coverAlt: "一个 SKILL.md 文件夹展开为元数据、指令与脚本三层结构"
enSlug: "agent-skills"
---

同一件事你做第五遍的时候，心里大概会冒出一句：怎么又是它。固定格式的周报、某类 API 的调试流程、某种文档一遍遍要调的排版——每次都得从头跟 AI 讲一遍规矩，讲完它还不一定照做。

这时候有个省事的办法：把它写成一个 Skill（技能）。

Skill 就是一份给 AI 看的岗位手册。像带新同事一样想就明白了：你不会每次派活都把公司历史从头讲一遍，你会写份手册放他桌上——这活儿是干什么的、什么情况该接手、具体分几步、遇到特殊状况翻哪一页。AI 拿到 Skill 是同一个道理，不用把整本背下来，需要的时候翻到对应那页就行。

## 你现在就能写一个

一个 Skill 就是一个文件夹，里面放一个 `SKILL.md`：开头一段 YAML frontmatter 写清楚"这是干嘛的、什么时候用"，后面用 Markdown 写具体步骤。`scripts/`、`references/`、`assets/` 这些目录都可选，用到再建。

frontmatter 里的字段就这几个：

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | 是 | 1–64 字符，小写字母/数字/连字符，须匹配目录名 |
| `description` | 是 | 1–1024 字符，非空，写清做什么 + 何时用 |
| `license` | 否 | 许可证名或指向打包的许可证文件 |
| `compatibility` | 否 | ≤500 字符，仅当有环境要求时才写 |
| `metadata` | 否 | 任意字符串键值映射 |
| `allowed-tools` | 否 | 空格分隔的预授权工具，实验性，各端支持不一 |

一个最小可用的样子：

```markdown
---
name: pdf-processing
description: Extracts text and tables from PDFs, fills PDF forms, merges files. Use when working with PDF documents or when the user mentions PDFs, forms, or extraction.
---

# PDF Processing

## Overview
[任务目标，一两句话]

## Steps
1. 运行 `scripts/extract.py <pdf>` 提取文本
2. 如需填表，参见 [forms.md](references/forms.md)
3. 校验输出字段完整性

## Edge cases
- 扫描件无文本层：先 OCR
```

目录长这样：

```text
pdf-processing/
├── SKILL.md          # 必需
├── scripts/          # 可选：可执行代码
├── references/       # 可选：参考文档
└── assets/           # 可选：模板、图片、数据
```

## 它真正省心的地方

Skill 能"随身带一本百科全书，又不把上下文撑爆"，靠的是分三层加载。这点特别适合用书架来想：

1. **元数据（约 100 tokens）**：启动时只把每个 Skill 的 `name` + `description` 报上来——就像在书架前只扫一眼书脊上的标题简介，够你判断"哪本可能用得上"，并不抽书。
2. **指令（建议 < 5000 tokens）**：确认确实相关了，才把整本 `SKILL.md` 抽出来读。主文件官方建议**不超过 500 行**。
3. **资源（按需）**：`scripts/`、`references/`、`assets/` 里的东西，用到才翻、才跑。

Anthropic 工程博客里有个点很关键：有文件系统、能跑代码的 AI，不必把整个 Skill 读进上下文——脚本直接执行、PDF 直接解析，两者都不占上下文。所以能塞进 Skill 的上下文规模，其实不被单个窗口卡死。

还有一条容易被忽略的账：**跑代码比让模型吐 token 便宜得多**。原文举的例子是排序——用模型生成 token 去排一个列表，远比直接跑个排序算法贵。所以 Skill 里的脚本不只是"文档"，更是确定性的工具：排序、解析、格式校验这类活，老老实实交给代码做。

## 写的时候留意这几点

**`name` 跟目录名对上，别当标题写。** 它只能是小写字母、数字和连字符，1–64 字符，不能以连字符开头或结尾，也不能有连续连字符。目录叫 `product-bullet-extractor`，`name` 就得老老实实写成 `product-bullet-extractor`，别写成 `Product Bullet Extractor` 那样带空格大写的样式。

**`description` 要写"做什么"和"什么时候用"。** 它不只是介绍，更是触发开关——系统提示里只加载这个字段，AI 靠它判断要不要用你的 Skill。像"帮我处理 PDF"就太糊。翻成好用的一句话是 `Extracts text and tables from PDFs, fills forms. Use when handling PDF documents or when the user mentions PDFs, forms, or document extraction.` 把用户真会说的词（PDF、表单、提取、合并）放进去，但别堆太多，堆多了反而容易误触发。

**它是补充 MCP，不是替代 MCP。** Skill 是一个文件夹，不是"更长的提示词"。官方的说法是 Skills 可以 complement（补充）MCP server——教 AI 怎么把用到外部工具的复杂流程串起来。两者是配合，不是谁取代谁。

**正文别一股脑全塞进去。** 判断标准很简单：这段内容是不是每次激活都得用？是就留在 `SKILL.md`；只在特定场景才用、或者是一大段 API 参考、模板、检查清单，就拆到 `references/` 或 `scripts/`，正文留一句相对路径链接。文件引用从 Skill 根目录算起，而且只嵌一层——别搞 A 链 B 链 C，AI 不会顺着迷宫找。

**写完跑一遍校验。** 官方提供了参考工具 `skills-ref`：

```bash
skills-ref validate ./my-skill
```

它会检查 frontmatter 是否合法、命名是否符合约定。放进客户端前跑一下，能挡掉大部分"写完死活不触发"的情况。调试时还可以用 `/技能名` 手动触发，绕过语义匹配先验证正文流程对不对，再回到自然语言看 description 命不命中。没触发就改 description，触发了却做错就改正文。

## 什么时候别做 Skill

- **只做一次的事**：写 Skill 的成本比直接做一遍还高。
- **一段提示词就能说清的**：别为了"看起来规范"专门建个文件夹。
- **要实时数据或强状态的**：Skill 擅长打包流程、规则、模板这类程序性知识，不擅长当数据库；这类需求该配 MCP 或真后端。
- **还没看过 AI 在哪卡住的**：官方第一条建议就是"从评估开始"——先跑真实任务，看它在哪缺上下文，再写 Skill 补那个洞，别凭想象预先塞满知识。

## 说到底

Skill 不是"给 AI 一段更长的提示词"，而是把一套能复用的流程，按触发（description）→ 指令（SKILL.md）→ 资源（按需文件）三层装好，让它在对的时候用到对的小块。

`name` 跟目录对上、`description` 写清何时用、正文守住 500 行、细节拆到 references、写完用 `skills-ref` 过一遍——这几条比任何"20 行代码让 AI 质量翻倍"的标题都实在。

---

**参考**

- [Agent Skills 官方规范](https://agentskills.io/specification)
- [Agent Skills 官网与支持客户端](https://agentskills.io/)
- [anthropics/skills 官方仓库](https://github.com/anthropics/skills)
- [Anthropic 工程博客：Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
