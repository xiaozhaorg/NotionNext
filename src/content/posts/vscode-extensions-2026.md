---
title: 2026 年 VS Code 必备插件推荐：让开发效率翻倍的 20 个神器
pubDatetime: "2026-07-21T00:00:00.000Z"
modDatetime: "2026-10-24T00:00:00.000Z"
description: 精选 2026 年最值得安装的 20 个 VS Code 插件，按 AI 编程、代码美化、Git 增强、效率工具、主题外观、远程开发六类，附安装命令与实用配置。
author: 小吒
tags:
  - 开发工具
  - 免费工具
  - 教程
draft: false
sourceUrl: "https://xiaozha.org/article/vscode-extensions-2026"
ogImage: "/images/vscode-extensions-2026-real.jpg"
coverAlt: "MacBook 旁摆放着耳机与音乐播放器界面"
enSlug: "vscode-extensions-2026"
---

VS Code 的真正威力来自插件生态。装对 20 个，效率提升是实打实的；装错 50 个，启动慢一半还互相冲突。

这篇按用途分类，每个插件说明**它解决什么问题、值不值得装**。文末给一条命令批量安装。

## 一、AI 编程类

### Codeium —— 免费 AI 补全首选

个人用户**完全免费无限用**，支持 70+ 语言，补全速度快，还带 AI 聊天。

```bash
code --install-extension Codeium.codeium
```

适合不想为 Copilot 付费的人。功能上略逊于 Copilot，但对个人开发够用。详细的横向对比见《2026 免费 AI 编程助手横评》。

### GitHub Copilot —— 业界标杆

补全质量和上下文理解仍是第一梯队。免费版每月有一定额度，个人轻度使用够。

```bash
code --install-extension GitHub.copilot
```

**建议**：先用免费版试试，觉得值再订阅。Codeium 和 Copilot 可以共存，冲突时在设置里选默认补全提供者。

### Tabnine —— 注重隐私

基础补全用本地模型，代码不上传。公司项目不能连外网时的选择。

```bash
code --install-extension TabNine.tabnine-vscode
```

免费版只有基础补全，AI 聊天要付费。

### CodeGeeX —— 国产开源

智谱 AI 出品，完全开源可本地部署，中文理解好。

```bash
code --install-extension CodeGeeX.codegee-x
```

## 二、代码美化与质量

### Prettier —— 格式化标准答案

装完设成默认格式化器，团队代码风格自动统一。

```bash
code --install-extension esbenp.prettier-vscode
```

推荐配置（`settings.json`）：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "prettier.singleQuote": true,
  "prettier.trailingComma": "all"
}
```

### ESLint —— JavaScript 质量守门员

实时标出问题，配合 `--fix` 自动修。

```bash
code --install-extension dbaeumer.vscode-eslint
```

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

保存时自动修复能修的问题——这个配置能省大量手动改的时间。

### Stylelint —— CSS/Less/SCSS 检查

前端项目的样式规范守门员。

```bash
code --install-extension stylelint.vscode-stylelint
```

### SonarLint —— 多语言代码质量

不止风格问题，能查出潜在的 bug 和坏味道。支持 Java、JS、Python、Go 等。

```bash
code --install-extension SonarSource.sonarlint-vscode
```

## 三、效率工具

### GitLens —— Git 增强（必装）

行内显示每行代码的最后修改人和提交，鼠标悬停看详情。还有文件历史、分支对比。

```bash
code --install-extension eamodio.gitlens
```

**这是我认为最值得装的插件**，没有之一。读懂"这行为什么这么写"的效率提升巨大。

想了解更多 Git 命令本身，见《Git 进阶技巧》。

### Project Manager —— 多项目管理

在多个项目间快速切换，支持标签分组。项目多于三个就该装。

```bash
code --install-extension alefragnani.project-manager
```

### Todo Tree —— 注释待办可视化

把代码里的 `TODO`、`FIXME`、`BUG` 注释收集成侧边栏树，点击跳转。

```bash
code --install-extension Gruntfuggly.todo-tree
```

自定义标记：

```json
{
  "todo-tree.general.tags": ["TODO", "FIXME", "BUG", "HACK", "XXX"],
  "todo-tree.highlights.customHighlight": {
    "TODO": { "icon": "check", "foreground": "#ffbd2a" },
    "FIXME": { "icon": "flame", "foreground": "#ff4d4d" }
  }
}
```

### Bookmarks —— 代码书签

给常用位置打标签，快速跳回。大文件里找自己的代码很有用。

```bash
code --install-extension alefragnani.bookmarks
```

快捷键：`Ctrl+Alt+K` 打标签，`Ctrl+Alt+L` 跳下一个。

### Auto Rename Tag —— 自动重命名标签

改 `<div>` 开头，结尾自动跟着变。前端必备。

```bash
code --install-extension formulahendry.auto-rename-tag
```

### Path Intellisense —— 路径补全

输入路径时自动补全文件名。手写 `import` 时的刚需。

```bash
code --install-extension christian-kohler.path-intellisense
```

### Chinese Lorem —— 中文假数据

生成中文占位文本，做中文界面原型时不用再打"测试测试测试"。

```bash
code --install-extension Chinamama.chinese-lorem
```

## 四、主题外观

### One Dark Pro —— 经典主题

Atom 那款经典暗色主题的 VS Code 移植，护眼且辨识度高。

```bash
code --install-extension zhuangtongfa.material-theme
```

（`One Dark Pro` 的 ID 是 `zhuangtongfa.onedark-pro`）

### Material Icon Theme —— 文件图标

给不同文件类型上图标，目录树里一眼找到目标。纯粹提升幸福感。

```bash
code --install-extension PKief.material-icon-theme
```

### 字体建议

不是插件，但值得配。**编程字体用等宽 + 连字**，`JetBrains Mono`、`Fira Code`、`Maple Mono`（国产，中文注释显示好）都不错。

`settings.json`：

```json
{
  "editor.fontFamily": "'Maple Mono NF CN', 'JetBrains Mono', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 14
}
```

**Maple Mono 对中文支持好**——中英文混排时代码注释不会出现方框。

## 五、远程开发

### Remote - SSH —— 远程开发

直接在 VS Code 里连服务器开发，文件、终端、调试全在远程。**自托管玩家必备。**

```bash
code --install-extension ms-vscode-remote.remote-ssh
```

配置 `~/.ssh/config` 后，`Ctrl+Shift+P` → `Remote-SSH: Connect to Host` 就能连。

配合《Ubuntu Server 初始化配置》里的 SSH 加固，远程开发既方便又安全。

### Dev Containers —— 容器内开发

把开发环境打包成容器，团队环境完全一致，不用在本地装一堆依赖。

```bash
code --install-extension ms-vscode-remote.remote-containers
```

适合 Python/Node 多版本共存、或者"我这能跑你那不能跑"的玄学问题。

### Live Server —— 本地静态服务器

改 HTML/CSS 自动刷新，做静态页面时方便。

```bash
code --install-extension ritwickdey.LiveServer
```

## 一条命令批量安装

把上面的整理成脚本，新机器一条命令装完：

**PowerShell**（`install-vscode-ext.ps1`）：

```powershell
$extensions = @(
  "Codeium.codeium",
  "GitHub.copilot",
  "esbenp.prettier-vscode",
  "dbaeumer.vscode-eslint",
  "eamodio.gitlens",
  "alefragnani.project-manager",
  "Gruntfuggly.todo-tree",
  "formulahendry.auto-rename-tag",
  "christian-kohler.path-intellisense",
  "PKief.material-icon-theme",
  "ms-vscode-remote.remote-ssh"
)

foreach ($ext in $extensions) {
  Write-Host "==> $ext"
  code --install-extension $ext --force
}
Write-Host "完成"
```

**bash**：

```bash
for ext in Codeium.codeium GitHub.copilot esbenp.prettier-vscode \
  dbaeumer.vscode-eslint eamodio.gitlens alefragnani.project-manager; do
  echo "==> $ext"
  code --install-extension "$ext" --force
done
```

建议把这个脚本存 Git 仓库，和你的 `settings.json` 一起版本管理。换机器五分钟恢复全套环境。

**同步 settings.json**：VS Code 的 **Settings Sync** 功能（登录 GitHub/Microsoft 账号）能自动同步设置、快捷键、插件列表。开着它，上面这脚本就是备用。

## 装插件的三条建议

**1. 少而精，不要囤。** 每个插件都拖慢启动、占内存、可能互相冲突。20 个精心选的 > 100 个随手装的。

**2. 按项目启停。** 有些插件只对特定项目有用（比如数据库客户端、框架专用）。用 **Profile** 功能（VS Code 1.75+）给不同项目配不同插件集，比全局全装更清爽。

**3. 定期清理。** `Ctrl+Shift+X` → 搜 `@installed`，按安装时间排序，看着眼生的卸掉。我每季度清一次，每次都能卸掉几个忘了为什么装的。

## 小结

如果只装三个，我选：**GitLens**（读懂代码）、**Prettier + ESLint**（统一风格）、**Remote - SSH**（远程开发）。

这三个覆盖了日常最高频的痛点。AI 补全按预算在 Codeium 和 Copilot 之间选一个，剩下的按需加。

工具是杠杆，但杠杆撬不动不想动的人。装完插件，重点还是回到代码本身。
