---
title: "Agent Skills 按官方规范写：你抄的那份教程，字段可能就是错的"
pubDatetime: "2026-11-28T00:00:00.000Z"
description: "Anthropic 的 skills 仓库已到 20 万星，Agent Skills 也成了开放标准。但中文教程里 name 写成带空格的标题、description 只写功能不写何时用——按官方 spec 这些全是错的。这篇按 agentskills.io 规范和 Anthropic 工程博客逐条校准，附字段约束、渐进式披露和校验命令。"
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

如果你重复做过五次以上的同一件事——固定格式的周报、某类 API 的调试流程、某个文档的排版规则——大概已经听过一句话：**把它写成一个 Skill**。

[Anthropic 的 skills 仓库](https://github.com/anthropics/skills)现在 **19.9 万 stars**，是 GitHub 上星数最高的项目之一。更重要的是它背后那套东西已经不专属 Claude 了：**Agent Skills 是开放标准**（[agentskills.io](https://agentskills.io)），Cursor、VS Code、GitHub Copilot、Gemini CLI、OpenCode、TRAE、Codex 等几十个客户端都在支持。写一次，到处能用。

中文教程已经把"什么是 Skill""怎么写第一个 Skill"讲了个遍。这篇不重复那些，只做一件事：**按官方规范逐条校准**——因为我在几篇高赞教程里看到的写法，有好几处是明确违反 spec 的。

## 先纠正三个高频错误

**1. `name` 不是显示标题。** 有教程写 `name: "Product Bullet Extractor"`——大写、空格、引号，按官方 spec **全部非法**。规则是：1–64 字符，只能小写字母/数字/连字符，不能以连字符开头或结尾，不能有连续连字符，而且**必须和父目录名完全一致**。目录叫 `product-bullet-extractor`，name 就得是这个。

**2. `description` 不只是介绍，它是触发开关。** 教程常写 `description: 帮我处理 PDF`——太糊。官方要求 1–1024 字符，并且**同时说明"做什么"和"什么时候用"**，还要带上能帮助 Agent 识别任务的关键词。正确写法是：`Extracts text and tables from PDFs, fills forms. Use when handling PDF documents or when the user mentions PDFs, forms, or document extraction.` 系统提示里只加载这个字段，Agent 靠它判断要不要触发——写不好，你的 Skill 就永远不会被调用。

**3. Skills 不是"更长的 Prompt"，也不替代 MCP。** Skill 是一个**文件夹**：`SKILL.md` 是入口，`scripts/`、`references/`、`assets/` 按需挂载。Anthropic 官方对 MCP 的措辞是 Skills 可以 **complement（补充）** MCP server，教 Agent 如何编排涉及外部工具的复杂工作流——不是取代关系。

## 官方 spec 的字段，一次说清

`SKILL.md` 必须有 YAML frontmatter + Markdown 正文。字段如下：

| 字段 | 必需 | 约束 |
| --- | --- | --- |
| `name` | 是 | 1–64 字符，小写字母/数字/连字符，须匹配目录名 |
| `description` | 是 | 1–1024 字符，非空，写清做什么 + 何时用 |
| `license` | 否 | 许可证名或指向打包的许可证文件 |
| `compatibility` | 否 | ≤500 字符，仅当有环境要求时才写 |
| `metadata` | 否 | 任意字符串键值映射 |
| `allowed-tools` | 否 | 空格分隔的预授权工具，**实验性**，各端支持不一 |

一个最小可用示例：

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

目录结构：

```text
pdf-processing/
├── SKILL.md          # 必需
├── scripts/          # 可选：可执行代码
├── references/       # 可选：参考文档
└── assets/           # 可选：模板、图片、数据
```

## 核心机制：渐进式披露（这才是重点）

Skill 之所以能"随身带百科全书又不撑爆上下文"，靠的是三层加载：

1. **元数据（约 100 tokens）**：启动时只把所有 Skill 的 `name` + `description` 塞进系统提示——够判断"什么时候用"，不加载全文。
2. **指令（建议 < 5000 tokens）**：Agent 判断任务相关，才读完整 `SKILL.md`。官方建议主文件 **不超过 500 行**。
3. **资源（按需）**：`scripts/`、`references/`、`assets/` 里的文件，用到才读、才执行。

Anthropic 工程博客里有句很关键的话：有文件系统和代码执行能力的 Agent，**不必把整个 Skill 读进上下文**——脚本可以直接执行，PDF 可以直接解析，两者都不进上下文。所以"能打包进 Skill 的上下文规模实际上是不受单个窗口限制的"。

还有一条最容易被忽略的 token 原则：**代码执行比用 token 生成结果便宜得多**。原文举例：用模型生成 token 去给列表排序，远比直接跑一个排序算法昂贵。Skill 里的脚本不只是"文档"，更是确定性工具——排序、解析、格式校验这类事，让代码做。

**注意**：官方从未给出"Skills 节省 X% token"这类数字。网上任何百分比都别当官方数据——这一点和[上一篇 LightRAG 戳破"准确率飙升 30%"](/article/lightrag-rag)是一个道理。

## description 怎么写才能可靠触发

这是决定成败的一步，按官方建议：

- **写全触发场景**：既说功能，也说"当用户提到 X、要求做 Y 时使用"。
- **关键词要具体**：把用户真会说的词放进去（PDF、表单、提取、合并），别只写抽象描述。
- **别贪多**：触发词堆一大堆会稀释语义匹配，反而误触发。
- **测试时用手动触发**：输入 `/技能名` 绕过语义匹配，先验证正文流程对不对；再回到自然语言验证 description 是否命中。

调试循环很简单：没触发 → 改 description；触发了但做错 → 改正文步骤。

## 什么时候正文该拆出去

判断标准：**这段内容是不是每次激活都必须用？**

是 → 留在 `SKILL.md`。否（只在特定场景用、或是长 API 参考/模板/检查清单）→ 拆到 `references/` 或 `scripts/`，正文留一句相对路径链接。官方明确说：如果几块上下文互斥或很少同时用，**分开存能直接降低 token 消耗**。

文件引用保持从 Skill 根目录起的相对路径，且**只嵌一层**——别搞 A 链 B 链 C 的深嵌套，Agent 不会顺着迷宫找。

## 写完先校验

官方提供了参考校验工具 `skills-ref`：

```bash
skills-ref validate ./my-skill
```

它会检查 frontmatter 是否合法、命名是否符合约定。放进客户端前先跑一遍，能挡掉大部分"写完死活不触发"的低级问题。

Anthropic 自带的 [`skills`](https://github.com/anthropics/skills) 仓库就是最好的样板库——从文档处理（docx/pdf/pptx/xlsx，Apache-2.0 开源）到网页测试、MCP server 生成，都是生产级参考。但要看清官方免责声明：这些是**演示和教育用途**，你实际从 Claude 得到的行为可能和示例不同，关键任务务必自己充分测试。

## 什么时候别做 Skill

- **只做一次的事**：写 Skill 的成本比直接做一遍高。
- **纯靠一段提示词就能说清的**：别为了"看起来规范"建文件夹。
- **需要实时数据或强状态的**：Skill 擅长打包程序性知识（流程、规则、模板），不擅长当数据库；这类需求该配 MCP 或真实后端。
- **还没观察过 Agent 在哪卡住**：官方第一条建议就是"从评估开始"——先跑真实任务，看它在哪缺上下文，再写 Skill 补那个洞。别凭想象预先塞满知识。

## 小结

Skill 的本质不是"给它一段更长的提示词"，而是把一套可复用工作流，按**触发（description）→ 指令（SKILL.md）→ 资源（按需文件）**三层组织起来，让 Agent 在正确的时候用到正确的那一小块。

按官方 spec 写：`name` 匹配目录名、`description` 写清何时用、正文控制在 500 行内、细节拆到 references、写完用 `skills-ref` 校验。这几条比"20 行代码让 AI 质量翻倍"的标题有用得多。

---

**参考**

- [Agent Skills 官方规范](https://agentskills.io/specification)
- [Agent Skills 官网与支持客户端](https://agentskills.io/)
- [anthropics/skills 官方仓库](https://github.com/anthropics/skills)
- [Anthropic 工程博客：Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
