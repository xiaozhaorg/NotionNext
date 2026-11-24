---
title: "agent-browser 实战：给 AI 一个真能操作的浏览器，先看清这 4 个坑"
pubDatetime: "2026-11-25T00:00:00.000Z"
description: "Vercel 开源的 agent-browser 已到 5.3 万星。它的 snapshot + @e1 引用循环确实优雅，但中文教程集体回避了几件事：ref 只有 Chrome 内核能用、页面一跳 ref 就失效、被遮挡的点击会真的失败。附官方命令与适用边界。"
author: 小吒
tags:
  - AI 编程
  - 开源
  - 工具
draft: false
ogImage: "/images/agent-browser-real.webp"
coverAlt: "终端里一条条命令驱动浏览器，页面元素带 @e1 编号标记"
enSlug: "agent-browser"
---

让 AI 操作网页，最笨也最常见的办法是让它读整页 HTML，然后写 CSS 选择器去点按钮。

一个普通页面的 DOM 几万行，全塞进上下文，token 直接爆炸；好不容易写出的 `.RepoList-item .f3 a`，页面一改版就全废。

[agent-browser](https://github.com/vercel-labs/agent-browser) 是 Vercel Labs 给出的答案：**不读 HTML，读页面快照；不写选择器，用编号引用。** 它目前 **5.37 万 stars**、Rust 写的原生 CLI、Apache-2.0 协议。

原理很简单，效果很惊艳。但网上教程几乎都在复读同一套"四步工作流"，有几个真正会影响你能否用起来的限制，基本没人写。这篇补上。

## 核心循环：拍快照 → 用编号操作 → 再拍

```bash
agent-browser open example.com
agent-browser snapshot -i       # 只列可交互元素，每个带一个 ref
agent-browser click @e1         # 操作上一步快照里的编号
agent-browser get url           # 确认结果
agent-browser close
```

`snapshot` 返回的不是 DOM，而是一份紧凑的可访问性树：

```text
- link "Learn more" [ref=e1]
```

Agent 看到的是"页面上有个叫 Learn more 的链接，编号 e1"，跟人看到界面差不多。它点 `@e1`，再拍一次快照确认变化，循环往复。

**浏览器在两条命令之间不会关闭**——后台有个常驻 daemon 通过 CDP 控制浏览器，每条命令就是一次很短的 shell 调用。这才是它能被 Agent 一条条驱动的前提。

## 安装

```bash
npm install -g agent-browser
agent-browser install           # 首次下载 Chrome for Testing
```

也支持 `brew install agent-browser`（装完仍需跑一次 `agent-browser install`）；Linux 用 `agent-browser install --with-deps` 连系统依赖一起装；临时用可以 `npx agent-browser open example.com`，不装。

原生二进制覆盖 macOS（ARM64/x64）、Linux（ARM64/x64，glibc 与 musl）和 Windows（x64），npm 包会自动选对应版本。

## 引用不止一种写法

`snapshot -i` 给的是编号，但不是只能用编号。CSS 选择器、文本、XPath、语义定位器都能直接操作，比如按角色找按钮：

```bash
agent-browser find role button click --name "Submit"
```

编号用完要重新拍：`ref` 描述的是**拍快照那一刻**的页面。导航之后、DOM 变了之后，旧编号不再可靠。

## 4 个没人告诉你的限制

**1. ref 快照只有 Chrome 内核支持。** 这是官方变更日志里写死的：加入 Ladybird 引擎时明确说明 "Snapshots and refs stay Chrome-only, as with Safari"。也就是说你切到 Safari 或 Ladybird，最核心的"编号引用"这套就失效了，得退回选择器。很多教程把 ref 机制吹成通用能力，实际它绑死在 Chrome 上。

**2. 页面一跳，旧 ref 就作废。** 早期版本遇到整页加载或 iframe 重定向，会拿着旧 ref 去点一个早就不是原来的元素——静默误操作。0.44.0 才改成报 "no longer loaded" 错误，强制你重新拍快照。如果你在网上抄到很老的脚本，这个坑会莫名其妙地点错东西。

**3. 点击被挡住时，它是真的失败。** 目标元素被隐藏、被禁用、在视口外，或者被 cookie 同意横幅盖住，`click` 会直接失败而不是回报成功。这是好事——但意味着你的 Agent 必须处理失败分支：关掉遮挡层、重新拍快照、再点。指望"点一下就完事"的脚本会频繁中断。

**4. daemon 一小时没命令就退出。** 默认无命令一小时，headless 浏览器关闭、daemon 退出（配了 session 持久化会先存状态）。长间隔的任务要自己唤醒或显式管理会话。每个 `--session` 有独立的 daemon 和浏览器。

## 给 Agent 用，不只是给人用

它内置了跟 CLI 版本配套的 skills，这是很聪明的设计——装的技能只是一层薄壳，运行时才去拉 `skills get core` 的内容，所以指令永远和本机 CLI 版本对得上：

```bash
agent-browser skills get core                 # 核心循环、ref、等待、常用流程
agent-browser skills get core --ref commands  # 单独取一份完整命令清单
agent-browser skills get core --full          # 连命令参考和模板一起给
agent-browser skills list                     # electron、slack、dogfood 等专项技能
```

给 Agent 框架装发现技能：

```bash
npx skills add vercel-labs/agent-browser
```

或者写进 `AGENTS.md`：

```markdown
Use `agent-browser` for browser automation. Before the first use, run
`agent-browser skills get core` and follow it.
```

MCP 客户端可以直接 `agent-browser mcp` 起一个 stdio 的 MCP server。此外还有 `batch` 批量执行、`record` 录屏、`diff` 对比、`trace`/`profiler`/`vitals` 调试，以及 `webmcp`、`flow`、`chat` 等一整套面向 Agent 的命令——`agent-browser --help` 能看到九大类。

引擎也不止 Chrome for Testing：`--cdp` 或 `--auto-connect` 接管已运行的 Chrome，`--engine` 切 Lightpanda / Obscura，iOS 模拟器里驱动 Mobile Safari，或接 Browserbase、Browserless、Browser Use、Kernel、AgentCore 这些云浏览器服务。云服务和多引擎的代价是，前面说的 ref 机制未必可用。

## 关于"省 93% token"

中文社区文章几乎都会写"官方数据显示上下文消耗减少约 93%"。我翻了官方 README 和文档首页，**没有找到这个数字的任何出处**。

它大概率是对"只读可交互元素快照、不读整页 DOM"这一机制的估算或转述。作为量级直觉可以，别当成官方承诺的硬指标——你在自己真实页面上测出来的数字，才是能用的数字。

## 什么时候别用它

**稳定流程的批量爬取和回归测试，用 Playwright。** agent-browser 的定位从来不是替代 Puppeteer/Playwright，而是给"需要自己判断下一步点哪"的 Agent 一个低上下文消耗的操作接口。流程固定、要跑成千上万次、追求确定性和速度，写 Playwright 脚本更合适。

**需要 ref 快照却不想被绑在 Chrome 上，先用 `agent-browser doctor` 验一遍。** 多引擎支持看着热闹，但快照和编号只有 Chrome 能用，切引擎前先确认你的流程真的不依赖它。

**纯信息抽取、不点击。** 只是拿页面正文，一个轻量 HTML 解析 + 正文提取比开浏览器便宜得多。

## 小结

agent-browser 真正解决的是"AI 怎么看页面、怎么点元素"：把几万行 DOM 压成一份带编号的短快照，让 Agent 用一条条 shell 命令推进。

它好用，但不是魔法——ref 绑 Chrome、跳页即失效、遮挡会失败、daemon 会超时。把这四条提前放进你的错误处理，比背十遍四步工作流有用。

---

**参考**

- [vercel-labs/agent-browser 官方仓库](https://github.com/vercel-labs/agent-browser)
- [agent-browser.dev 官方文档](https://agent-browser.dev)
- [官方 CHANGELOG](https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md)
- [稀土掘金：agent-browser 让 AI 像人一样浏览网页](https://juejin.cn/post/7594662879201460250)
