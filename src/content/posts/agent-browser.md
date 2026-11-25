---
title: "让 AI 自己学会点网页：agent-browser 从装到用"
pubDatetime: "2026-11-25T00:00:00.000Z"
description: "你让 AI 帮你在网上办事，它却看不懂网页。agent-browser 把几万行网页代码压成一张「现在能点什么」的清单，AI 照着编号点就行。这篇从一次真实任务讲起，教你怎么装、怎么跑，以及真上手后一定会碰到的四个情况。"
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

你有没有让 AI 帮你在网上办过事——查一个要点三层才能看到的订单状态，或者在一堆弹窗和"同意 Cookie"横幅里找出那个真正的按钮？

大多数时候它卡在第一步：它认识文字，但"看"不懂网页。你让它点"提交"，它压根不知道那个按钮藏在哪。

以前的做法是把整页源代码一股脑塞给它。一个普通网页几万行，又贵又乱；好不容易写出一个精准的定位 `.RepoList-item .f3 a`，网站下次改版就全废。

[agent-browser](https://github.com/vercel-labs/agent-browser) 换了个思路。特别像你带一个新同事上手：

你不会把整本网站源码打印给他，你会说——"这页上现在能点的东西我都列好了，一共五个，第一个是登录，第二个是搜索。要点哪个，报编号就行。"

它做的就是这件事：**不读源码，读一张"现在能点什么"的清单；不写复杂定位，用编号操作。**

## 先跑起来看看

两行命令装好：

```bash
npm install -g agent-browser
agent-browser install
```

第二行只在第一次运行时需要，它去下载一个专用的 Chrome。（macOS 也能用 `brew install`；Linux 加 `--with-deps` 会把缺的系统依赖一起装好；只是想试试手，就 `npx agent-browser open example.com`，什么都不用装。）

然后你就能像给人下指令一样，一条一条来：

```bash
agent-browser open example.com
agent-browser snapshot -i       # 列出这页上所有能点的东西，每个带一个编号
agent-browser click @e1         # 点清单里的第 1 个
agent-browser get url           # 看看点完到哪了
agent-browser close
```

`snapshot -i` 返回的东西长这样：

```text
- link "Learn more" [ref=e1]
```

翻成人话："这页上有个写着 Learn more 的链接，编号 e1。"

AI 看懂了，点 `@e1`，再拍一张新清单看看变成什么样，接着点下一个。整个过程中浏览器一直开着——后台有个常驻进程替你操纵它，不会每条命令都重新开一次。

核心就这么多。剩下的都是细节。

## 你不必每次都把用法教一遍

真正省心的地方在这里：让它自己去取一份说明书。

```bash
agent-browser skills get core
```

这条命令会吐出一份跟本机版本完全对得上的用法说明——怎么拍清单、怎么等操作、常用流程走法。你把它交给你的 AI 框架，它就知道该怎么用这个工具了：

```bash
npx skills add vercel-labs/agent-browser
```

或者写进 `AGENTS.md`：

```markdown
Use `agent-browser` for browser automation. Before the first use, run
`agent-browser skills get core` and follow it.
```

不用你手抄一大段提示词，也不用担心说明书和工具版本对不上——它运行时才去取，永远是最新的那份。

## 真上手后，你会撞上这四件事

这部分网上教程很少讲，但它们是"能不能顺利用起来"的关键。

**1. 编号这套，只有 Chrome 能用。**

换成 Safari 或者其他内核，清单和编号就失灵了，得退回老办法（CSS 选择器）。这是官方更新日志里写明的现状，不是 bug——它目前就只认 Chrome 系。

**2. 页面一跳，手里的编号就作废了。**

你拍清单的那一刻，编号对应的是当时的页面。点完之后跳到新页面，旧编号还在你手里，但指的可能已经不是原来那个东西了。老版本会闷头点错，0.44 之后改成直接报错，叫你重新拍。你要是从网上抄到很旧的脚本，就会莫名其妙地点错地方。

**3. 按钮被挡住，它是真点不了。**

页面上盖了一层 Cookie 提示、按钮在屏幕外面、或者根本就是灰的——`click` 会老老实实失败，不会假装成功。这是好事。但这意味着你的 AI 得会处理失败：先把遮挡层关掉，重新拍清单，再点一次。一心以为"点一下就完事"的脚本会动不动就断。

**4. 浏览器闲太久会自己关。**

一小时没有命令，后台那个常驻进程就退出，浏览器也跟着关。任务隔得久，要自己把它叫醒，或者用 `--session` 把状态存下来。

把这四条提前写进你的错误处理，比背十遍操作流水账有用。

## 顺带说个数字

你大概会看到"省 93% token"这个说法，中文文章里几乎篇篇都有。我把官方 README 和文档翻了一遍，没找到这个数字的出处。

它大概是从"只读一张可点清单、不读整页源码"推出来的一个量级感觉。当个直觉可以，别当官方承诺——在你自己的页面上测出来的数字，才是能用的数字。

## 什么时候不用它

- **流程固定、要跑成千上万遍的爬取或回归测试**：用 Playwright。它适合"需要自己判断下一步点哪"的任务，不是拿来替代写死脚本的。
- **只想拿页面正文、完全不点击**：直接解析网页，开个浏览器太重了。
- **一定要用编号、却又想换浏览器内核**：先跑 `agent-browser doctor` 验一遍，别白忙活。

## 说到底

它解决的就是一件事：让 AI 看得懂"这页现在能点什么"，然后拿着编号一步步往前走。

好用，但不是魔法。编号绑 Chrome、跳页就失效、被挡住会失败、闲久了自己关——这四件事提前放进你的预案里，它就稳了。

---

**参考**

- [agent-browser 官方仓库](https://github.com/vercel-labs/agent-browser)
- [官方文档](https://agent-browser.dev)
- [官方更新记录](https://github.com/vercel-labs/agent-browser/blob/main/CHANGELOG.md)
