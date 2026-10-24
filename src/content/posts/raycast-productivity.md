---
title: Raycast 效率神器完全指南：彻底取代 Spotlight，Mac 用户必装
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: Raycast 是 Mac 上最强效率工具。本文详解安装与快捷键改造、必备扩展推荐、自定义脚本、AI 集成与 Snippets，让你彻底告别 Spotlight。
author: 小吒
tags:
  - 开发工具
  - 免费工具
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/raycast-productivity"
ogImage: "/images/raycast-productivity-real.jpg"
coverAlt: "MacBook 旁摆放着耳机与音乐播放器界面"
enSlug: "raycast-productivity"
---

Mac 自带的 Spotlight 能搜文件、算数学、开应用，但也就到此为止了。**Raycast** 把它变成了一个可编程的效率平台：启动器 + 工具集 + 脚本运行器，而且免费版就足够强。

这篇讲安装配置、必备扩展和自定义脚本。

## 为什么选 Raycast

- **启动极快**：输入响应几乎没有延迟，比 Spotlight 跟手
- **扩展生态丰富**：几千个社区扩展，剪贴板、窗口管理、Git、GitHub、待办……
- **内置工具全**：剪贴板历史、窗口管理、计算器、单位换算、Emoji 搜索，开箱即用
- **可编程**：支持 JavaScript / Bash / Python / Swift 脚本，等于一个常驻的脚本启动器
- **AI 集成**：内置 AI 命令，可接 ChatGPT / Claude
- **免费版够用**：个人使用核心功能全免费，Pro 是团队协作和 AI 额度

**一句话**：Spotlight 是"搜索工具"，Raycast 是"操作系统的命令行"。

## 安装与快捷键

从 [raycast.com](https://www.raycast.com) 下载安装。

装完第一件事——**改快捷键**：

1. 打开 Raycast 设置 → **General**
2. **Hotkey** 改成 `⌥ Space`（Option + Space）
3. 去 **系统设置 → 键盘 → 键盘快捷键 → 聚焦**，把 Spotlight 的 `⌘ Space` 关掉或改掉

为什么用 `⌥ Space`：拇指自然位置，且不和系统快捷键冲突。这个改动是"从 Spotlight 迁移到 Raycast"的关键一步——不改快捷键，你永远会习惯性按回 `⌘ Space`。

## 必备扩展

### 效率类

| 扩展 | 作用 |
|---|---|
| **Clipboard History** | 剪贴板历史，`⌘⌥V` 调出，支持搜索和置顶 |
| **Window Management** | 窗口分屏、移动到其他显示器，快捷键操作 |
| **Quicklinks** | 自定义快捷链接，输入缩写直达常用 URL |
| **Emoji Search** | 搜 Emoji，直接粘贴 |
| **Snippets** | 文本片段快捷输入，支持占位符 |
| **Hider** | 一键隐藏桌面图标，录屏/截图时干净 |

### 开发类

| 扩展 | 作用 |
|---|---|
| **Git** | 查看当前仓库分支、状态，快捷提交 |
| **GitHub** | 搜仓库、Issue、PR，直接跳转 |
| **Kill Process** | 按端口或名字杀进程，比 `lsof + kill` 快十倍 |
| **Port Manager** | 看谁占用了 3000/8080 |
| **npm** | 搜包、看版本、直接复制安装命令 |
| **Tailwind CSS** | 查 class 名和属性 |

### 日常类

| 扩展 | 作用 |
|---|---|
| **System Monitoring** | CPU/内存/网络实时曲线 |
| **Timer** | 番茄钟、倒计时 |
| **Calendar** | 会议日程，一键加入 |
| **Translate** | 划词翻译 |
| **Currency Exchange** | 汇率换算 |
| **Define Word** | 词典 |

**装扩展的原则**：用到再装，别一次性装五十个。Raycast 主窗口响应快是核心体验，扩展太多会拖慢。

## Quicklinks：最被低估的功能

Quicklinks 让你用几个字符直达任何 URL，带参数。

设置 → **Extensions → Quicklinks → Add Quicklink**：

| 名称 | Link | 效果 |
|---|---|---|
| `gh` | `https://github.com/{argument}` | `gh astro` → Astro 仓库 |
| `npm` | `https://www.npmjs.com/package/{argument}` | `npm restic` → restic 包页 |
| `mdn` | `https://developer.mozilla.org/search?q={argument}` | `mdn fetch` → MDN 文档 |
| `cf` | `https://dash.cloudflare.com/?to=/:account/{argument}` | 直达 CF 面板 |
| `g` | `https://www.google.com/search?q={argument}` | 快速搜索 |

**进阶：带预设的 Quicklink**。比如查 Cloudflare 文档：

```
https://developers.cloudflare.com/search/?q={argument}
```

输入 `cfd r2` 直接搜 R2 文档。这比开浏览器、点收藏夹、再点搜索框快得多。

## 自定义脚本

Raycast 支持直接写脚本作为命令。**这是它和普通启动器的分水岭。**

以"查天气"为例，新建 **Script Command**：

```bash
#!/bin/bash

# 必填：元数据
# @raycast.schemaVersion 1
# @raycast.title 查天气
# @raycast.mode inline
# @raycast.packageName 我的脚本

# 参数：城市
# @raycast.argument1 { "type": "text", "placeholder": "城市", "optional": true }

CITY="${1:-西安}"
curl -s "wttr.in/${CITY}?format=3"
```

`@raycast.mode inline` 表示结果直接显示在 Raycast 窗口里，不弹终端。

其他常用 mode：

| mode | 行为 |
|---|---|
| `inline` | 结果显示在 Raycast 窗口 |
| `fullOutput` | 打开终端显示完整输出 |
| `silent` | 后台执行，只提示成功/失败 |
| `compact` | 显示在窗口底部状态栏 |

### 更多实用脚本

**查公网 IP**：

```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title 我的 IP
# @raycast.mode inline
curl -s https://api.ipify.org
```

**生成随机密码**：

```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title 随机密码
# @raycast.mode inline
openssl rand -base64 18 | tr -d '/+=' | head -c 20
```

**快速记一笔到文件**：

```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title 快速记录
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "内容" }

echo "$(date '+%Y-%m-%d %H:%M') $1" >> ~/notes/inbox.md
```

**脚本放在哪**：Raycast 设置 → **Extensions → Script Directories**，指定一个目录（比如 `~/raycast-scripts`），里面的可执行脚本自动成为命令。

## AI 集成

Raycast 内置 AI 命令（免费版有额度限制）：

- **AI Chat**：`⌘⌃Space` 唤起，直接对话
- **AI Commands**：选中文本 → 自定义 AI 指令（总结、翻译、改写）
- **AI Snippets**：让 AI 帮你生成片段

**最有用的配置**：把 AI Chat 的模型设成 Claude，然后在设置里加几个自定义命令：

| 命令 | Prompt |
|---|---|
| 总结 | 用不超过三句话总结下面内容 |
| 找错 | 检查下面代码的 bug，直接给修复后的代码 |
| 转英文 | 把下面内容翻译成地道的英文 |

这样任何应用里选中文字，`⌘⌃Space` 就能处理，不用切窗口。

## Snippets：文本片段

比系统的"文本替换"强在支持**动态占位符**：

```
---
name: 邮件签名
text: |
  ——
  {name}
  {date}
---
```

还支持 `{clipboard}`（剪贴板内容）、`{cursor}`（光标位置）、`{date}`、`{time}` 等。

常用片段：

- 邮箱签名
- 常用回复模板（"收到，我看看"）
- 代码片段（license header、常用 import）
- 地址信息

## Aliases：命令别名

给常用命令设短别名。比如把"锁屏"设成 `lock`，"清空废纸篓"设成 `empty`，`sleep` 设成睡眠。

设置 → **Extensions → Aliases**，把长命令名映射到一两个字符。用得多了，Raycast 会记住你的使用频率，常用命令自动排前面。

## 我的推荐配置

如果只改五个设置：

1. **快捷键改 `⌥ Space`**，关掉 Spotlight 的
2. **开 Clipboard History**，设 `⌘⌥V`
3. **配 Window Management** 快捷键（左半屏 `⌘⌃←`，右半屏 `⌘⌃→`）
4. **建 5 个 Quicklinks**（gh / npm / mdn / g / 你常用的内部系统）
5. **AI Chat 模型设 Claude**，加"总结"和"找错"两个自定义命令

这五个配完，Raycast 就从"一个启动器"变成"每天都在用的操作中枢"。

## 小结

Raycast 的核心价值不是"搜得快"，而是**把零散的操作收进一个入口**：查东西、剪贴板、管窗口、跑脚本、问 AI，全在一个 `⌥ Space` 里。

迁移成本很低——装完改个快捷键，用一周就回不去了。Mac 用户如果只装一个效率工具，就是它。

Windows 用户别羡慕，PowerToys + PowerToys Run 能凑出七八成效果，配置见《Windows 包管理器 winget 完全指南》里 PowerToys 那段。
